from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ApiResponse
from app.services import market_service

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/indices")
def indices(db: Session = Depends(get_db)) -> ApiResponse:
    return ApiResponse(data=market_service.get_index_cards(db))


@router.get("/watchlist")
def watchlist(db: Session = Depends(get_db)) -> ApiResponse:
    return ApiResponse(data=market_service.get_watchlist(db))


@router.get("/alerts")
def alerts(
    scope: str = Query("market", pattern="^(market|symbol)$"),
    symbol: str | None = None,
    db: Session = Depends(get_db),
) -> ApiResponse:
    return ApiResponse(data=market_service.get_alerts(db, scope, symbol))


@router.get("/index-series")
def index_series(period: str = Query("3m"), db: Session = Depends(get_db)) -> ApiResponse:
    return ApiResponse(data=market_service.get_index_series(db, period))


@router.get("/symbol/{code}")
def symbol_info(code: str, db: Session = Depends(get_db)) -> ApiResponse:
    info = market_service.resolve_symbol_info(db, code)
    return ApiResponse(data=info)
