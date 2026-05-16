import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import SessionLocal, init_db
from app.routers import health, macro, market, news, pages, sync, symbol
from app.services.sync_service import run_full_sync

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()


def _scheduled_sync() -> None:
    db = SessionLocal()
    try:
        run_full_sync(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    init_db()
    if settings.run_sync_on_startup:
        logger.info("Running initial data sync (may take a few minutes)...")
        try:
            _scheduled_sync()
        except Exception as e:
            logger.error("Initial sync error: %s", e)

    scheduler.add_job(
        _scheduled_sync,
        "cron",
        hour=settings.sync_cron_hour,
        minute=settings.sync_cron_minute,
        id="daily_sync",
    )
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="GLL Financial Investment API",
        version="1.0.0",
        lifespan=lifespan,
    )
    # 生产环境务必在 Railway 设置 CORS_ORIGINS；同时放行 *.vercel.app 预览域名
    cors_origins = settings.cors_origin_list or [
        "http://localhost:5173",
        "https://financial-investment-one.vercel.app",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    api = APIRouter(prefix="/api")
    api.include_router(health.router)
    api.include_router(market.router)
    api.include_router(symbol.router)
    api.include_router(news.router)
    api.include_router(macro.router)
    api.include_router(sync.router)
    api.include_router(pages.router)
    app.include_router(api)
    return app


app = create_app()
