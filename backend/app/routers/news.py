from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ApiResponse
from app.services import market_service

router = APIRouter(prefix="/news", tags=["news"])


@router.get("")
def list_news(
    limit: int = Query(40, le=100),
    symbol: str | None = None,
    db: Session = Depends(get_db),
) -> ApiResponse:
    return ApiResponse(data=market_service.get_news(db, limit, symbol))
