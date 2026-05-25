from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "DMARC Logy"
    app_url: str = "http://dmarc.ekostavby.local"
    environment: str = "production"
    database_url: str = "postgresql+psycopg://dmarc_logy:dmarc_logy@db:5432/dmarc_logy"
    redis_url: str = "redis://redis:6379/0"
    imap_host: str = "mail.ekostavbylouny.cz"
    imap_port: int = 993
    imap_ssl: bool = True
    imap_user: str = "dmarc@ekostavbylouny.info"
    imap_password: str = ""
    imap_folder: str = "INBOX"
    imap_search: str = "UNSEEN"
    imap_mark_seen: bool = True
    imap_import_enabled: bool = True
    imap_import_interval_seconds: int = 1800
    dmarc_report_address: str = "dmarc@ekostavbylouny.info"
    upload_max_mb: int = 25
    secret_key: str = "change-me"

    auth_enabled: bool = True
    auth_username: str = "admin"
    auth_password: str = "change-me"
    auth_session_hours: int = 12
    auth_cookie_name: str = "dmarc_session"
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

@lru_cache
def get_settings() -> Settings:
    return Settings()
