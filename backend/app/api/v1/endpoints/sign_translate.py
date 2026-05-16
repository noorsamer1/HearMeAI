"""Sign language sequence → natural text endpoint."""

import time
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.core.logging_config import get_logger
from app.core.rate_limit import limiter
from app.services.openrouter_client import OpenRouterClient, get_llm_client

router = APIRouter()
logger = get_logger(__name__)


class SignTranslateRequest(BaseModel):
    signs: list[str] = Field(
        ...,
        min_length=1,
        description=(
            "Ordered list of sign tokens. Each token is either a single letter "
            "(fingerspelling) or a named phrase key like 'hello' or 'thank you'."
        ),
    )
    language: Literal["en", "ar"] = Field(
        "en",
        description="Target natural language for the output sentence.",
    )


class SignTranslateResponse(BaseModel):
    text: str
    processing_time_ms: int


_LANG_LABELS = {"en": "English", "ar": "Arabic"}

_SYSTEM_PROMPT = (
    "You are a sign language interpreter. "
    "Convert the provided sign language token sequence into a natural, fluent sentence. "
    "Each token is either:\n"
    "  • A single letter representing a fingerspelled character, or\n"
    "  • A named sign phrase (e.g. 'hello', 'thank you', 'yes', 'help', 'good', 'how are you').\n"
    "IMPORTANT RULES:\n"
    "  1. Preserve the MEANING of EVERY token — do not drop or skip any token.\n"
    "  2. Combine tokens into one grammatically correct, natural sentence.\n"
    "  3. If two tokens carry separate meanings (e.g. 'good' + 'how are you'), "
    "include both: 'Good! How are you?'\n"
    "Return ONLY the final natural language sentence. "
    "Do not add explanations, translations, or extra text."
)


@router.post(
    "/sign-translate",
    response_model=SignTranslateResponse,
    summary="Translate a sign language token sequence to natural text",
    tags=["sign"],
)
@limiter.limit("30/minute")
async def sign_translate(
    request: Request,
    body: SignTranslateRequest,
    llm: OpenRouterClient = Depends(get_llm_client),
) -> SignTranslateResponse:
    """
    Accept a sequence of sign tokens (fingerspelled letters or named phrase keys)
    and return a natural language sentence using the configured LLM.
    """
    lang_label = _LANG_LABELS.get(body.language, "English")
    signs_joined = ", ".join(body.signs)
    user_content = (
        f"Sign token sequence: [{signs_joined}]\n"
        f"Output language: {lang_label}\n"
        "Natural sentence:"
    )

    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]

    try:
        start = time.perf_counter()
        text = await llm.complete(messages)
        elapsed_ms = int((time.perf_counter() - start) * 1000)
    except Exception as exc:
        logger.error("sign_translate_error", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sign translation failed. Please try again.",
        )

    return SignTranslateResponse(
        text=text.strip(),
        processing_time_ms=elapsed_ms,
    )
