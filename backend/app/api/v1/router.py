from fastapi import APIRouter

from app.api.v1.endpoints import (
    ai_response,
    auth,
    health,
    match,
    sessions,
    sign_translate,
    speech_to_text,
    text_to_speech,
    users,
    ws_session,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(sessions.router)
api_router.include_router(match.router)
api_router.include_router(speech_to_text.router, tags=["stt"])
api_router.include_router(text_to_speech.router, tags=["tts"])
api_router.include_router(ai_response.router, tags=["ai"])
api_router.include_router(sign_translate.router, tags=["sign"])
api_router.include_router(ws_session.router, tags=["realtime"])
