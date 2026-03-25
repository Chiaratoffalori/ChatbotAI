from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# define a doc
@dataclass
class UserDocument:
    uid: str
    filename: str
    content: str
    created_at: datetime = field(default_factory=datetime.now)
    id: Optional[str] = None
# define a chat message
@dataclass
class ChatMessage:
    uid: str
    role: str # 'user' or 'assistant'
    message: str
    created_at: datetime = field(default_factory=datetime.now)
    chat_id: Optional[str] = None
    id: Optional[str] = None
# define a user
@dataclass
class User:
    uid: str
    email: str
    created_at: datetime = field(default_factory=datetime.now)
    id: Optional[str] = None
# define job offer
@dataclass
class JobOffer:
    title: str
    company: str
    location: str
    description: str
    url: str
    created_at: datetime = field(default_factory=datetime.now)
    id: Optional[str] = None
    