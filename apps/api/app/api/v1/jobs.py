from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.utils import normalize_url
from sentence_transformers import SentenceTransformer, util
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

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
    
    print(f"DEBUG: Receiving job for URL: {job.url}", flush=True)
    
    if model and job.content:
        # Get latest CV
        cv = db.query(models.CV).order_by(models.CV.created_at.desc()).first()
        if cv and cv.text:
            try:
                cv_embedding = model.encode(cv.text, convert_to_tensor=True)
                job_embedding = model.encode(job.content, convert_to_tensor=True)
                similarity_score = float(util.cos_sim(cv_embedding, job_embedding).item())
                is_irrelevant = similarity_score < 0.10  # Mark as irrelevant if it's a poor match
                print(f"DEBUG: Similarity score: {similarity_score:.4f}, Is irrelevant: {is_irrelevant}", flush=True)
            except Exception as e:
                print(f"DEBUG: Error calculating similarity: {e}", flush=True)
        else:
            logger.warning("DEBUG: No CV text found for similarity calculation")
            
    normalized_url = normalize_url(job.url)
    print(f"DEBUG: Normalized URL: {normalized_url}", flush=True)
    
    # Check if job already exists with this URL
    existing_job = db.query(models.Job).filter(models.Job.url == normalized_url).first()
    if existing_job:
        print(f"DEBUG: Job already exists in DB: {normalized_url} (ID: {existing_job.id})", flush=True)
        return existing_job

    print(f"DEBUG: Creating new job record for: {normalized_url}", flush=True)
    try:
        db_job = models.Job(
            **job.dict(exclude={"similarity_score", "is_irrelevant", "url"}),
            url=normalized_url,
            similarity_score=similarity_score,
            is_irrelevant=is_irrelevant
        )
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        print(f"DEBUG: Successfully saved job with ID: {db_job.id}", flush=True)
        return db_job
    except Exception as e:
        db.rollback()
        print(f"DEBUG: Exception during job save: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs", response_model=List[schemas.Job])
def get_jobs(include_irrelevant: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.Job).options(joinedload(models.Job.job_application))
    if not include_irrelevant:
        query = query.filter(models.Job.is_irrelevant == False)
    return query.order_by(models.Job.similarity_score.desc(), models.Job.created_at.desc()).all()

@router.post("/jobs/{job_id}/link/{application_id}", response_model=schemas.Job)
def link_job_to_application(job_id: int, application_id: int, db: Session = Depends(get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db_application = db.query(models.JobApplication).filter(models.JobApplication.id == application_id).first()
    if not db_application:
        raise HTTPException(status_code=404, detail="Job application not found")
    
    db_job.job_application_id = application_id
    db_job.is_used = True
    db.commit()
    db.refresh(db_job)
    return db_job

@router.post("/jobs/{job_id}/unlink", response_model=schemas.Job)
def unlink_job_from_application(job_id: int, db: Session = Depends(get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db_job.job_application_id = None
    db.commit()
    db.refresh(db_job)
    return db_job

@router.patch("/jobs/{job_id}/irrelevant", response_model=schemas.Job)
def toggle_job_irrelevant(job_id: int, db: Session = Depends(get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    db_job.is_irrelevant = not db_job.is_irrelevant
    db.commit()
    db.refresh(db_job)
    return db_job

@router.patch("/jobs/{job_id}/used", response_model=schemas.Job)
def toggle_job_used(job_id: int, db: Session = Depends(get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    db_job.is_used = not db_job.is_used
    db.commit()
    db.refresh(db_job)
    return db_job
