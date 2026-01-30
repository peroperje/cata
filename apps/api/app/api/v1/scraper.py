from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import models
import redis
from datetime import datetime
import os
import json
from pydantic import BaseModel
from typing import List, Optional
from app.schemas import schemas

router = APIRouter()

# Redis connection
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379')
r = redis.from_url(REDIS_URL, decode_responses=True)

class ScraperStart(BaseModel):
    url: str

@router.post("/scraper/start")
def start_scraper(data: ScraperStart):
    try:
        # Push URL to scrapy-redis start_urls key
        r.lpush('job_spider:start_urls', data.url)
        # Set a flag that we are scraping
        r.set('scraper:status', 'running')
        return {"status": "started", "url": data.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scraper/stop")
def stop_scraper():
    try:
        # Clear the queues and dupefilter
        r.delete('job_spider:start_urls')
        r.delete('job_spider:requests')
        r.delete('job_spider:dupefilter')
        # Scrapy-redis takes care of dupefilters too if we want, but let's keep it simple
        r.set('scraper:status', 'stopped')
        return {"status": "stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scraper/status")
def get_scraper_status(db: Session = Depends(get_db)):
    try:
        status = r.get('scraper:status') or 'stopped'
        # Count jobs found today or altogether
        job_count = db.query(models.Job).count()
        return {
            "status": status,
            "job_count": job_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scraper/jobs", response_model=List[schemas.Job])
def get_scraped_jobs(
    skip: int = 0,
    limit: int = 100, 
    include_irrelevant: bool = False, 
    is_favorite: Optional[bool] = None,
    title: Optional[str] = None,
    url: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(models.Job)
        if not include_irrelevant:
            query = query.filter(models.Job.is_irrelevant == False)
        if is_favorite is not None:
            query = query.filter(models.Job.is_favorite == is_favorite)
        if title:
            query = query.filter(models.Job.title.ilike(f"%{title}%"))
        if url:
            query = query.filter(models.Job.url.ilike(f"%{url}%"))
            
        jobs = query.order_by(models.Job.created_at.desc()).offset(skip).limit(limit).all()
        return jobs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/scraper/jobs")
def delete_scraped_jobs(
    before_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(models.Job)
        if before_date:
            query = query.filter(models.Job.created_at <= before_date)
        
        count = query.delete(synchronize_session=False)
        db.commit()
        return {"status": "success", "count": count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

