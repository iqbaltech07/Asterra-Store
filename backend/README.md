# Asterra Store — Core Backend Service

Layanan backend terpusat untuk seluruh ekosistem Asterra Store (Storefront Customer, Portal Sales, dan Admin Command Console).

## 🚀 Pilihan Runtime

### 1. Python FastAPI Runtime
Backend FastAPI berkinerja tinggi, asynchronous, dan mendukung Swagger UI interaktif di `/docs`.

```bash
# Setup virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI Development Server
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 2. Node.js / Next.js API Runtime
Mesin API Next.js yang sudah ada (`src/app/api/`) dengan Prisma ORM ke Supabase PostgreSQL.

```bash
# Run Next.js API server
npm run dev -- -p 8001
```
