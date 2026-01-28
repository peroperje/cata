import pytest
import asyncio
from app.mcp_server import mcp
from app.core.database import SessionLocal
from app.models import models

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.mark.asyncio
async def test_get_user_cvs():
    # Test that get_user_cvs returns a list or error string
    result = await mcp.call_tool("get_user_cvs", {})
    # FastMCP returns a list of Content objects, but here we are calling it via internal mechanism
    # Actually, mcp.call_tool returns the result of the function wrapped in a list of TextContent
    assert isinstance(result, list)
    assert len(result) > 0
    assert "TextContent" in str(type(result[0]))

@pytest.mark.asyncio
async def test_search_scraped_jobs():
    result = await mcp.call_tool("search_scraped_jobs", {"query": "developer"})
    assert isinstance(result, list)

@pytest.mark.asyncio
async def test_add_to_tracker(db_session):
    test_title = "MCP Test Job"
    test_company = "MCP Corp"
    test_url = "http://mcp.test"
    
    result = await mcp.call_tool("add_to_tracker", {
        "title": test_title,
        "company": test_company,
        "url": test_url,
        "notes": "Added via MCP test"
    })
    
    assert isinstance(result, list)
    content = result[0].text
    assert "success" in content.lower()
    
    # Cleanup
    app = db_session.query(models.JobApplication).filter(models.JobApplication.title == test_title).first()
    if app:
        db_session.delete(app)
        db_session.commit()
