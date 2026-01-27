from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.post("/jobs/found", response_model=schemas.Job)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    db_job = models.Job(**job.dict())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/jobs", response_model=List[schemas.Job])
def get_jobs(include_irrelevant: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.Job)
    if not include_irrelevant:
        query = query.filter(models.Job.is_irrelevant == False)
    return query.order_by(models.Job.created_at.desc()).all()

@router.patch("/jobs/{job_id}/irrelevant", response_model=schemas.Job)
def toggle_job_irrelevant(job_id: int, db: Session = Depends(get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    db_job.is_irrelevant = not db_job.is_irrelevant
    db.commit()
    db.refresh(db_job)
    return db_job

@router.patch("/jobs/{job_id}/favorite", response_model=schemas.Job)
def toggle_job_favorite(job_id: int, db: Session = Depends(get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    db_job.is_favorite = not db_job.is_favorite
    db.commit()
    db.refresh(db_job)
    return db_job
