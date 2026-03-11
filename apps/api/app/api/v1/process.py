from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.services.ai.factory import AIProviderFactory

router = APIRouter()

@router.post("/process", response_model=schemas.ProcessResponse)
async def process_form(request: schemas.ProcessRequest, db: Session = Depends(get_db)):
    # 1. Get model info
    model = db.query(models.AIModel).filter(models.AIModel.id == request.modelId).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # 2. Get user key for this model
    user_key = db.query(models.UserKey).filter(models.UserKey.model_id == model.id).order_by(models.UserKey.created_at.desc()).first()
    if not user_key:
        raise HTTPException(status_code=404, detail=f"No API key found for {model.name}")

    # 3. Get provider
    try:
        provider = AIProviderFactory.get_provider(model.provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 4. Get job description if provided
    job_description = None
    if request.jobApplicationId:
        job_app = db.query(models.JobApplication).filter(models.JobApplication.id == request.jobApplicationId).first()
        if job_app:
            job_description = job_app.full_text_description

    # 5. Call provider
    try:
        result = await provider.process(
            cv_text=request.cvText,
            form_data=request.formData,
            api_key=user_key.api_key,
            model_name=model.model_name,
            instruction=request.instruction,
            job_description=job_description
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
