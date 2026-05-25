from celery import Celery
from .config import get_settings
from .db import SessionLocal, init_db
from .imap_import import import_from_imap
from .services import process_report_file

settings = get_settings()
celery_app = Celery("dmarc_logy", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.beat_schedule = {"imap-import": {"task": "app.worker.import_imap_reports", "schedule": float(settings.imap_import_interval_seconds)}}
celery_app.conf.timezone = "Europe/Prague"

@celery_app.task(name="app.worker.import_imap_reports")
def import_imap_reports():
    init_db(); db = SessionLocal()
    try: return import_from_imap(db)
    finally: db.close()

@celery_app.task(name="app.worker.process_report_path")
def process_report_path(path: str, original_filename: str | None = None):
    init_db(); db = SessionLocal()
    try: return process_report_file(db, path, original_filename)
    finally: db.close()
