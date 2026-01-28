from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.schemas import schemas
from app.services import job_applications as service

router = APIRouter()

@router.post("/job-applications", response_model=schemas.JobApplication)
def create_job_application(application: schemas.JobApplicationCreate, db: Session = Depends(get_db)):
    return service.create_job_application(db=db, application=application)

@router.get("/job-applications", response_model=List[schemas.JobApplication])
def read_job_applications(
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    job_title: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    applications = service.get_job_applications(
        db, skip=skip, limit=limit, status=status, company=company, job_title=job_title
    )
    return applications

@router.get("/job-applications/{application_id}", response_model=schemas.JobApplication)
def read_job_application(application_id: int, db: Session = Depends(get_db)):
    db_application = service.get_job_application(db, application_id=application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Job application not found")
    return db_application

@router.patch("/job-applications/{application_id}", response_model=schemas.JobApplication)
def update_job_application(
    application_id: int, 
    application: schemas.JobApplicationUpdate, 
    db: Session = Depends(get_db)
):
    db_application = service.update_job_application(db, application_id=application_id, application=application)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Job application not found")
    return db_application

@router.delete("/job-applications/{application_id}")
def delete_job_application(application_id: int, db: Session = Depends(get_db)):
    success = service.delete_job_application(db, application_id=application_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job application not found")
    return {"message": "Job application deleted successfully"}
