from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ApiResponse
from app.services import llm_service, market_service, page_service

router = APIRouter(prefix="/symbol", tags=["symbol"])


@router.get("/{code}/dashboard")
async def symbol_dashboard(code: str, db: Session = Depends(get_db)) -> ApiResponse:
    data = page_service.extend_symbol_dashboard(db, code)
    data = await llm_service.enrich_dashboard_with_llm(data)
    return ApiResponse(data=data)


@router.get("/{code}/quotes")
def symbol_quotes(
    code: str,
    period: str = Query("3m"),
    db: Session = Depends(get_db),
) -> ApiResponse:
    return ApiResponse(data=market_service.get_quotes(db, code, period))


@router.get("/{code}/fundamental")
def symbol_fundamental(code: str, db: Session = Depends(get_db)) -> ApiResponse:
    dash = market_service.get_symbol_dashboard(db, code)
    fund = {
        "pe_ttm": dash.dimensions.get("valuation"),
        "score": dash.score,
        "scenarios": [s.model_dump() for s in dash.forecast_scenarios],
    }
    return ApiResponse(data=fund)
