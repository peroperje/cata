from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean, Index, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class AIModel(Base):
    __tablename__ = "ai_models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    provider = Column(String)  # gemini, huggingface, etc.
    model_name = Column(String) # e.g. gemini-1.5-flash

    keys = relationship("UserKey", back_populates="model")

class UserKey(Base):
    __tablename__ = "user_keys"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("ai_models.id", ondelete="CASCADE"))
    api_key = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("AIModel", back_populates="keys")

class CV(Base):
    __tablename__ = "cvs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    text = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    url = Column(String)
    content = Column(String, nullable=True)
    similarity_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_irrelevant = Column(Boolean, default=False)
    is_used = Column(Boolean, default=False)

    job_application_id = Column(Integer, ForeignKey("job_applications.id", ondelete="SET NULL"), nullable=True)
    job_application = relationship("JobApplication", back_populates="jobs")

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    url = Column(String)
    company = Column(String)
    status = Column(String, default="Interested") # Interested, Applied, Interview, Offer, Rejected
    notes = Column(String, nullable=True)
    full_text_description = Column(String, nullable=True)
    is_favorite = Column(Boolean, default=False)
    is_irrelevant = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    jobs = relationship("Job", back_populates="job_application")
    autofill_result = relationship("AutofillResult", back_populates="job_application", uselist=False)

    __table_args__ = (
        Index("ix_job_applications_title_company_url", "title", "company", "url"),
        Index("ix_job_applications_title_company", "title", "company"),
    )

class JobPlatform(Base):
    __tablename__ = "job_platforms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    url = Column(String)
    description = Column(String, nullable=True)
    position = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AutofillResult(Base):
    __tablename__ = "autofill_results"

    id = Column(Integer, primary_key=True, index=True)
    job_application_id = Column(Integer, ForeignKey("job_applications.id", ondelete="CASCADE"), unique=True, index=True)
    form_data = Column(JSON)
    instruction = Column(String, nullable=True)
    model_name = Column(String)
    result = Column(JSON)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job_application = relationship("JobApplication", back_populates="autofill_result")

