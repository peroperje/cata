from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import gmail as models
from app.schemas import gmail as schemas
from app.core.utils import normalize_url
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Gmail Jobs
@router.post("/gmail/jobs", response_model=schemas.GmailJob)
def create_gmail_job(job: schemas.GmailJobCreate, db: Session = Depends(get_db)):
    normalized_url = normalize_url(job.url)
    
    # Check if job already exists
    existing_job = db.query(models.GmailJob).filter(models.GmailJob.url == normalized_url).first()
    if existing_job:
        return existing_job

    db_job = models.GmailJob(
        **job.dict(exclude={"url"}),
        url=normalized_url
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/gmail/jobs", response_model=List[schemas.GmailJob])
def get_gmail_jobs(include_irrelevant: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.GmailJob)
    if not include_irrelevant:
        query = query.filter(models.GmailJob.is_irrelevant == False)
    return query.order_by(models.GmailJob.created_at.desc()).all()

@router.patch("/gmail/jobs/{job_id}/irrelevant", response_model=schemas.GmailJob)
def toggle_gmail_job_irrelevant(job_id: int, db: Session = Depends(get_db)):
    db_job = db.query(models.GmailJob).filter(models.GmailJob.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Gmail job not found")
    db_job.is_irrelevant = not db_job.is_irrelevant
    db.commit()
    db.refresh(db_job)
    return db_job

@router.patch("/gmail/jobs/{job_id}/used", response_model=schemas.GmailJob)
def toggle_gmail_job_used(job_id: int, db: Session = Depends(get_db)):
    db_job = db.query(models.GmailJob).filter(models.GmailJob.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Gmail job not found")
    db_job.is_used = not db_job.is_used
    db.commit()
    db.refresh(db_job)
    return db_job

@router.post("/gmail/jobs/{job_id}/link/{application_id}", response_model=schemas.GmailJob)
def link_gmail_job_to_application(job_id: int, application_id: int, db: Session = Depends(get_db)):
    db_job = db.query(models.GmailJob).filter(models.GmailJob.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Gmail job not found")
    
    db_job.job_application_id = application_id
    db_job.is_used = True
    db.commit()
    db.refresh(db_job)
    return db_job

# Gmail Settings
@router.get("/gmail/settings", response_model=schemas.GmailSettings)
def get_gmail_settings(db: Session = Depends(get_db)):
    settings = db.query(models.GmailSettings).first()
    if not settings:
        settings = models.GmailSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.patch("/gmail/settings", response_model=schemas.GmailSettings)
def update_gmail_settings(settings_update: schemas.GmailSettingsUpdate, db: Session = Depends(get_db)):
    db_settings = db.query(models.GmailSettings).first()
    if not db_settings:
        db_settings = models.GmailSettings()
        db.add(db_settings)
    
    for field, value in settings_update.dict(exclude_unset=True).items():
        setattr(db_settings, field, value)
    
    db.commit()
    db.refresh(db_settings)
    return db_settings

# Gmail Filters
@router.get("/gmail/filters", response_model=List[schemas.GmailFilter])
def get_gmail_filters(db: Session = Depends(get_db)):
    return db.query(models.GmailFilter).all()

@router.post("/gmail/filters", response_model=schemas.GmailFilter)
def create_gmail_filter(filter_in: schemas.GmailFilterCreate, db: Session = Depends(get_db)):
    existing = db.query(models.GmailFilter).filter(models.GmailFilter.email_sender == filter_in.email_sender).first()
    if existing:
        return existing
    
    db_filter = models.GmailFilter(**filter_in.dict())
    db.add(db_filter)
    db.commit()
    db.refresh(db_filter)
    return db_filter

@router.delete("/gmail/filters/{filter_id}")
def delete_gmail_filter(filter_id: int, db: Session = Depends(get_db)):
    db_filter = db.query(models.GmailFilter).filter(models.GmailFilter.id == filter_id).first()
    if not db_filter:
        raise HTTPException(status_code=404, detail="Filter not found")
    db.delete(db_filter)
    db.commit()
    return {"status": "success"}
