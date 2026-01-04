from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.get("/models", response_model=List[schemas.AIModel])
def get_models(db: Session = Depends(get_db)):
    return db.query(models.AIModel).all()

@router.post("/keys", response_model=schemas.UserKey)
def create_key(key: schemas.UserKeyCreate, db: Session = Depends(get_db)):
    # Check if model exists
    model = db.query(models.AIModel).filter(models.AIModel.id == key.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Simple store (ideally encrypt)
    db_key = models.UserKey(**key.dict())
    db.add(db_key)
    db.commit()
    db.refresh(db_key)
    return db_key
