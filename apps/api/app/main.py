"""
FastAPI Backend for CATA Chrome Extension
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.core.database import engine, Base
from app.api.v1 import models as models_router, process as process_router, cvs as cvs_router, jobs as jobs_router
from app.models import models
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed initial data
def seed_data():
    db = SessionLocal()
    try:
        # Define the source of truth
        models_to_seed = [
           # {"name": "Gemini 1.5 Flash", "provider": "gemini", "model_name": "gemini-1.5-flash"},
           # {"name": "Gemini 1.5 Pro", "provider": "gemini", "model_name": "gemini-1.5-pro"},
            {"name": "Gemini 2.5 flash lite", "provider": "gemini", "model_name": "gemini-2.5-flash-lite"},
            {"name": "Gemini 2.5 flash", "provider": "gemini", "model_name": "gemini-2.5-flash"},
           # {"name": "Hugging Face Llama 3", "provider": "huggingface", "model_name": "meta-llama/Meta-Llama-3-8B-Instruct"},
        ]
        
        # Get all existing models from DB
        db_models = db.query(models.AIModel).all()
        db_models_map = {m.model_name: m for m in db_models}
        
        seed_model_names = {m["model_name"] for m in models_to_seed}
        
        # 1. Delete models from DB that are not in models_to_seed
        for model_name, db_model in db_models_map.items():
            if model_name not in seed_model_names:
                db.delete(db_model)
        
        # 2. Add or update models
        for seed_item in models_to_seed:
            model_name = seed_item["model_name"]
            if model_name in db_models_map:
                # Update if different
                db_model = db_models_map[model_name]
                if db_model.name != seed_item["name"] or db_model.provider != seed_item["provider"]:
                    db_model.name = seed_item["name"]
                    db_model.provider = seed_item["provider"]
            else:
                # Add new model
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

seed_data()

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
