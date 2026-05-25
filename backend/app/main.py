from __future__ import annotations
from pathlib import Path
import shutil, uuid
from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .config import get_settings
from .db import get_db, init_db
from .imap_import import import_from_imap
from .parser import DmarcParseError
from .auth import LoginRequest, authenticate, clear_auth_cookie, current_user_from_request, require_auth, set_auth_cookie
from .services import dashboard, list_reports, list_sources, process_report_file, recommendations, source_detail, update_source_classification, update_source_classification_by_id

settings = get_settings()
app = FastAPI(title=settings.app_name)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def on_startup() -> None:
    init_db(); Path("/app/uploads").mkdir(parents=True, exist_ok=True); Path("/app/archive").mkdir(parents=True, exist_ok=True)

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "dmarc-logy-api"}

@app.get("/")
def root() -> dict:
    return {"message": "DMARC Logy API běží", "docs": "/docs"}

@app.post("/auth/login")
def login(payload: LoginRequest, response: Response) -> dict:
    if not settings.auth_enabled:
        return {"authenticated": True, "username": settings.auth_username, "auth_enabled": False}
    if not authenticate(payload.username, payload.password):
        raise HTTPException(status_code=401, detail="Neplatné přihlašovací údaje")
    set_auth_cookie(response, payload.username)
    return {"authenticated": True, "username": payload.username, "auth_enabled": True}


@app.post("/auth/logout")
def logout(response: Response) -> dict:
    clear_auth_cookie(response)
    return {"authenticated": False}


@app.get("/auth/me")
def auth_me(request: Request) -> dict:
    user = current_user_from_request(request)
    if not user:
        raise HTTPException(status_code=401, detail="Přihlášení je vyžadováno")
    return {"authenticated": True, "username": user, "auth_enabled": settings.auth_enabled}


@app.post("/upload")
def upload_report(file: UploadFile = File(...), db: Session = Depends(get_db), user: str = Depends(require_auth)) -> dict:
    filename = file.filename or "report.bin"
    if not filename.lower().endswith((".xml", ".zip", ".gz")): raise HTTPException(status_code=400, detail="Podporované jsou pouze soubory .xml, .zip a .gz")
    max_bytes = settings.upload_max_mb * 1024 * 1024; upload_dir = Path("/app/uploads"); upload_dir.mkdir(parents=True, exist_ok=True)
    stored_path = upload_dir / f"upload-{uuid.uuid4().hex}-{Path(filename).name}"; size = 0
    with stored_path.open("wb") as out:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk: break
            size += len(chunk)
            if size > max_bytes:
                stored_path.unlink(missing_ok=True); raise HTTPException(status_code=413, detail=f"Soubor je větší než limit {settings.upload_max_mb} MB")
            out.write(chunk)
    try:
        result = process_report_file(db, stored_path, filename)
        try: shutil.copy2(stored_path, Path("/app/archive") / stored_path.name)
        except Exception: pass
        return result
    except DmarcParseError as exc: raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc: raise HTTPException(status_code=500, detail=str(exc))

@app.get("/dashboard")
def get_dashboard(timeline_mode: str = Query("report", pattern="^(report|import)$"), db: Session = Depends(get_db), user: str = Depends(require_auth)) -> dict:
    return dashboard(db, timeline_mode=timeline_mode)

@app.get("/sources")
def get_sources(db: Session = Depends(get_db), user: str = Depends(require_auth)) -> list[dict]:
    return list_sources(db)

@app.get("/sources/{source_ip}")
def get_source(source_ip: str, db: Session = Depends(get_db), user: str = Depends(require_auth)) -> dict:
    try: return source_detail(db, source_ip)
    except ValueError as exc: raise HTTPException(status_code=404, detail=str(exc))

class SourceUpdate(BaseModel):
    classification: str
    notes: str | None = None

@app.patch("/sources/by-id/{source_id}")
def patch_source_by_id(source_id: int, payload: SourceUpdate, db: Session = Depends(get_db), user: str = Depends(require_auth)) -> dict:
    try: return update_source_classification_by_id(db, source_id, payload.classification, payload.notes)
    except ValueError as exc: raise HTTPException(status_code=400, detail=str(exc))

@app.patch("/sources/{source_ip}")
def patch_source(source_ip: str, payload: SourceUpdate, db: Session = Depends(get_db), user: str = Depends(require_auth)) -> dict:
    try: return update_source_classification(db, source_ip, payload.classification, payload.notes)
    except ValueError as exc: raise HTTPException(status_code=400, detail=str(exc))

@app.get("/reports")
def get_reports(db: Session = Depends(get_db), user: str = Depends(require_auth)) -> list[dict]:
    return list_reports(db)

@app.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db), user: str = Depends(require_auth)) -> list[dict]:
    return recommendations(db)

@app.post("/imap/run-now")
def run_imap_now(db: Session = Depends(get_db), user: str = Depends(require_auth)) -> dict:
    return import_from_imap(db)
