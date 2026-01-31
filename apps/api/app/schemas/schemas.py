from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AIModelBase(BaseModel):
    name: str
    provider: str
    model_name: str

class AIModelCreate(AIModelBase):
    pass

class AIModel(AIModelBase):
    id: int
    has_key: bool = False

    class Config:
        from_attributes = True

class UserKeyBase(BaseModel):
    model_id: int
    api_key: str

class UserKeyCreate(UserKeyBase):
    pass

class UserKey(UserKeyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Mapping(BaseModel):
    fieldId: str
    fieldName: str
    value: str

class ProcessRequest(BaseModel):
    cvText: str
    formData: List[dict]
    modelId: int
    instruction: Optional[str] = None

class ProcessResponse(BaseModel):
    mappings: List[Mapping]

class CVBase(BaseModel):
    filename: str
    text: str

class CVCreate(CVBase):
    pass

class CV(CVBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class JobBase(BaseModel):
    title: str
    url: str
    content: Optional[str] = None
    similarity_score: Optional[float] = 0.0
    is_irrelevant: bool = False
    is_used: bool = False

class JobCreate(JobBase):
    pass

class Job(JobBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class JobApplicationBase(BaseModel):
    title: str
    url: str
    company: str
    status: str = "Interested"
    notes: Optional[str] = None
    is_favorite: bool = False
    is_irrelevant: bool = False

class JobApplicationCreate(BaseModel):
    title: Optional[str] = None
    url: str
    company: Optional[str] = None
    status: Optional[str] = "Interested"
    notes: Optional[str] = None
    pageText: Optional[str] = None
    modelId: Optional[int] = None
    force: bool = False

class JobApplicationUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    is_favorite: Optional[bool] = None
    is_irrelevant: Optional[bool] = None

class JobApplication(JobApplicationBase):
    id: int
    warning: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MetadataExtractionRequest(BaseModel):
    pageText: str
    modelId: int

class MetadataExtractionResponse(BaseModel):
    title: str
    company: str
