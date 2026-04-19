"""AI response endpoint with streaming and action support."""

import json
import time

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from app.core.logging_config import get_logger
from app.core.rate_limit import limiter
from app.schemas.ai import AIRequest, ActionRequest, ActionResponse
from app.services.openrouter_client import OpenRouterClient, get_llm_client

router = APIRouter()
logger = get_logger(__name__)


@router.post("/ai-response")
@limiter.limit("30/minute")
async def ai_response(
    request: Request,
    body: AIRequest,
    llm: OpenRouterClient = Depends(get_llm_client),
):
    """
    Get AI-powered response with optional streaming.

    Supports tasks: chat, simplify, clarify, translate.
    """
    if body.stream:
        return StreamingResponse(
            _stream_response(body, llm),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    # Non-streaming
    try:
        start = time.perf_counter()
        text = await llm.complete(body.messages)
        elapsed_ms = int((time.perf_counter() - start) * 1000)
    except Exception as exc:
        logger.error("AI completion error", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI response failed. Please try again.",
        )

    return {
        "text": text,
        "task": body.task,
        "processing_time_ms": elapsed_ms,
    }


async def _stream_response(body: AIRequest, llm: OpenRouterClient):
    """SSE stream generator for AI responses."""
    try:
        async for token in llm.stream_chat(body.messages):
            data = json.dumps({"token": token, "task": body.task})
            yield f"data: {data}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as exc:
        logger.error("AI streaming error", error=str(exc))
        error_data = json.dumps({"error": "AI response failed", "code": "ai_error"})
        yield f"data: {error_data}\n\n"


@router.post("/action", response_model=ActionResponse)
@limiter.limit("20/minute")
async def run_action(
    request: Request,
    body: ActionRequest,
    llm: OpenRouterClient = Depends(get_llm_client),
) -> ActionResponse:
    """
    Run a text action: simplify, clarify, or translate.
    Returns the processed result synchronously.
    """
    try:
        result = ""
        async for token in llm.stream_action(
            action=body.action,
            text=body.text,
            target_language=body.target_language,
        ):
            result += token
    except Exception as exc:
        logger.error("Action error", action=body.action, error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Action '{body.action}' failed. Please try again.",
        )

    return ActionResponse(
        original_text=body.text,
        result_text=result.strip(),
        action=body.action,
    )
