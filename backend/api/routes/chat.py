from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from api.schemas import ChatRequest
from api.dependencies import get_current_user_id, career_service

router = APIRouter()

@router.post("/chat")
async def chat(request: ChatRequest, user_id: str = Depends(get_current_user_id)):
    return StreamingResponse(
        career_service.stream_chat_with_agent(user_id, request.message, request.chat_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )