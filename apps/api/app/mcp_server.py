from mcp.server.fastmcp import FastMCP
from app.core.database import SessionLocal
from app.models import models
from sqlalchemy import or_
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-cata")

mcp = FastMCP("CATA")

@mcp.tool()
async def get_user_cvs():
    """
    Lists all uploaded CVs.
    Returns:
        List of CVs with their ID, filename, and creation date.
    """
    db = SessionLocal()
    try:
        logger.info("Fetching all CVs")
        cvs = db.query(models.CV).order_by(models.CV.created_at.desc()).all()
        return [
            {
                "id": cv.id, 
                "filename": cv.filename, 
                "created_at": cv.created_at.isoformat() if cv.created_at else None
            } for cv in cvs
        ]
    except Exception as e:
        logger.error(f"Error fetching CVs: {e}")
        return f"Error: {str(e)}"
    finally:
        db.close()

@mcp.tool()
async def get_cv_content(cv_id: int):
    """
    Fetches the full text content of a specific CV.
    Args:
        cv_id: The ID of the CV to fetch.
    """
    db = SessionLocal()
    try:
        logger.info(f"Fetching content for CV ID: {cv_id}")
        cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
        if not cv:
            return f"Error: CV with ID {cv_id} not found."
        return cv.text
    except Exception as e:
        logger.error(f"Error fetching CV content: {e}")
        return f"Error: {str(e)}"
    finally:
        db.close()

@mcp.tool()
async def search_scraped_jobs(query: str):
    """
    Search for jobs in the scraped listings by title or content.
    Args:
        query: Search term for job title or content.
    """
    db = SessionLocal()
    try:
        logger.info(f"Searching jobs with query: {query}")
        jobs = db.query(models.Job).filter(
            or_(
                models.Job.title.ilike(f"%{query}%"),
                models.Job.content.ilike(f"%{query}%")
            )
        ).order_by(models.Job.similarity_score.desc()).limit(10).all()
        
        return [
            {
                "id": job.id, 
                "title": job.title, 
                "url": job.url, 
                "similarity_score": job.similarity_score,
                "created_at": job.created_at.isoformat() if job.created_at else None
            } for job in jobs
        ]
    except Exception as e:
        logger.error(f"Error searching jobs: {e}")
        return f"Error: {str(e)}"
    finally:
        db.close()

@mcp.tool()
async def get_scraped_job_details(job_id: int):
    """
    Fetches the full details and content of a scraped job.
    Args:
        job_id: The ID of the job to fetch.
    """
    db = SessionLocal()
    try:
        logger.info(f"Fetching details for job ID: {job_id}")
        job = db.query(models.Job).filter(models.Job.id == job_id).first()
        if not job:
            return f"Error: Job with ID {job_id} not found."
        return {
            "id": job.id,
            "title": job.title,
            "url": job.url,
            "content": job.content,
            "similarity_score": job.similarity_score,
            "created_at": job.created_at.isoformat() if job.created_at else None
        }
    except Exception as e:
        logger.error(f"Error fetching job details: {e}")
        return f"Error: {str(e)}"
    finally:
        db.close()
@mcp.tool()
async def get_latest_scraped_jobs(limit: int = 1):
    """
    Fetches the most recently scraped jobs.
    Args:
        limit: Number of jobs to fetch (default: 1).
    """
    db = SessionLocal()
    try:
        logger.info(f"Fetching {limit} latest jobs")
        jobs = db.query(models.Job).order_by(models.Job.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": job.id, 
                "title": job.title, 
                "url": job.url, 
                "similarity_score": job.similarity_score,
                "created_at": job.created_at.isoformat() if job.created_at else None
            } for job in jobs
        ]
    except Exception as e:
        logger.error(f"Error fetching latest jobs: {e}")
        return f"Error: {str(e)}"
    finally:
        db.close()

@mcp.tool()
async def list_tracked_jobs(status: str = None):
    """
    Lists job applications in your tracker.
    Args:
        status: Optional filter by status (Interested, Applied, Interview, Offer, Rejected).
    """
    db = SessionLocal()
    try:
        logger.info(f"Listing tracked jobs with status filter: {status}")
        query = db.query(models.JobApplication)
        if status:
            query = query.filter(models.JobApplication.status == status)
        
        apps = query.order_by(models.JobApplication.updated_at.desc()).all()
        return [
            {
                "id": app.id,
                "title": app.title,
                "company": app.company,
                "status": app.status,
                "url": app.url,
                "updated_at": app.updated_at.isoformat() if app.updated_at else None
            } for app in apps
        ]
    except Exception as e:
        logger.error(f"Error listing tracked jobs: {e}")
        return f"Error: {str(e)}"
    finally:
        db.close()

@mcp.tool()
async def update_job_status(application_id: int, status: str, notes: str = None):
    """
    Updates the status or notes of a tracked job application.
    Args:
        application_id: The ID of the application to update.
        status: New status (Interested, Applied, Interview, Offer, Rejected).
        notes: Optional new notes to replace existing ones.
    """
    db = SessionLocal()
    try:
        logger.info(f"Updating job {application_id} to status: {status}")
        app = db.query(models.JobApplication).filter(models.JobApplication.id == application_id).first()
        if not app:
            return f"Error: Application with ID {application_id} not found."
        
        app.status = status
        if notes is not None:
            app.notes = notes
        
        db.commit()
        return {
            "status": "success",
            "message": f"Updated {app.title} at {app.company} to {status}."
        }
    except Exception as e:
        logger.error(f"Error updating job status: {e}")
        db.rollback()
        return f"Error: {str(e)}"
    finally:
        db.close()

@mcp.tool()
async def add_to_tracker(title: str, company: str, url: str, notes: str = None):
    """
    Add a new job application to the tracker.
    Args:
        title: Job title.
        company: Company name.
        url: URL to the job posting.
        notes: Optional personal notes.
    """
    db = SessionLocal()
    try:
        logger.info(f"Adding job to tracker: {title} at {company}")
        new_app = models.JobApplication(
            title=title,
            company=company,
            url=url,
            notes=notes,
            status="Interested"
        )
        db.add(new_app)
        db.commit()
        db.refresh(new_app)
        return {
            "status": "success", 
            "message": f"Added {title} at {company} to tracker.",
            "application_id": new_app.id
        }
    except Exception as e:
        logger.error(f"Error adding to tracker: {e}")
        db.rollback()
        return f"Error: {str(e)}"
    finally:
        db.close()

if __name__ == "__main__":
    mcp.run()
