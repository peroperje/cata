from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.get("/platforms", response_model=List[schemas.JobPlatform])
async def get_platforms(db: Session = Depends(get_db)):
    return db.query(models.JobPlatform).order_by(models.JobPlatform.position).all()

@router.post("/platforms", response_model=schemas.JobPlatform)
async def create_platform(platform: schemas.JobPlatformCreate, db: Session = Depends(get_db)):
    db_platform = models.JobPlatform(**platform.model_dump())
    db.add(db_platform)
    db.commit()
    db.refresh(db_platform)
    return db_platform

@router.put("/platforms/{platform_id}", response_model=schemas.JobPlatform)
async def update_platform(platform_id: int, platform: schemas.JobPlatformUpdate, db: Session = Depends(get_db)):
    db_platform = db.query(models.JobPlatform).filter(models.JobPlatform.id == platform_id).first()
    if not db_platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    
    update_data = platform.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_platform, key, value)
    
    db.commit()
    db.refresh(db_platform)
    return db_platform

@router.delete("/platforms/{platform_id}")
async def delete_platform(platform_id: int, db: Session = Depends(get_db)):
    db_platform = db.query(models.JobPlatform).filter(models.JobPlatform.id == platform_id).first()
    if not db_platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    
    db.delete(db_platform)
    db.commit()
    return {"ok": True}

@router.patch("/platforms/reorder", response_model=List[schemas.JobPlatform])
async def reorder_platforms(items: List[schemas.JobPlatformReorder], db: Session = Depends(get_db)):
    updated_platforms = []
    for item in items:
        db_platform = db.query(models.JobPlatform).filter(models.JobPlatform.id == item.id).first()
        if db_platform:
            db_platform.position = item.position
            updated_platforms.append(db_platform)
    
    db.commit()
    for p in updated_platforms:
        db.refresh(p)
        
    return db.query(models.JobPlatform).order_by(models.JobPlatform.position).all()
