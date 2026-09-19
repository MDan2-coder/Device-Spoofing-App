from fastapi import APIRouter, Depends, Request, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    RefreshTokenRequest,
    LogoutRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    MessageResponse,
)
from app.services.auth_service import AuthService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    user = await service.register_user(payload)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    content_type = request.headers.get("content-type", "").lower()
    if content_type.startswith("application/x-www-form-urlencoded") or content_type.startswith("multipart/form-data"):
        form = await request.form()
        raw_payload = {
            "email": form.get("email") or form.get("username"),
            "password": form.get("password"),
        }
    else:
        try:
            raw_payload = await request.json()
        except ValueError as exc:
            raise RequestValidationError([{"loc": ("body",), "msg": "A JSON or form login payload is required.", "type": "json_invalid"}]) from exc

    try:
        payload = UserLoginRequest.model_validate(raw_payload)
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc

    service = AuthService(db)
    user = await service.authenticate_user(payload.email, payload.password)
    ip_addr = request.client.host if request.client else None

    access_token = create_access_token(subject=str(user.id))
    refresh_token = await service.create_refresh_token(user_id=user.id, ip_address=ip_addr)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_session(
    payload: RefreshTokenRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    service = AuthService(db)
    ip_addr = request.client.host if request.client else None
    user, new_refresh_token = await service.rotate_refresh_token(payload.refresh_token, ip_address=ip_addr)
    new_access_token = create_access_token(subject=str(user.id))

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(payload: LogoutRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    await service.revoke_refresh_token(payload.refresh_token)
    return MessageResponse(message="Successfully logged out.")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    raw_token = await service.generate_password_reset(payload.email)
    # Production me email bhejenge; dev me token standard logging/debugging response format me handle hota hai
    return MessageResponse(message="If the account exists, a reset link has been dispatched.")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    await service.reset_password(payload.token, payload.new_password)
    return MessageResponse(message="Password reset successfully. Please log in with your new credentials.")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user