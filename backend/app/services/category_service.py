from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_for_user(self, user_id: UUID) -> List[Category]:
        """User ki sabhi categories fetch karega"""
        stmt = select(Category).where(Category.user_id == user_id).order_by(Category.name.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id_for_user(self, category_id: UUID, user_id: UUID) -> Category:
        """Tenant check: Agar category kisi aur user ki hai to 404 dega"""
        stmt = select(Category).where(Category.id == category_id, Category.user_id == user_id)
        result = await self.db.execute(stmt)
        category = result.scalar_one_or_none()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found."
            )
        return category

    async def create(self, user_id: UUID, payload: CategoryCreate) -> Category:
        # Check duplicate name for this specific user
        stmt = select(Category).where(Category.user_id == user_id, Category.name == payload.name.strip())
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{payload.name.strip()}' already exists."
            )

        category = Category(
            user_id=user_id,
            name=payload.name.strip(),
            color=payload.color
        )
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def update(self, category_id: UUID, user_id: UUID, payload: CategoryUpdate) -> Category:
        category = await self.get_by_id_for_user(category_id, user_id)
        category.name = payload.name.strip()
        category.color = payload.color
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def delete(self, category_id: UUID, user_id: UUID) -> None:
        category = await self.get_by_id_for_user(category_id, user_id)
        await self.db.delete(category)
        await self.db.commit()