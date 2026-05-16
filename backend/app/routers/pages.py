from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ApiResponse
from app.services import page_service

router = APIRouter(prefix="/pages", tags=["pages"])


@router.get("/market/{symbol}")
def market_page(symbol: str, db: Session = Depends(get_db)) -> ApiResponse:
    return ApiResponse(data=page_service.get_market_page(db, symbol))


@router.get("/fundamental/{symbol}")
def fundamental_page(symbol: str, db: Session = Depends(get_db)) -> ApiResponse:
    return ApiResponse(data=page_service.get_fundamental_page(db, symbol))


@router.get("/macro")
def macro_page(db: Session = Depends(get_db)) -> ApiResponse:
    return ApiResponse(data=page_service.get_macro_page(db))


@router.get("/news")
def news_page(symbol: str | None = None, db: Session = Depends(get_db)) -> ApiResponse:
    return ApiResponse(data=page_service.get_news_page(db, symbol))


@router.get("/insights")
def insights_page(
    scope: str = Query("market"),
    symbol: str | None = None,
    db: Session = Depends(get_db),
) -> ApiResponse:
    return ApiResponse(data=page_service.get_insights_page(db, scope, symbol))


@router.get("/alerts")
def alerts_page(
    scope: str = Query("market"),
    symbol: str | None = None,
    db: Session = Depends(get_db),
) -> ApiResponse:
    return ApiResponse(data=page_service.get_alerts_page(db, scope, symbol))


@router.get("/dashboard/market-extras")
def market_extras(db: Session = Depends(get_db)) -> ApiResponse:
    return ApiResponse(data=page_service.get_market_dashboard_extras(db))


@router.get("/settings")
def settings_page() -> ApiResponse:
    return ApiResponse(data=page_service.get_settings_page())


@router.get("/portfolio")
def portfolio_get(db: Session = Depends(get_db)) -> ApiResponse:
    return ApiResponse(data=page_service.get_portfolio(db))


@router.put("/portfolio")
def portfolio_put(payload: dict = Body(...), db: Session = Depends(get_db)) -> ApiResponse:
    page_service.save_portfolio(payload)
    return ApiResponse(data=page_service.get_portfolio(db))
