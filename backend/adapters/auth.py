from firebase_admin import auth
from fastapi import HTTPException
from domain.interfaces import IAuthRepository

#verify firebase id token, return user uid if valid, otherwise raise an exception
class AuthRepository(IAuthRepository):
    def verify_token(self, id_token: str) -> str:
        try:
            decoded = auth.verify_id_token(id_token)
            return decoded["uid"]
        except Exception as e:
            print(f"Firebase error: {e}")
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")  

