from fastapi import Header, HTTPException, Depends

from infrastructure.db import documents_collection, chats_collection
from infrastructure.agent import llm

from adapters.adzuna_client import AdzunaClient
from adapters.auth import AuthRepository
from adapters.mongodb_repository import MongoDocumentRepository, MongoChatRepository

from application.career_service import CareerService
from application.document_service import DocumentService



# Infrastructure Layer Instances
doc_repo = MongoDocumentRepository(documents_collection)
chat_repo = MongoChatRepository(chats_collection)
adzuna_client = AdzunaClient()
auth_repo = AuthRepository()

# Application Layer Instances
career_service = CareerService(chat_repo, doc_repo, adzuna_client, llm)
doc_service = DocumentService(doc_repo)

def get_current_user_id(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="invalid authorization")
    token = authorization.replace("Bearer ", "")
    user_id = auth_repo.verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="invalid token")
    return user_id
def get_career_service() -> CareerService:
    return career_service
def get_doc_service() -> DocumentService:
    return doc_service