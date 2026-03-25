from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from api.schemas import UploadResponse
from api.dependencies import get_current_user_id, get_doc_service, career_service
from application.document_service import DocumentService
from domain.models import ChatMessage
from typing import Optional

router = APIRouter()

@router.post("/uploadfile", response_model=UploadResponse)
def upload_file(
    user_id: str = Depends(get_current_user_id), 
    file: UploadFile = File(...), 
    chat_id: Optional[str] = None,
    doc_service: DocumentService = Depends(get_doc_service)
):  
    if not file:
        raise HTTPException(status_code=400, detail="No upload file sent")
    
    file_content = file.file.read()
    doc = doc_service.upload_document(user_id, file.filename, file_content)

    # If chat_id is provided, record the upload in history so the agent sees it
    if chat_id:
        upload_msg = ChatMessage(
            uid=user_id,
            role="user",
            message=f"📎 Caricato file: {doc.filename}",
            chat_id=chat_id
        )
        career_service.chat_repo.save(upload_msg)

    
    return {
        "msg": "Document uploaded", 
        "user_id": user_id,
        "filename": doc.filename,
        "chat_id": chat_id
    }