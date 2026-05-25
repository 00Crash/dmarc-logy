from __future__ import annotations
from email import policy
from email.parser import BytesParser
from pathlib import Path
import imaplib, uuid
from sqlalchemy.orm import Session
from .config import get_settings
from .services import process_report_file

def _safe_filename(name: str | None) -> str:
    if not name: return f"attachment-{uuid.uuid4().hex}.bin"
    clean = Path(name).name.replace(" ", "_")
    return clean or f"attachment-{uuid.uuid4().hex}.bin"

def import_from_imap(db: Session, upload_dir: str | Path = "/app/uploads") -> dict:
    settings = get_settings()
    if not settings.imap_import_enabled: return {"status": "disabled", "processed_attachments": 0, "messages_seen": 0}
    if not settings.imap_password: return {"status": "error", "message": "IMAP_PASSWORD není nastavené", "processed_attachments": 0, "messages_seen": 0}
    upload_path = Path(upload_dir); upload_path.mkdir(parents=True, exist_ok=True)
    client_cls = imaplib.IMAP4_SSL if settings.imap_ssl else imaplib.IMAP4
    processed = 0; errors: list[str] = []; messages_seen = 0
    with client_cls(settings.imap_host, settings.imap_port) as mail:
        mail.login(settings.imap_user, settings.imap_password); mail.select(settings.imap_folder)
        status, data = mail.search(None, settings.imap_search)
        if status != "OK": return {"status": "error", "message": "IMAP search selhal", "processed_attachments": 0, "messages_seen": 0}
        ids = data[0].split() if data and data[0] else []
        for msg_id in ids:
            messages_seen += 1
            status, msg_data = mail.fetch(msg_id, "(RFC822)")
            if status != "OK": errors.append(f"Fetch selhal pro zprávu {msg_id!r}"); continue
            message = BytesParser(policy=policy.default).parsebytes(msg_data[0][1])
            for part in message.iter_attachments():
                filename = _safe_filename(part.get_filename()); lower = filename.lower()
                if not lower.endswith((".xml", ".zip", ".gz")): continue
                payload = part.get_payload(decode=True)
                if not payload: continue
                stored = upload_path / f"imap-{uuid.uuid4().hex}-{filename}"; stored.write_bytes(payload)
                try: process_report_file(db, stored, filename); processed += 1
                except Exception as exc: errors.append(f"{filename}: {exc}")
            if settings.imap_mark_seen: mail.store(msg_id, "+FLAGS", "\\Seen")
        mail.logout()
    return {"status": "ok" if not errors else "partial", "processed_attachments": processed, "messages_seen": messages_seen, "errors": errors}

if __name__ == "__main__":
    from .db import SessionLocal, init_db
    init_db(); db = SessionLocal()
    try: print(import_from_imap(db))
    finally: db.close()
