import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from app.config import settings

# Engine configuration for PostgreSQL / Supabase
db_url = settings.DATABASE_URL or ""
if "pgbouncer=true" in db_url:
    db_url = db_url.replace("?pgbouncer=true", "")

is_serverless = os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None

engine_kwargs = {
    "pool_pre_ping": True,
}
if is_serverless:
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

Base = declarative_base()
engine = None
SessionLocal = None

try:
    if db_url and db_url.startswith("postgres"):
        engine = create_engine(db_url, **engine_kwargs)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"[Database] Warning: Engine creation deferred or failed: {e}")

def get_db():
    if SessionLocal is None:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
