import os
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-secret-change-me-in-production-0123456789")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", f"sqlite:///{BASE / 'gariyangu.db'}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")]
    TOKEN_HOURS = int(os.environ.get("TOKEN_HOURS", "72"))
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", str(BASE / "uploads"))
    MAX_CONTENT_LENGTH = 55 * 1024 * 1024  # 10 images, up to 5 MB each plus multipart overhead
    JSON_SORT_KEYS = False
