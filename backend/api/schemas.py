from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class ChatMessageResponse(BaseModel):
    id: Optional[str] = Field(None, alias="id")
    uid: str
    role: str
    message: str
    created_at: datetime = Field(..., alias="createdAt")
    chat_id: Optional[str] = Field(None, alias="chatId")

    class Config:
        populate_by_name = True
        from_attributes = True

class ChatHistoryResponse(BaseModel):
    chats: List[ChatMessageResponse]

class ChatRequest(BaseModel):
    message: str
    chat_id: Optional[str] = Field(None, alias="chatId")

class ChatResponse(BaseModel):
    response: str

class UploadResponse(BaseModel):
    msg: str
    user_id: str
    filename: str
    chat_id: Optional[str] = Field(None, alias="chatId")

    class Config:
        populate_by_name = True

