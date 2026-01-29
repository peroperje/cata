from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.get("/models", response_model=List[schemas.AIModel])
def get_models(db: Session = Depends(get_db)):
    db_models = db.query(models.AIModel).all()
    # Check for keys for each model
    for m in db_models:
        m.has_key = db.query(models.UserKey).filter(models.UserKey.model_id == m.id).first() is not None
    return db_models

@router.post("/models", response_model=schemas.AIModel)
def create_model(model: schemas.AIModelCreate, db: Session = Depends(get_db)):
    db_model = models.AIModel(**model.dict())
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    return db_model

@router.delete("/models/{model_id}")
def delete_model(model_id: int, db: Session = Depends(get_db)):
    db_model = db.query(models.AIModel).filter(models.AIModel.id == model_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")
    db.delete(db_model)
    db.commit()
    return {"message": "Model deleted"}

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
