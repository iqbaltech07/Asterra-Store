# Asterra Store — Core Backend Service (Pure FastAPI)

Layanan backend terpusat untuk seluruh ekosistem Asterra Store (Storefront Customer, Portal Sales, dan Admin Command Console) yang dibangun menggunakan **Pure Python FastAPI** berkinerja tinggi, asynchronous, dan terhubung langsung ke **Supabase PostgreSQL** via SQLAlchemy ORM.

## 🚀 Quick Start

### 1. Setup Python Environment
```bash
# Setup virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Jalankan Server FastAPI
```bash
# Dari root project:
npm run dev:backend

# Atau langsung dari folder backend:
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Documentation (Swagger UI)**: `http://localhost:8000/docs`
- **Alternative API Documentation (ReDoc)**: `http://localhost:8000/redoc`
- **Health Check Endpoint**: `http://localhost:8000/health`

## 📁 Struktur Direktori

```
backend/
├── app/                  # FastAPI Application Core
│   ├── core/             # Database session pool, security, hashing
│   ├── models/           # SQLAlchemy ORM models (Supabase PostgreSQL)
│   ├── services/         # Business logic (Catalog, Orders, Finance, Sales, Auth)
│   ├── config.py         # App configuration & environment settings
│   └── main.py           # FastAPI entrypoint & API routers (/api/v1/...)
├── data/                 # JSON fallback caches & catalog snapshots
├── docs/                 # Architecture blueprints & schema reference
├── public/               # Uploaded images, media fallbacks & assets
├── certificates/         # Development SSL certificates
├── requirements.txt      # Python dependencies
└── .env                  # Supabase & app environment variables
```
