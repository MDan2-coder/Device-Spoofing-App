import asyncio
from app.core.database import engine
from app.models.base import Base
# Saare models import karna zaroori hai taaki Base.metadata me tables register ho sakein
from app.models.user import User, RefreshToken
from app.models.category import Category
from app.models.device import Device, DevicePreset
from app.models.profile import Profile, ProfileSettings
from app.models.application import Application, AppGroup, GroupApplication, ProfileAppGroup
from app.models.backup import Backup
from app.models.audit import AuditLog


async def create_all_tables():
    print("Connecting to PostgreSQL and creating missing tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[SUCCESS] All tables registered and synchronized in PostgreSQL!")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_all_tables())