from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional
from datetime import datetime
from app.models import models
from app.schemas import schemas
from app.core.utils import normalize_url

from app.services.ai.factory import AIProviderFactory

from fastapi import HTTPException

async def create_job_application(db: Session, application: schemas.JobApplicationCreate):
    app_dict = application.dict(exclude={'pageText', 'modelId', 'force'})
    
    # If title or company is missing, try AI extraction
    if application.pageText and application.modelId and (not application.title or not application.company):
        try:
            model = db.query(models.AIModel).filter(models.AIModel.id == application.modelId).first()
            if model:
                user_key = db.query(models.UserKey).filter(models.UserKey.model_id == model.id).order_by(models.UserKey.created_at.desc()).first()
                if user_key:
                    provider = AIProviderFactory.get_provider(model.provider)
                    # Run extraction
                    metadata = await provider.extract_metadata(
                        page_text=application.pageText,
                        api_key=user_key.api_key,
                        model_name=model.model_name
                    )
                    
                    if not app_dict.get('title'):
                        app_dict['title'] = metadata.get('title', 'Unknown Title')
                    if not app_dict.get('company'):
                        app_dict['company'] = metadata.get('company', 'Unknown Company')
        except Exception as e:
            print(f"ERROR: AI extraction during create failed: {e}")

    # Fallbacks
    if not app_dict.get('title'):
        app_dict['title'] = 'Unknown Title'
    if not app_dict.get('company'):
        app_dict['company'] = 'Unknown Company'

    title = app_dict['title']
    company = app_dict['company']
    url = normalize_url(app_dict['url'])
    app_dict['url'] = url

    # 1. Check for strict duplicate (title, company, url)
    strict_duplicate = db.query(models.JobApplication).filter(
        models.JobApplication.title == title,
        models.JobApplication.company == company,
        models.JobApplication.url == url
    ).first()

    if strict_duplicate:
        raise HTTPException(
            status_code=409, 
            detail={
                "type": "STRICT_DUPLICATE",
                "message": f"You already applied for '{title}' at '{company}' with this URL."
            }
        )

    # 2. Check for potential duplicate (title, company)
    if not application.force:
        potential_duplicate = db.query(models.JobApplication).filter(
            models.JobApplication.title == title,
            models.JobApplication.company == company
        ).first()

        if potential_duplicate:
            raise HTTPException(
                status_code=409,
                detail={
                    "type": "POTENTIAL_DUPLICATE",
                    "message": f"You already have an application for '{title}' at '{company}', but with a different URL. Do you want to save it anyway?"
                }
            )

    # 3. Check for same company but different position
    # (company == company, url != url, title != title)
    warning = None
    other_position = db.query(models.JobApplication).filter(
        models.JobApplication.company == company,
        models.JobApplication.title != title,
        models.JobApplication.url != url
    ).first()

    if other_position:
        warning = f"Warning: You have already applied to '{company}' for a different position ('{other_position.title}')."
        if app_dict.get('notes'):
            app_dict['notes'] = f"{app_dict['notes']}\n\n{warning}"
        else:
            app_dict['notes'] = warning

    db_application = models.JobApplication(**app_dict)
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    
    if warning:
        # Attach warning to the object so it's included in the response schema
        setattr(db_application, 'warning', warning)
        
    return db_application

def get_job_application(db: Session, application_id: int):
    return db.query(models.JobApplication).filter(models.JobApplication.id == application_id).first()

def get_job_applications(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    company: Optional[str] = None,
    job_title: Optional[str] = None,
    url: Optional[str] = None,
    search: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    is_irrelevant: Optional[bool] = None
):
    query = db.query(models.JobApplication)
    
    if search:
        query = query.filter(
            or_(
                models.JobApplication.title.ilike(f"%{search}%"),
                models.JobApplication.company.ilike(f"%{search}%"),
                models.JobApplication.url.ilike(f"%{search}%")
            )
        )
    
    if status:
        query = query.filter(models.JobApplication.status == status)
    if company:
        query = query.filter(models.JobApplication.company.ilike(f"%{company}%"))
    if job_title:
        query = query.filter(models.JobApplication.title.ilike(f"%{job_title}%"))
    if url:
        query = query.filter(models.JobApplication.url.ilike(f"%{url}%"))
    if is_favorite is not None:
        query = query.filter(models.JobApplication.is_favorite == is_favorite)
    if is_irrelevant is not None:
        query = query.filter(models.JobApplication.is_irrelevant == is_irrelevant)
        
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
