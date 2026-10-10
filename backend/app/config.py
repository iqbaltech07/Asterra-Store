import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Asterra Store Core API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres.nndvryekgbbjntoteyqm:AsterraStore12345%40@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    )
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "asterra_jwt_secret_production_key_super_secure_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Tripay Payment Gateway
    TRIPAY_API_KEY: str = os.getenv("TRIPAY_API_KEY", "")
    TRIPAY_PRIVATE_KEY: str = os.getenv("TRIPAY_PRIVATE_KEY", "")
    TRIPAY_MERCHANT_CODE: str = os.getenv("TRIPAY_MERCHANT_CODE", "")
    TRIPAY_IS_PRODUCTION: bool = os.getenv("TRIPAY_IS_PRODUCTION", "false").lower() == "true"
    
    # Vercel Blob Storage
    BLOB_READ_WRITE_TOKEN: str = os.getenv("BLOB_READ_WRITE_TOKEN", "")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://asterrastore.biz.id",
        "https://admin.asterrastore.biz.id",
        "https://sales.asterrastore.biz.id",
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
