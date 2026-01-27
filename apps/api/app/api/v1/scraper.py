from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import models
import redis
import os
import json
from pydantic import BaseModel

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
        # Clear the queues
        r.delete('job_spider:start_urls')
        r.delete('job_spider:requests')
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

@router.get("/scraper/jobs")
def get_scraped_jobs(limit: int = 1000, db: Session = Depends(get_db)):
    try:
        jobs = db.query(models.Job).order_by(models.Job.created_at.desc()).limit(limit).all()
        return jobs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

