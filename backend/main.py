import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI
from infrastructure import firebase
from fastapi.middleware.cors import CORSMiddleware
from api.routes.upload import router as upload_router
from api.routes.chat import router as chat_router
from api.routes.auth import router as auth_router
from api.routes.chat_history import router as chats_router


# Import Clean Architecture components
from adapters.mongodb_repository import MongoDocumentRepository, MongoChatRepository
from adapters.adzuna_client import AdzunaClient
from application.career_service import CareerService
from application.document_service import DocumentService
from api.schemas import (
    ChatRequest, 
    ChatResponse, 
    ChatMessageResponse, 
    UploadResponse,
    ChatHistoryResponse
)

# Create fastapi app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(chats_router)


@app.get("/")
def root():
    return {"status": "ok"}

