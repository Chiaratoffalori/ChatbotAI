from typing import List, Optional
from datetime import datetime
from pymongo.collection import Collection
from domain.models import UserDocument, ChatMessage
from domain.interfaces import IDocumentRepository, IChatRepository

class MongoDocumentRepository(IDocumentRepository):
    def __init__(self, collection: Collection):
        self.collection = collection

    def save(self, document: UserDocument) -> str:
        doc_dict = {
            "uid": document.uid,
            "filename": document.filename,
            "content": document.content,
            "createdAt": document.created_at
        }
        result = self.collection.insert_one(doc_dict)
        document.id = str(result.inserted_id)
        return document.id

    def get_by_user(self, user_id: str) -> List[UserDocument]:
        docs = self.collection.find({"uid": user_id})
        return [
            UserDocument(
                uid=d["uid"],
                filename=d["filename"],
                content=d["content"],
                created_at=d["createdAt"],
                id=str(d["_id"])
            ) for d in docs
        ]

class MongoChatRepository(IChatRepository):
    def __init__(self, collection: Collection):
        self.collection = collection

    def save(self, message: ChatMessage) -> str:
        msg_dict = {
            "uid": message.uid,
            "role": message.role,
            "message": message.message,
            "createdAt": message.created_at
        }
        if message.chat_id:
            msg_dict["chat_id"] = message.chat_id
        
        result = self.collection.insert_one(msg_dict)
        message.id = str(result.inserted_id)
        return message.id

    def get_history(self, user_id: str) -> List[ChatMessage]:
        messages = self.collection.find({"uid": user_id}).sort("createdAt", 1)
        return [self._map_to_model(m) for m in messages]

    def get_chat_messages(self, user_id: str, chat_id: str) -> List[ChatMessage]:
        messages = self.collection.find({"uid": user_id, "chat_id": chat_id}).sort("createdAt", 1)
        return [self._map_to_model(m) for m in messages]

    def _map_to_model(self, data: dict) -> ChatMessage:
        return ChatMessage(
            uid=data["uid"],
            role=data["role"],
            message=data.get("message", data.get("content", "")), # handle both field names if necessary
            created_at=data["createdAt"],
            chat_id=data.get("chat_id"),
            id=str(data["_id"])
        )
