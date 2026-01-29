from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.post("/cvs", response_model=schemas.CV)
def create_cv(cv: schemas.CVCreate, db: Session = Depends(get_db)):
    db_cv = models.CV(**cv.dict())
    db.add(db_cv)
    db.commit()
    db.refresh(db_cv)
    return db_cv

@router.get("/cvs", response_model=List[schemas.CV])
def get_cvs(db: Session = Depends(get_db)):
    return db.query(models.CV).order_by(models.CV.created_at.desc()).all()

@router.delete("/cvs/{cv_id}")
def delete_cv(cv_id: int, db: Session = Depends(get_db)):
    db_cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
    if not db_cv:
        raise HTTPException(status_code=404, detail="CV not found")
    db.delete(db_cv)
    db.commit()
    return {"message": "CV deleted"}
