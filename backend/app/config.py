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

# 3. Load environment-specific file with override (only non-empty values overwrite base .env)
from dotenv import dotenv_values
prod_env = BACKEND_DIR / ".env.production"
dev_env = BACKEND_DIR / ".env.development"
target_env = prod_env if env_mode in ("production", "prod") else dev_env
if target_env.exists():
    for k, v in dotenv_values(target_env).items():
        if v is not None and v.strip():
            os.environ[k] = v


class Settings(BaseSettings):
    PROJECT_NAME: str = "Asterra Store Core API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/v1"
    
    # Server & Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Database (Supabase PostgreSQL via Environment Variable)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    DIRECT_URL: str = os.getenv("DIRECT_URL", "")
    
    SECRET_KEY: str = (
        os.getenv("JWT_SECRET")
        or os.getenv("SECRET_KEY")
        or "asterra_jwt_secret_dev_fallback_key_2026"
    )
    BETTER_AUTH_SECRET: str = os.getenv("BETTER_AUTH_SECRET", "")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@asterra.store")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Tripay Payment Gateway
    TRIPAY_API_KEY: str = os.getenv("TRIPAY_API_KEY", "")
    TRIPAY_PRIVATE_KEY: str = os.getenv("TRIPAY_PRIVATE_KEY", "")
    TRIPAY_MERCHANT_CODE: str = os.getenv("TRIPAY_MERCHANT_CODE", "")
    TRIPAY_IS_PRODUCTION: bool = os.getenv("TRIPAY_IS_PRODUCTION", "false").lower() == "true"
    
    # Vercel Blob Storage
    BLOB_READ_WRITE_TOKEN: str = os.getenv("BLOB_READ_WRITE_TOKEN", "")
    
    # Upstash Serverless Redis & Cache
    UPSTASH_REDIS_REST_URL: str = os.getenv("UPSTASH_REDIS_REST_URL", "")
    UPSTASH_REDIS_REST_TOKEN: str = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")
    
    # Upstash QStash (Serverless Background Jobs & Cron)
    QSTASH_TOKEN: str = os.getenv("QSTASH_TOKEN", "")
    QSTASH_URL: str = os.getenv("QSTASH_URL", "https://qstash-us-east-1.upstash.io")
    QSTASH_CURRENT_SIGNING_KEY: str = os.getenv("QSTASH_CURRENT_SIGNING_KEY", "")
    QSTASH_NEXT_SIGNING_KEY: str = os.getenv("QSTASH_NEXT_SIGNING_KEY", "")
    INTERNAL_CRON_SECRET: str = os.getenv("INTERNAL_CRON_SECRET", "")
    
    # VIP Reseller Supplier Integration
    VIP_RESELLER_BASE_URL: str = os.getenv("VIP_RESELLER_BASE_URL", "https://vip-reseller.co.id/api")
    VIP_RESELLER_API_ID: str = os.getenv("VIP_RESELLER_API_ID", "")
    VIP_RESELLER_API_KEY: str = os.getenv("VIP_RESELLER_API_KEY", "")
    VIP_RESELLER_SIGN: str = os.getenv("VIP_RESELLER_SIGN", "")
    VIP_RESELLER_SYNC_SECRET: str = os.getenv("VIP_RESELLER_SYNC_SECRET", "")
    VIP_RESELLER_AUTO_FULFILLMENT: bool = os.getenv("VIP_RESELLER_AUTO_FULFILLMENT", "true").lower() == "true"
    VIP_RESELLER_SANDBOX_MODE: bool = os.getenv("VIP_RESELLER_SANDBOX_MODE", "false").lower() == "true"
    
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
