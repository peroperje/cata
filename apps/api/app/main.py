"""
FastAPI Backend for CATA Chrome Extension
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.core.database import engine, Base
from app.api.v1 import models as models_router, process as process_router
from app.models import models
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed initial data (optional, but good for demo)
def seed_data():
    db = SessionLocal()
    try:
        if not db.query(models.AIModel).first():
            models_to_seed = [
                models.AIModel(name="Gemini 1.5 Flash", provider="gemini", model_name="gemini-1.5-flash"),
                models.AIModel(name="Gemini 1.5 Pro", provider="gemini", model_name="gemini-1.5-pro"),
                models.AIModel(name="Hugging Face Llama 3", provider="huggingface", model_name="meta-llama/Meta-Llama-3-8B-Instruct"),
            ]
            db.add_all(models_to_seed)
            db.commit()
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
