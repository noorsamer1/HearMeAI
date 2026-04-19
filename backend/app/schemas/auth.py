from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=120)
    user_type: str = Field(pattern="^(deaf|mute|both)$")
    locale: str = Field(default="en", max_length=32)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthUserOut(BaseModel):
    id: str
    email: str
    display_name: str
    user_type: str
    locale: str

    model_config = {"from_attributes": True}


class AuthResponse(TokenResponse):
    user: AuthUserOut


class WsTicketResponse(BaseModel):
    token: str
    expires_in: int
