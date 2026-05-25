from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base

def now_utc() -> datetime:
    return datetime.utcnow()

class Domain(Base):
    __tablename__ = "domains"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    domain_name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    dmarc_policy: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc, onupdate=now_utc)
    reports: Mapped[list["Report"]] = relationship(back_populates="domain")
    sources: Mapped[list["Source"]] = relationship(back_populates="domain")

class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (UniqueConstraint("org_name", "report_id", "date_begin", "date_end", name="uq_report_identity"), Index("ix_reports_domain_dates", "domain_id", "date_begin", "date_end"))
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    domain_id: Mapped[int] = mapped_column(ForeignKey("domains.id"), index=True)
    org_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    report_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    date_begin: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    date_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    raw_policy_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    raw_policy_adkim: Mapped[str | None] = mapped_column(String(16), nullable=True)
    raw_policy_aspf: Mapped[str | None] = mapped_column(String(16), nullable=True)
    raw_policy_p: Mapped[str | None] = mapped_column(String(32), nullable=True)
    raw_policy_sp: Mapped[str | None] = mapped_column(String(32), nullable=True)
    raw_policy_pct: Mapped[str | None] = mapped_column(String(16), nullable=True)
    source_filename: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc)
    domain: Mapped[Domain] = relationship(back_populates="reports")
    records: Mapped[list["ReportRecord"]] = relationship(back_populates="report", cascade="all, delete-orphan")

class ReportRecord(Base):
    __tablename__ = "report_records"
    __table_args__ = (Index("ix_records_source_ip", "source_ip"), Index("ix_records_report_source", "report_id", "source_ip"))
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id"), index=True)
    source_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    count: Mapped[int] = mapped_column(Integer, default=0)
    disposition: Mapped[str | None] = mapped_column(String(32), nullable=True)
    dkim_policy_result: Mapped[str | None] = mapped_column(String(32), nullable=True)
    spf_policy_result: Mapped[str | None] = mapped_column(String(32), nullable=True)
    header_from: Mapped[str | None] = mapped_column(String(255), nullable=True)
    envelope_from: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dkim_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dkim_result: Mapped[str | None] = mapped_column(String(64), nullable=True)
    spf_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    spf_result: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc)
    report: Mapped[Report] = relationship(back_populates="records")

class Source(Base):
    __tablename__ = "sources"
    __table_args__ = (UniqueConstraint("domain_id", "source_ip", name="uq_source_domain_ip"), Index("ix_sources_domain_classification", "domain_id", "classification"))
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    domain_id: Mapped[int] = mapped_column(ForeignKey("domains.id"), index=True)
    source_ip: Mapped[str] = mapped_column(String(64), index=True)
    reverse_dns: Mapped[str | None] = mapped_column(String(255), nullable=True)
    asn: Mapped[str | None] = mapped_column(String(64), nullable=True)
    provider_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    classification: Mapped[str] = mapped_column(String(32), default="unknown")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc, onupdate=now_utc)
    domain: Mapped[Domain] = relationship(back_populates="sources")

class ImportedFile(Base):
    __tablename__ = "imported_files"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sha256: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    original_filename: Mapped[str | None] = mapped_column(String(512), nullable=True)
    stored_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    reports_created: Mapped[int] = mapped_column(Integer, default=0)
    records_created: Mapped[int] = mapped_column(Integer, default=0)
    duplicate: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc, onupdate=now_utc)
