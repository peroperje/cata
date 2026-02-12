from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class GmailJob(Base):
    __tablename__ = "gmail_jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    company = Column(String)
    url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_irrelevant = Column(Boolean, default=False)
    is_used = Column(Boolean, default=False)

    job_application_id = Column(Integer, ForeignKey("job_applications.id", ondelete="SET NULL"), nullable=True)
    job_application = relationship("JobApplication")

class GmailSettings(Base):
    __tablename__ = "gmail_settings"

    id = Column(Integer, primary_key=True, index=True)
    fetch_interval_minutes = Column(Integer, default=15)
    last_sync_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

class GmailFilter(Base):
    __tablename__ = "gmail_filters"

    id = Column(Integer, primary_key=True, index=True)
    email_sender = Column(String, unique=True, index=True) # e.g., "jobs-noreply@linkedin.com"
