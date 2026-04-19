from fastapi import APIRouter, Request

from app.core.config import get_settings
from app.core.metrics import metrics
from app.core.rate_limit import limiter
from app.schemas.common import HealthResponse
from app.services.context_manager import context_registry

router = APIRouter()
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    db_ok = "unknown"
    try:
        from sqlalchemy import text

        from app.db.session import get_session_factory

        factory = get_session_factory()
        async with factory() as db:
            await db.execute(text("SELECT 1"))
            await db.commit()
        db_ok = "ok"
    except Exception:
        db_ok = "unavailable"

    return HealthResponse(
        status="ok",
        version=settings.app_version,
        services={
            "stt": f"{settings.stt_provider}/{settings.stt_model_name}",
            "tts": settings.tts_provider,
            "llm": f"openrouter/{settings.openrouter_model}",
            "active_sessions": str(len(context_registry)),
            "database": db_ok,
            "redis_ws": "on" if settings.use_redis else "off",
        },
    )


@router.get("/ready")
async def readiness_check():
    return {"status": "ready"}


@router.get("/metrics")
@limiter.limit("30/minute")
async def get_metrics(request: Request):
    """Internal performance metrics (should be protected in production)."""
    return metrics.get_all()
