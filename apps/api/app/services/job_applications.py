from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional
from datetime import datetime
from app.models import models
from app.schemas import schemas

def create_job_application(db: Session, application: schemas.JobApplicationCreate):
    db_application = models.JobApplication(**application.dict())
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application

def get_job_application(db: Session, application_id: int):
    return db.query(models.JobApplication).filter(models.JobApplication.id == application_id).first()

def get_job_applications(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    company: Optional[str] = None,
    job_title: Optional[str] = None
):
    query = db.query(models.JobApplication)
    
    if status:
        query = query.filter(models.JobApplication.status == status)
    if company:
        query = query.filter(models.JobApplication.company.ilike(f"%{company}%"))
    if job_title:
        query = query.filter(models.JobApplication.title.ilike(f"%{job_title}%"))
        
    return query.order_by(desc(models.JobApplication.created_at)).offset(skip).limit(limit).all()

def update_job_application(db: Session, application_id: int, application: schemas.JobApplicationUpdate):
    db_application = get_job_application(db, application_id)
    if not db_application:
        return None
    
    update_data = application.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_application, key, value)
    
    db_application.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_application)
    return db_application

def delete_job_application(db: Session, application_id: int):
    db_application = get_job_application(db, application_id)
    if not db_application:
        return False
    
    db.delete(db_application)
    db.commit()
    return True
