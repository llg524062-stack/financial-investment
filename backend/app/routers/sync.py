from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
from app.schemas import ApiResponse
from app.services.sync_service import run_full_sync, sync_symbol

router = APIRouter(prefix="/sync", tags=["sync"])


def _job() -> None:
    db = SessionLocal()
    try:
        run_full_sync(db)
    finally:
        db.close()


@router.post("/run")
def trigger_sync(background_tasks: BackgroundTasks) -> ApiResponse:
    background_tasks.add_task(_job)
    return ApiResponse(message="sync started in background")


@router.post("/run-now")
def sync_now(db: Session = Depends(get_db)) -> ApiResponse:
    run_full_sync(db)
    return ApiResponse(message="sync completed")


def _sync_one_job(code: str) -> None:
    db = SessionLocal()
    try:
        sync_symbol(db, code.upper())
    finally:
        db.close()


@router.post("/symbol/{code}")
def sync_one(code: str, background_tasks: BackgroundTasks) -> ApiResponse:
    """同步单只股票行情与基本面（用户搜索新标的时触发）。"""
    background_tasks.add_task(_sync_one_job, code.upper())
    return ApiResponse(data={"symbol": code.upper(), "status": "started"})
