from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ApiResponse
from app.services import market_service

router = APIRouter(prefix="/macro", tags=["macro"])


@router.get("/overview")
def macro_overview(db: Session = Depends(get_db)) -> ApiResponse:
    return ApiResponse(data=market_service.get_macro_overview(db))
