from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.schemas import schemas
from app.services import job_applications as service
from app.services.ai.factory import AIProviderFactory
from app.models import models

router = APIRouter()

@router.post("/job-applications", response_model=schemas.JobApplication)
async def create_job_application(application: schemas.JobApplicationCreate, db: Session = Depends(get_db)):
    return await service.create_job_application(db=db, application=application)

@router.get("/job-applications", response_model=List[schemas.JobApplication])
def read_job_applications(
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    job_title: Optional[str] = Query(None),
    url: Optional[str] = Query(None),
    is_favorite: Optional[bool] = Query(None),
    is_irrelevant: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    applications = service.get_job_applications(
        db, skip=skip, limit=limit, status=status, company=company, job_title=job_title,
        url=url, is_favorite=is_favorite, is_irrelevant=is_irrelevant
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

@router.post("/job-applications/extract-metadata", response_model=schemas.MetadataExtractionResponse)
async def extract_metadata(request: schemas.MetadataExtractionRequest, db: Session = Depends(get_db)):
    # 1. Get model info
    model = db.query(models.AIModel).filter(models.AIModel.id == request.modelId).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # 2. Get user key
    user_key = db.query(models.UserKey).filter(models.UserKey.model_id == model.id).order_by(models.UserKey.created_at.desc()).first()
    if not user_key:
        raise HTTPException(status_code=404, detail=f"No API key found for {model.name}")

    # 3. Get provider
    try:
        provider = AIProviderFactory.get_provider(model.provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 4. Call provider
    try:
        result = await provider.extract_metadata(
            page_text=request.pageText,
            api_key=user_key.api_key,
            model_name=model.model_name
        )
        return result
    except Exception as e:
        # Fallback to empty if AI fails
        print(f"ERROR: Metadata extraction failed: {str(e)}")
        return {"title": "", "company": ""}
