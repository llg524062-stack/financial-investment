from fastapi import APIRouter

from app.config import get_settings
from app.schemas import ApiResponse

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> ApiResponse:
    s = get_settings()
    return ApiResponse(
        data={
            "status": "ok",
            "llm_enabled": s.enable_llm,
            "ollama_model": s.ollama_model if s.enable_llm else None,
        }
    )
