from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class GmailJobBase(BaseModel):
    title: str
    company: str
    url: str  # Unique
    is_irrelevant: bool = False
    is_used: bool = False
    sent_at: Optional[datetime] = None
    job_application_id: Optional[int] = None

class GmailJobCreate(GmailJobBase):
    pass

class GmailJobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    url: Optional[str] = None
    is_irrelevant: Optional[bool] = None
    is_used: Optional[bool] = None
    job_application_id: Optional[int] = None

class GmailJob(GmailJobBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class GmailJobPagination(BaseModel):
    items: List[GmailJob]
    total: int
    page: int
    size: int
    pages: int

class GmailSettingsBase(BaseModel):
    fetch_interval_minutes: int = 15
    is_active: bool = True

class GmailSettingsUpdate(BaseModel):
    fetch_interval_minutes: Optional[int] = None
    is_active: Optional[bool] = None

class GmailSettings(GmailSettingsBase):
    id: int
    last_sync_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GmailFilterBase(BaseModel):
    email_sender: str

class GmailFilterCreate(GmailFilterBase):
    pass

class GmailFilter(GmailFilterBase):
    id: int

    class Config:
        from_attributes = True
