from fastapi import APIRouter, Depends
from typing import List
from api.schemas import ChatMessageResponse
from api.dependencies import get_current_user_id, career_service

router = APIRouter()

@router.get("/chats")
async def get_chats(user_id: str = Depends(get_current_user_id)):
    history = career_service.get_user_chat_history(user_id)
    return {"chats":  history}

@router.get("/chats/{chat_id}", response_model=List[ChatMessageResponse])
async def get_chat(chat_id: str, user_id: str = Depends(get_current_user_id)):
    messages = career_service.get_chat_messages(user_id, chat_id)
    return messages