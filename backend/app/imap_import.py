from __future__ import annotations

from email import policy
from email.header import decode_header
from email.parser import BytesParser
from pathlib import Path
import imaplib
import re
import uuid

from sqlalchemy.orm import Session

from .config import get_settings
from .services import process_report_file


REPORT_EXTENSIONS = (".xml", ".zip", ".gz", ".gzip")
REPORT_CONTENT_TYPES = {
    "application/zip",
    "application/x-zip-compressed",
    "application/gzip",
    "application/x-gzip",
    "application/xml",
    "text/xml",
    "application/octet-stream",
}


def _decode_header_value(value: str | None) -> str | None:
    if not value:
        return None
    try:
        parts = decode_header(value)
        decoded: list[str] = []
        for part, encoding in parts:
            if isinstance(part, bytes):
                decoded.append(part.decode(encoding or "utf-8", errors="replace"))
            else:
                decoded.append(part)
        return "".join(decoded).strip() or None
    except Exception:
        return value.strip() or None


def _safe_filename(name: str | None) -> str:
    decoded = _decode_header_value(name)
    if not decoded:
        return f"attachment-{uuid.uuid4().hex}.bin"

    filename = Path(decoded).name.strip().replace(" ", "_")
    filename = re.sub(r"[^A-Za-z0-9._!@+=,-]", "_", filename)
    filename = re.sub(r"_+", "_", filename).strip("._")
    return filename or f"attachment-{uuid.uuid4().hex}.bin"


def _looks_like_zip(payload: bytes) -> bool:
    return payload.startswith(b"PK\x03\x04") or payload.startswith(b"PK\x05\x06") or payload.startswith(b"PK\x07\x08")


def _looks_like_gzip(payload: bytes) -> bool:
    return payload.startswith(b"\x1f\x8b")


def _looks_like_xml(payload: bytes) -> bool:
    head = payload[:4096].lstrip()
    return head.startswith(b"<?xml") or head.startswith(b"<feedback")


def _detect_extension(filename: str, content_type: str, payload: bytes) -> str | None:
    lower = filename.lower()
    if lower.endswith(".zip"):
        return ".zip"
    if lower.endswith((".gz", ".gzip")):
        return ".gz"
    if lower.endswith(".xml"):
        return ".xml"

    if _looks_like_zip(payload):
        return ".zip"
    if _looks_like_gzip(payload):
        return ".gz"
    if _looks_like_xml(payload):
        return ".xml"

    if content_type in {"application/zip", "application/x-zip-compressed"}:
        return ".zip"
    if content_type in {"application/gzip", "application/x-gzip"}:
        return ".gz"
    if content_type in {"application/xml", "text/xml"}:
        return ".xml"

    return None


def _is_probable_dmarc_report(filename: str, content_type: str, payload: bytes) -> bool:
    lower = filename.lower()

    if lower.endswith(REPORT_EXTENSIONS):
        return True

    if _looks_like_zip(payload) or _looks_like_gzip(payload) or _looks_like_xml(payload):
        return True

    # Google and some other senders may use application/octet-stream with
    # a non-standard filename. Keep this as a candidate only when the payload
    # magic above already matches, to avoid importing arbitrary attachments.
    if content_type in REPORT_CONTENT_TYPES and _detect_extension(filename, content_type, payload):
        return True

    return False


def _stored_filename(filename: str, content_type: str, payload: bytes) -> str:
    extension = _detect_extension(filename, content_type, payload)
    if not extension:
        return filename

    lower = filename.lower()
    if extension == ".zip" and lower.endswith(".zip"):
        return filename
    if extension == ".gz" and lower.endswith((".gz", ".gzip")):
        return filename
    if extension == ".xml" and lower.endswith(".xml"):
        return filename

    # Preserve the original name but add the extension the parser needs.
    if lower.endswith(".bin"):
        return filename[:-4] + extension
    return filename + extension


def _iter_message_parts(message):
    for part in message.walk():
        if part.is_multipart():
            continue
        yield part


