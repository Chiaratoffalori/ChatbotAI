from abc import ABC, abstractmethod
from typing import List, Optional
from domain.models import UserDocument, ChatMessage, User, JobOffer

# define of rules
class IDocumentRepository(ABC):
    @abstractmethod
    def save(self, document: UserDocument) -> str:
        pass

    @abstractmethod
    def get_by_user(self, user_id: str) -> List[UserDocument]:
        pass

class IChatRepository(ABC):
    @abstractmethod
    def save(self, message: ChatMessage) -> str:
        pass

    @abstractmethod
    def get_history(self, user_id: str) -> List[ChatMessage]:
        pass

    @abstractmethod
    def get_chat_messages(self, user_id: str, chat_id: str) -> List[ChatMessage]:
        pass

class IUserRepository(ABC):
    @abstractmethod
    def save(self, user: User) -> str:
        pass

    @abstractmethod
    def get_by_uid(self, uid: str) -> Optional[User]:
        pass    

class IJobSearchClient(ABC):
    @abstractmethod
    def save(self, job_offer: JobOffer) -> str:
        pass

    @abstractmethod
    def get_by_user(self, user_id: str) -> List[JobOffer]:
        pass
    
class IAuthRepository(ABC):
    @abstractmethod
    def verify_token(self, id_token: str) -> str:
        pass