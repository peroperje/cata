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
    search: Optional[str] = Query(None),
    is_favorite: Optional[bool] = Query(None),
    is_irrelevant: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    applications = service.get_job_applications(
        db, skip=skip, limit=limit, status=status, company=company, job_title=job_title,
        url=url, search=search, is_favorite=is_favorite, is_irrelevant=is_irrelevant
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

@router.get("/job-applications/{application_id}/evaluation-prompt")
def get_evaluation_prompt(application_id: int, db: Session = Depends(get_db)):
    db_application = service.get_job_application(db, application_id=application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Job application not found")
        
    cv = db.query(models.CV).order_by(models.CV.created_at.desc()).first()
    if not cv:
        raise HTTPException(status_code=404, detail="No CV found. Please upload a CV first.")
        
    context = (
        f"--- JOB APPLICATION CONTEXT ---\n"
        f"Title: {db_application.title}\n"
        f"Company: {db_application.company}\n"
        f"URL: {db_application.url}\n\n"
        f"--- FULL JOB DESCRIPTION ---\n"
        f"{db_application.full_text_description or 'No full text available.'}\n\n"
        f"--- APPLICANT CV ({cv.filename}) ---\n"
        f"{cv.text or 'No CV text available.'}\n"
    )
    
    prompt = (
    "\n\n--- ANALYST ROLE ---\n"
    "You are a senior technical recruiter with 15 years of hiring engineers. "
    "You are also a ruthlessly pragmatic career coach. "
    "You have zero incentive to encourage applications — your only goal is accuracy. "
    "Tone: cold, analytical, skeptical by default. No fluff, no hedging.\n\n"

    "--- TASK ---\n"
    "Using ONLY the job posting and CV above, produce a structured hiring-signal report. "
    "Follow the OUTPUT FORMAT exactly. Do not add sections. Do not reorder sections.\n\n"

    "--- OUTPUT FORMAT ---\n\n"

    "## SKILLS MATCH\n"
    "Confirmed matches: [comma-separated list]\n"
    "Gaps:\n"
    "- [Skill]: [CRITICAL or MINOR] — [weeks/months to close, or 'transferable']\n\n"

    "## STACK COMPATIBILITY\n"
    "[YES or NO]: [one sentence reason]\n\n"

    "## REMOTE & LOCATION\n"
    "- Remote explicitly offered: [YES or NO]\n"
    "- Serbia hire viable: [YES or NO] — [one sentence reason]\n"
    "- Disqualifier: [NONE or FLAG: reason]\n\n"

    "## BLIND SPOTS\n"
    "- [Specific rejection risk #1]\n"
    "- [Specific rejection risk #2]\n"
    "- [Specific rejection risk #3]\n"
    "- Trajectory: [STEP FORWARD / LATERAL / STEP BACK] — [one sentence reason]\n\n"

    "## SALARY\n"
    "- Range: €X,XXX–€X,XXX/month (Serbia-based, remote, senior)\n"
    "- Risk: [UNDERVALUE / OVERVALUE / NEUTRAL]\n"
    "- Basis: [2–3 data points used to derive the range]\n\n"

    "## VERDICT\n"
    "Recommendation: YES / NO\n"
    "Match Score: X/10\n"
    "For: [One sentence — strongest argument to apply]\n"
    "Against: [One sentence — strongest argument to skip or the deciding risk]\n"
    )
    return {"prompt": context + prompt}
