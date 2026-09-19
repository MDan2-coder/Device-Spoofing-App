from fastapi import APIRouter
from app.api.v1 import admin, applications, auth, backups, categories, devices, profiles, statistics

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(categories.router)
api_router.include_router(profiles.router)
api_router.include_router(applications.router)
api_router.include_router(devices.router)
api_router.include_router(backups.router)
api_router.include_router(statistics.router)
api_router.include_router(admin.router)