def import_from_imap(db: Session, upload_dir: str | Path = "/app/uploads") -> dict:
    """Import DMARC aggregate reports from IMAP.

    This version is deliberately more tolerant than the original importer:
    - accepts .xml, .zip, .gz and .gzip by filename,
    - accepts ZIP/GZIP/XML by payload magic bytes even if the filename is odd,
    - accepts common MIME types used by Google and other receivers,
    - does not mark a message as seen when a candidate report fails to import.
    """

    settings = get_settings()
    if not settings.imap_import_enabled:
        return {
            "status": "disabled",
            "processed_attachments": 0,
            "messages_seen": 0,
            "message": "IMAP import je vypnutý přes IMAP_IMPORT_ENABLED=false.",
        }

    if not settings.imap_password:
        return {
            "status": "error",
            "message": "IMAP_PASSWORD není nastavené.",
            "processed_attachments": 0,
            "messages_seen": 0,
        }

    upload_path = Path(upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)

    client_cls = imaplib.IMAP4_SSL if settings.imap_ssl else imaplib.IMAP4

    messages_seen = 0
    attachments_seen = 0
    candidate_attachments = 0
    processed_attachments = 0
    duplicate_attachments = 0
    skipped_attachments = 0
    failed_attachments = 0
    errors: list[str] = []

    with client_cls(settings.imap_host, settings.imap_port) as mail:
        mail.login(settings.imap_user, settings.imap_password)
        mail.select(settings.imap_folder)

        status, data = mail.search(None, settings.imap_search)
        if status != "OK":
            return {
                "status": "error",
                "message": f"IMAP search selhal pro výraz: {settings.imap_search}",
                "processed_attachments": 0,
                "messages_seen": 0,
            }

        ids = data[0].split() if data and data[0] else []

        for msg_id in ids:
            messages_seen += 1
            message_has_failed_candidate = False

            status, msg_data = mail.fetch(msg_id, "(RFC822)")
            if status != "OK" or not msg_data or not msg_data[0]:
                errors.append(f"Fetch selhal pro zprávu {msg_id!r}.")
                continue

            try:
                raw_message = msg_data[0][1]
                message = BytesParser(policy=policy.default).parsebytes(raw_message)
            except Exception as exc:
                errors.append(f"Zprávu {msg_id!r} nejde naparsovat: {exc}")
                continue

            subject = _decode_header_value(message.get("subject")) or "bez předmětu"

            for part in _iter_message_parts(message):
                filename = _safe_filename(part.get_filename())
                content_type = (part.get_content_type() or "").lower()
                disposition = (part.get_content_disposition() or "").lower()

                payload = part.get_payload(decode=True)
                if not payload:
                    continue

                has_filename = bool(part.get_filename())
                is_attachment = disposition == "attachment" or has_filename
                is_report = _is_probable_dmarc_report(filename, content_type, payload)

                if is_attachment:
                    attachments_seen += 1

                if not is_report:
                    skipped_attachments += 1
                    continue

                candidate_attachments += 1
                final_filename = _stored_filename(filename, content_type, payload)
                stored = upload_path / f"imap-{uuid.uuid4().hex}-{final_filename}"
                stored.write_bytes(payload)

                try:
                    result = process_report_file(db, stored, final_filename)
                    if result.get("status") == "duplicate":
                        duplicate_attachments += 1
                    else:
                        processed_attachments += 1
                except Exception as exc:
                    failed_attachments += 1
                    message_has_failed_candidate = True
                    errors.append(
                        f"{final_filename} ze zprávy {msg_id.decode(errors='ignore') if isinstance(msg_id, bytes) else msg_id} "
                        f"({subject}): {exc}"
                    )

            if settings.imap_mark_seen and not message_has_failed_candidate:
                mail.store(msg_id, "+FLAGS", "\\Seen")

        mail.logout()

    status = "ok"
    if errors:
        status = "partial" if processed_attachments or duplicate_attachments else "error"

    return {
        "status": status,
        "messages_seen": messages_seen,
        "attachments_seen": attachments_seen,
        "candidate_attachments": candidate_attachments,
        "processed_attachments": processed_attachments,
        "duplicate_attachments": duplicate_attachments,
        "skipped_attachments": skipped_attachments,
        "failed_attachments": failed_attachments,
        "errors": errors,
    }


if __name__ == "__main__":
    from .db import SessionLocal, init_db

    init_db()
    db = SessionLocal()
    try:
        print(import_from_imap(db))
    finally:
        db.close()
