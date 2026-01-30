from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from sentence_transformers import SentenceTransformer, util
import logging

logger = logging.getLogger(__name__)

# Load model once at startup
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("NLP model 'all-MiniLM-L6-v2' loaded successfully")
except Exception as e:
    logger.error(f"Error loading NLP model: {e}")
    model = None

router = APIRouter()

@router.post("/jobs/found", response_model=schemas.Job)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    # Calculate similarity score if model exists and CV exists
    similarity_score = 0.0
    is_irrelevant = False
    
    if model and job.content:
        # Get latest CV
        cv = db.query(models.CV).order_by(models.CV.created_at.desc()).first()
        if cv and cv.text:
            try:
                cv_embedding = model.encode(cv.text, convert_to_tensor=True)
                job_embedding = model.encode(job.content, convert_to_tensor=True)
                similarity_score = float(util.cos_sim(cv_embedding, job_embedding).item())
                is_irrelevant = similarity_score < 0.10  # Mark as irrelevant if it's a poor match
                logger.info(f"Calculated similarity score: {similarity_score:.4f} for job: {job.title}")
            except Exception as e:
                logger.error(f"Error calculating similarity: {e}")
        else:
            logger.warning("No CV text found for similarity calculation")
            
    db_job = models.Job(
        **job.dict(exclude={"similarity_score", "is_irrelevant"}),
        similarity_score=similarity_score,
        is_irrelevant=is_irrelevant
    )
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
