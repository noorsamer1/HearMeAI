"""FastAPI application entry point with full observability and security."""

import time
import uuid
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging_config import configure_logging, get_logger
from app.core.metrics import metrics
from app.core.rate_limit import limiter
from app.db.seed import seed_sign_mappings_if_empty
from app.db.session import get_session_factory
from app.services.ws_redis import start_redis_ws_listener, stop_redis_ws_listener

settings = get_settings()
configure_logging(debug=settings.debug)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "AI Communication Assistant starting",
        version=settings.app_version,
        debug=settings.debug,
        tts_provider=settings.tts_provider,
        llm_model=settings.openrouter_model,
    )
    try:
        factory = get_session_factory()
        async with factory() as db:
            await seed_sign_mappings_if_empty(db)
            await db.commit()
    except Exception as exc:
        logger.warning("db_seed_skipped", error=str(exc))
    start_redis_ws_listener()
    yield
    stop_redis_ws_listener()
    logger.info("Shutting down gracefully")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Real-time AI communication platform for deaf and mute individuals.\n\n"
        "Supports Speech-to-Text (Whisper), Text-to-Speech (Edge TTS), "
        "and AI assistance (OpenRouter) over WebSocket and REST."
    ),
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
)

# ── Middleware ────────────────────────────────────────────────

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_instrumentation(request: Request, call_next):
    """Attach correlation ID, log requests, and record latency metrics."""
    correlation_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start = time.perf_counter()

    with structlog.contextvars.bound_contextvars(
        correlation_id=correlation_id,
        method=request.method,
        path=request.url.path,
    ):
        response = await call_next(request)
        elapsed_ms = int((time.perf_counter() - start) * 1000)

        operation = f"http_{request.method.lower()}_{request.url.path.replace('/', '_').strip('_')}"
        metrics.record(operation, elapsed_ms, success=response.status_code < 500)

        if not request.url.path.startswith("/api/v1/health"):
            logger.info(
                "Request",
                status=response.status_code,
                elapsed_ms=elapsed_ms,
            )

        response.headers["X-Request-ID"] = correlation_id
        response.headers["X-Response-Time"] = f"{elapsed_ms}ms"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response


# ── Global exception handler ──────────────────────────────────

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.warning("Validation error", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=422,
        content={"error": str(exc), "code": "validation_error"},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error", path=request.url.path, error=str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "An unexpected error occurred", "code": "internal_error"},
    )


# ── Routes ────────────────────────────────────────────────────

app.include_router(api_router, prefix="/api/v1")


@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "ok",
        "endpoints": {
            "health": "/api/v1/health",
            "auth": "/api/v1/auth",
            "sessions": "/api/v1/sessions",
            "match": "/api/v1/match",
            "stt": "/api/v1/speech-to-text",
            "tts": "/api/v1/text-to-speech",
            "ai": "/api/v1/ai-response",
            "ws": "/api/v1/ws/session/{session_id}",
            "metrics": "/api/v1/metrics",
        },
    }
