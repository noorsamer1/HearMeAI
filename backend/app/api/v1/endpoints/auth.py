from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.rate_limit import limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.crud import user as user_crud
from app.db.session import get_db
from app.schemas.auth import AuthResponse, AuthUserOut, LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
@limiter.limit("20/minute")
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await user_crud.get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = await user_crud.create_user(
        db,
        email=body.email,
        password_hash=hash_password(body.password),
        display_name=body.display_name,
        user_type=body.user_type,
        locale=body.locale,
    )
    await db.flush()
    token = create_access_token(user.id)
    return AuthResponse(
        access_token=token,
        user=AuthUserOut(
            id=str(user.id),
            email=user.email,
            display_name=user.display_name,
            user_type=user.user_type,
            locale=user.locale,
        ),
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("30/minute")
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await user_crud.get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id)
    return AuthResponse(
        access_token=token,
        user=AuthUserOut(
            id=str(user.id),
            email=user.email,
            display_name=user.display_name,
            user_type=user.user_type,
            locale=user.locale,
        ),
    )


@router.post("/logout", status_code=204, response_class=Response)
async def logout():
    """Stateless JWT: client discards token. Optional server-side denylist can be added with Redis."""
    return Response(status_code=204)
