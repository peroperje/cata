"""
FastAPI Backend for CATA Chrome Extension
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.core.database import engine, Base
from app.api.v1 import models as models_router, process as process_router, cvs as cvs_router, jobs as jobs_router, scraper as scraper_router, job_applications as job_applications_router
from app.models import models
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed initial data
def seed_data():
    db = SessionLocal()
    try:
        # Check if any models already exist
        if db.query(models.AIModel).first() is not None:
            return

        # Define the source of truth for initial seeding
        models_to_seed = [
            {"name": "Gemini 2.0 flash lite", "provider": "gemini", "model_name": "gemini-2.0-flash-lite"},
            {"name": "Gemini 2.0 flash", "provider": "gemini", "model_name": "gemini-2.0-flash"},
            {"name": "Hugging Face Llama 3", "provider": "huggingface", "model_name": "meta-llama/Meta-Llama-3-8B-Instruct"},
        ]
        
        # Add models
        for seed_item in models_to_seed:
            new_model = models.AIModel(
                name=seed_item["name"],
                provider=seed_item["provider"],
                model_name=seed_item["model_name"]
            )
            db.add(new_model)
        
        db.commit()
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

def run_migrations():
    from sqlalchemy import text
    db = SessionLocal()
    try:
        # Check if job_application_id exists
        print("Running manual migrations...")
        # PostgreSQL syntax to add column if not exists is a bit involved, 
        # but we can just check if it exists first or use a try-except.
        # Since we are in python, we'll check it.
        result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='jobs' AND column_name='job_application_id'"))
        if not result.fetchone():
            print("Adding job_application_id column to jobs table...")
            db.execute(text("ALTER TABLE jobs ADD COLUMN job_application_id INTEGER REFERENCES job_applications(id) ON DELETE SET NULL"))
            db.commit()
            print("Column added successfully.")
    except Exception as e:
        print(f"Migration error: {e}")
        db.rollback()
    finally:
        db.close()

seed_data()
run_migrations()

app = FastAPI(
    title="CATA API",
    description="Backend API for AI-powered job application auto-filler",
    version="1.0.0"
)

# Configure CORS for Chrome Extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://*",
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CATA API is running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected"  # TODO: Add actual DB health check
    }


@app.get("/api/v1/status")
async def api_status():
    """API status endpoint"""
    return {
        "api": "online",
        "endpoints": [
            "/",
            "/health",
            "/api/v1/status",
            "/docs"
        ]
    }


# Include routers
app.include_router(models_router.router, prefix="/api/v1", tags=["Models"])
app.include_router(process_router.router, prefix="/api/v1", tags=["AI Process"])
app.include_router(cvs_router.router, prefix="/api/v1", tags=["CVs"])
app.include_router(jobs_router.router, prefix="/api/v1", tags=["Jobs"])
app.include_router(scraper_router.router, prefix="/api/v1", tags=["Scraper"])
app.include_router(job_applications_router.router, prefix="/api/v1", tags=["Job Applications"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
