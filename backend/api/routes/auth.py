from fastapi import APIRouter, Depends
from api.dependencies import get_current_user_id

router = APIRouter()

@router.get("/protected")
def protected(user_id: str = Depends(get_current_user_id)):
    return {"msg": f"Access OK for {user_id}"}