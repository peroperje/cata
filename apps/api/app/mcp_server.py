"""
MCP Server for CATA (Career Transformation Assistant).
Provides tools for job searching, CV management, and application tracking via the Model Context Protocol.
"""
from mcp.server.fastmcp import FastMCP
from app.core.database import SessionLocal
from app.models import models
from sqlalchemy import or_, and_
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Optional # Import typing for better compatibility

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-cata")

# Import all models at top level to ensure relationships are resolved
from app.models import models
from app.models.gmail import GmailJob

mcp = FastMCP("CATA")

@mcp.tool()
async def get_user_cvs():
    """
    Lists all uploaded CVs in the database, ordered by creation date (newest first).

    Returns:
        list[dict]: A list of dictionaries containing CV 'id', 'filename', and 'created_at' (ISO format).
                   Returns an error message string if the operation fails.
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
    Fetches the full text content of a specific CV by its ID.

    Args:
        cv_id (int): The unique identifier of the CV to retrieve.

    Returns:
        str: The full text content of the CV if found.
             Returns an error message string if the CV is not found or if an error occurs.
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
    Searches for jobs in the scraped listings by matching a query against titles and content.
    Results are ordered by similarity score in descending order.

    Args:
        query (str): The search term to look for in job titles or descriptions.

    Returns:
        list[dict]: A list of up to 10 matching jobs, each with 'id', 'title', 'url', 
                    'similarity_score', and 'created_at'.
                    Returns an error message string if the operation fails.
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
    Fetches the complete details and full content of a specific scraped job.

    Args:
        job_id (int): The unique identifier of the job to retrieve.

    Returns:
        dict: A dictionary containing 'id', 'title', 'url', 'content', 'similarity_score', 
              and 'created_at'.
              Returns an error message string if the job is not found or if an error occurs.
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
    Retrieves the most recently added job listings from the database.

    Args:
        limit (int, optional): The maximum number of jobs to return. Defaults to 1.

    Returns:
        list[dict]: A list of the latest jobs, each containing 'id', 'title', 'url', 
                    'similarity_score', and 'created_at'.
                    Returns an error message string if the operation fails.
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
    Lists job applications currently being tracked, with an optional filter by status.
    Ordered by the last update time (most recent first).

    Args:
        status (str, optional): The status to filter by (e.g., 'Interested', 'Applied', 
                                'Interview', 'Offer', 'Rejected'). Defaults to None.

    Returns:
        list[dict]: A list of job application summaries containing 'id', 'title', 'company', 
                    'status', 'url', and 'updated_at'.
                    Returns an error message string if the operation fails.
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
    Updates the application status and/or personal notes for a specific tracked job.

    Args:
        application_id (int): The unique identifier of the job application.
        status (str): The new status to set (e.g., 'Interested', 'Applied', 'Interview', 
                      'Offer', 'Rejected').
        notes (str, optional): New notes to replace existing ones. If None, notes are not updated.

    Returns:
        dict: A success message and status if updated successfully.
              Returns an error message string if the application is not found or if an error occurs.
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
    Creates a new job application entry in the tracker.

    Args:
        title (str): The title of the job position.
        company (str): The name of the hiring company.
        url (str): The URL link to the job posting.
        notes (str, optional): Any personal notes or context about the application.

    Returns:
        dict: A dictionary containing 'status', 'message', and 'application_id' of the new entry.
              Returns an error message string if the operation fails.
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

@mcp.tool()
async def get_job_evaluation_context(job_application_id: int):
    """
    Provides a comprehensive context for evaluating a job application.
    Retrieves the job's full description and the user's most recent CV text.

    Args:
        job_application_id (int): The unique identifier of the job application to evaluate.

    Returns:
        str: A formatted block of text containing job details, full description, and CV content.
             Returns an error message string if the application or CV is not found.
    """
    db = SessionLocal()
    try:
        logger.info(f"Fetching evaluation context for job application ID: {job_application_id}")
        
        app = db.query(models.JobApplication).filter(models.JobApplication.id == job_application_id).first()
        if not app:
            return f"Error: Job application with ID {job_application_id} not found."
            
        cv = db.query(models.CV).order_by(models.CV.created_at.desc()).first()
        if not cv:
            return "Error: No CV found in the database. Please upload a CV first."
            
        context = (
            f"--- JOB APPLICATION CONTEXT ---\n"
            f"Title: {app.title}\n"
            f"Company: {app.company}\n"
            f"URL: {app.url}\n\n"
            f"--- FULL JOB DESCRIPTION ---\n"
            f"{app.full_text_description or 'No full text available.'}\n\n"
            f"--- APPLICANT CV ({cv.filename}) ---\n"
            f"{cv.text or 'No CV text available.'}\n"
        )
        return context
    except Exception as e:
        logger.error(f"Error fetching evaluation context: {e}")
        return f"Error: {str(e)}"
@mcp.tool()
async def get_recent_gmail_jobs(days: int = 3):
    """
    Fetches Gmail job records that are currently active and were created within the specified number of days.
    Useful for identifying and filtering out "noise" records that were incorrectly extracted.

    Args:
        days (int, optional): The number of days to look back. Defaults to 3.

    Returns:
        list[dict]: A list of recent Gmail jobs with 'id', 'title', 'company', 'url', and 'created_at'.
                   Returns an error message string if the operation fails.
    """
    db = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        logger.info(f"Fetching active Gmail jobs since {cutoff_date}")
        
        jobs = db.query(GmailJob).filter(
            and_(
                GmailJob.is_used == False,
                GmailJob.is_irrelevant == False,
                GmailJob.job_application_id == None,
                GmailJob.is_active == True,
                GmailJob.created_at >= cutoff_date
            )
        ).order_by(GmailJob.created_at.desc()).all()
        
        return [
            {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "url": job.url,
                "created_at": job.created_at.isoformat() if job.created_at else None
            } for job in jobs
        ]
    except Exception as e:
        logger.error(f"Error fetching recent Gmail jobs: {e}")
        return f"Error: {str(e)}"
    finally:
        db.close()

@mcp.tool()
async def set_gmail_jobs_active_status(job_ids: List[int], status: bool):
    """
    Updates the 'is_active' status for a list of Gmail job IDs.
    Typically used to deactivate (is_active=False) irrelevant records in bulk.

    Args:
        job_ids (List[int]): A list of integer IDs for the Gmail jobs to update.
        status (bool): The new active status to set (True for active, False for inactive).

    Returns:
        dict: A status report indicating how many records were updated.
              Returns an error message string if the operation fails.
    """
    if not job_ids:
        return {"status": "success", "message": "No job IDs provided.", "count": 0}
        
    db = SessionLocal()
    try:
        logger.info(f"Setting is_active={status} for {len(job_ids)} Gmail jobs")
        
        updated_count = db.query(GmailJob).filter(GmailJob.id.in_(job_ids)).update(
            {GmailJob.is_active: status}, 
            synchronize_session=False
        )
        db.commit()
        
        return {
            "status": "success",
            "message": f"Successfully updated active status to {status} for {updated_count} records.",
            "count": updated_count
        }
    except Exception as e:
        logger.error(f"Error updating Gmail jobs status: {e}")
        db.rollback()
        return f"Error: {str(e)}"
    finally:
        db.close()

if __name__ == "__main__":
    mcp.run()
