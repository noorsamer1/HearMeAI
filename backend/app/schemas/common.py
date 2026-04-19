from pydantic import BaseModel


class ErrorResponse(BaseModel):
    error: str
    code: str
    detail: str | None = None


class HealthResponse(BaseModel):
    status: str
    version: str
    services: dict[str, str]
