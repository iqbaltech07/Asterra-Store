import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import List

# Resolve Backend Directory
BACKEND_DIR = Path(__file__).resolve().parent.parent

# 1. Determine environment mode: 'development' or 'production'
# Priority: ENVIRONMENT env var > APP_ENV env var > default 'development'
env_mode = os.getenv("ENVIRONMENT", os.getenv("APP_ENV", "")).lower()

# 2. Load base .env if present
base_env_path = BACKEND_DIR / ".env"
if base_env_path.exists():
    load_dotenv(base_env_path)

if not env_mode:
    env_mode = os.getenv("ENVIRONMENT", os.getenv("APP_ENV", "development")).lower()

# 3. Load environment-specific file with override
if env_mode in ("production", "prod"):
    prod_env = BACKEND_DIR / ".env.production"
    if prod_env.exists():
        load_dotenv(prod_env, override=True)
else:
    dev_env = BACKEND_DIR / ".env.development"
    if dev_env.exists():
        load_dotenv(dev_env, override=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Asterra Store Core API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/v1"
    
    # Server & Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Database (Supabase PostgreSQL)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres.kszyhgyddstbdooxsnuo:Asterra!Database@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    )
    DIRECT_URL: str = os.getenv("DIRECT_URL", "")
    
    # Security & JWT Authentication
    SECRET_KEY: str = (
        os.getenv("SECRET_KEY") 
        or os.getenv("JWT_SECRET") 
        or "asterra_jwt_secret_production_key_super_secure_2026"
    )
    ADMIN_SESSION_SECRET: str = os.getenv("ADMIN_SESSION_SECRET", "")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@asterra.store")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "AsterraAdmin#2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Tripay Payment Gateway
    TRIPAY_API_KEY: str = os.getenv("TRIPAY_API_KEY", "")
    TRIPAY_PRIVATE_KEY: str = os.getenv("TRIPAY_PRIVATE_KEY", "")
    TRIPAY_MERCHANT_CODE: str = os.getenv("TRIPAY_MERCHANT_CODE", "")
    TRIPAY_IS_PRODUCTION: bool = os.getenv("TRIPAY_IS_PRODUCTION", "false").lower() == "true"
    
    # Vercel Blob Storage
    BLOB_READ_WRITE_TOKEN: str = os.getenv("BLOB_READ_WRITE_TOKEN", "")
    
    # VIP Reseller Supplier Integration
    VIP_RESELLER_BASE_URL: str = os.getenv("VIP_RESELLER_BASE_URL", "https://vip-reseller.co.id/api")
    VIP_RESELLER_API_ID: str = os.getenv("VIP_RESELLER_API_ID", "")
    VIP_RESELLER_API_KEY: str = os.getenv("VIP_RESELLER_API_KEY", "")
    VIP_RESELLER_SIGN: str = os.getenv("VIP_RESELLER_SIGN", "")
    VIP_RESELLER_SYNC_SECRET: str = os.getenv("VIP_RESELLER_SYNC_SECRET", "")
    
    # Transactional Email (SMTP)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "localhost")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASS: str = os.getenv("SMTP_PASS", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "Asterra Store <noreply@asterra.store>")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "https://asterrastore.biz.id",
        "https://www.asterrastore.biz.id",
        "https://admin.asterrastore.biz.id",
        "https://www.admin.asterrastore.biz.id",
        "https://sales.asterrastore.biz.id",
        "https://www.sales.asterrastore.biz.id",
        "https://api.asterrastore.biz.id",
        "https://www.api.asterrastore.biz.id",
    ]

    @property
    def cors_origins(self) -> List[str]:
        raw = os.getenv("ALLOWED_ORIGINS", "")
        if raw:
            origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
            if origins:
                return origins
        return self.BACKEND_CORS_ORIGINS

    class Config:
        extra = "allow"

settings = Settings()
