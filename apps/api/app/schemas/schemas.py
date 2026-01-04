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

class ProcessResponse(BaseModel):
    mappings: List[Mapping]
