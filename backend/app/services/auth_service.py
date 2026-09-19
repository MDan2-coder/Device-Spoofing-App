from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import User, RefreshToken
from app.schemas.auth import UserRegisterRequest
from app.core.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    generate_refresh_token_string,
    hash_token,
    create_password_reset_token,
    verify_password_reset_token,
)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.lower().strip())
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def register_user(self, payload: UserRegisterRequest) -> User:
        existing_user = await self.get_by_email(payload.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists."
            )

        new_user = User(
            email=payload.email.lower().strip(),
            hashed_password=get_password_hash(payload.password),
            full_name=payload.full_name,
            role="USER",
            is_active=True,
            is_verified=False
        )
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)
        return new_user

    async def authenticate_user(self, email: str, password: str) -> User:
        user = await self.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated."
            )
        return user

    async def create_refresh_token(self, user_id: UUID, ip_address: Optional[str] = None) -> str:
        raw_token = generate_refresh_token_string()
        token_record = RefreshToken(
            user_id=user_id,
            token_hash=hash_token(raw_token),
            ip_address=ip_address,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        self.db.add(token_record)
        await self.db.commit()
        return raw_token

    async def rotate_refresh_token(self, raw_token: str, ip_address: Optional[str] = None) -> tuple[User, str]:
        t_hash = hash_token(raw_token)
        stmt = select(RefreshToken).where(RefreshToken.token_hash == t_hash)
        result = await self.db.execute(stmt)
        record = result.scalar_one_or_none()

        if not record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token."
            )

        if record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            await self.db.delete(record)
            await self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired."
            )

        user = await self.get_by_id(record.user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

        # Invalidate old token and issue a fresh one
        await self.db.delete(record)
        new_token = await self.create_refresh_token(user.id, ip_address=ip_address)
        return user, new_token

    async def revoke_refresh_token(self, raw_token: str) -> None:
        t_hash = hash_token(raw_token)
        stmt = delete(RefreshToken).where(RefreshToken.token_hash == t_hash)
        await self.db.execute(stmt)
        await self.db.commit()

    async def generate_password_reset(self, email: str) -> Optional[str]:
        user = await self.get_by_email(email)
        if not user or not user.is_active:
            return None
        return create_password_reset_token(user.email)

    async def reset_password(self, token: str, new_password: str) -> None:
        email = verify_password_reset_token(token)
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token."
            )
        user = await self.get_by_email(email)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        user.hashed_password = get_password_hash(new_password)
        # Invalidate all existing sessions on password change
        stmt = delete(RefreshToken).where(RefreshToken.user_id == user.id)
        await self.db.execute(stmt)
        await self.db.commit()