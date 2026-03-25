import io
from datetime import datetime
from pypdf import PdfReader
from domain.interfaces import IDocumentRepository
from domain.models import UserDocument

# document service for managing user documents into the database and extracting text from pdf files and other formats and saving them into the database and retrieving them for the chatbot to use and answer questions about the documents for the user 
class DocumentService:
    def __init__(self, doc_repo: IDocumentRepository):
        self.doc_repo = doc_repo

    def upload_document(self, user_id: str, filename: str, file_content: bytes) -> UserDocument:
        if filename.endswith(".pdf"):
            pdf_reader = PdfReader(io.BytesIO(file_content)) 
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
        else:
            text = file_content.decode("utf-8")
        
        doc = UserDocument(
            uid=user_id,
            filename=filename,
            content=text,
            created_at=datetime.now()
        )
        self.doc_repo.save(doc)
        return doc

    def get_user_documents(self, user_id: str):
        return self.doc_repo.get_by_user(user_id)
