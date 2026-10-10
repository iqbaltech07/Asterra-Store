# Troubleshooting: Vercel Python uv Sync Interpreter Version Mismatch

## 📌 Problem Summary
Saat melakukan deployment FastAPI backend ke Vercel yang menggunakan package manager `uv`, build process gagal pada tahap instalasi dependensi:

```bash
Warning: Python version "3.11" detected in backend/.python-version is not installed and will be ignored. https://vercel.link/python-version
Using python version: 3.12
Using uv 0.10.11
Installing required dependencies from pyproject.toml...
Error: Failed to run "uv sync --active --no-dev --link-mode hardlink --locked --no-editable": Command failed: /usr/local/bin/uv sync --active --no-dev --link-mode hardlink --locked --no-editable
error: No interpreter found for Python 3.11 in managed installations or search path
hint: uv embeds available Python downloads and may require an update to install new versions. Consider retrying on a newer version of uv.
```

---

## 🔍 Root Cause Analysis

1. **Vercel Python Runtime Support**:
   - Vercel saat ini mendukung Python versi **3.12** (default), **3.13**, dan **3.14**.
   - Versi Python 3.11 tidak lagi terinstal secara bawaan pada runner container build Vercel.
   - Vercel mendeteksi `backend/.python-version` bernilai `3.11`, mengeluarkan warning bahwa versi tersebut diabaikan, dan menetapkan runtime runner ke Python 3.12.

2. **Perilaku Native `uv sync` terhadap `.python-version`**:
   - Vercel mengeksekusi `/usr/local/bin/uv sync --active --no-dev --link-mode hardlink --locked --no-editable`.
   - Meskipun Vercel telah mengalihkan runner-nya ke Python 3.12, CLI `uv` secara otomatis membaca file `.python-version` yang berada di direktori proyek (`backend/.python-version = 3.11`).
   - Karena `uv` diwajibkan mencari Python 3.11 tetapi environment container Vercel hanya menyediakan Python 3.12 dan tidak mengizinkan managed python download saat build, `uv` melempar fatal error: `No interpreter found for Python 3.11 in managed installations or search path`.

3. **Restored Build Cache & Flag `--locked`**:
   - Vercel menjalankan `uv sync` dengan flag `--locked`.
   - Ketika lockfile tidak dikomit atau berisi metadata versi Python lama dari cache Vercel, `uv sync` gagal memvalidasi environment.

---

## 💡 Best Practice & Solution

### 1. Perbarui `.python-version` ke `3.12`
Ubah isi file `backend/.python-version`:
```text
3.12
```

### 2. Selaraskan `pyproject.toml` ke Python 3.12 & Konfigurasi Vercel Entrypoint
Pastikan `requires-python` minimal `>=3.12` dan cantumkan entrypoint FastAPI dengan format `module:object`:
```toml
[project]
name = "asterra-backend"
version = "1.0.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn>=0.30.0",
    "pydantic>=2.8.0",
    "pydantic-settings>=2.4.0",
    "sqlalchemy>=2.0.30",
    "psycopg2-binary>=2.9.9",
    "httpx>=0.27.0",
    "python-multipart>=0.0.9",
    "python-dotenv>=1.0.0",
]

[tool.vercel]
entrypoint = "main:app"
```

### 3. Generate & Komit `uv.lock` Bersih
Jalankan di lokal:
```bash
uv lock
```
Kemit file `uv.lock` ke Git repository agar Vercel build container mengeksekusi `uv sync --locked` secara deterministik tanpa regenerasi desync.

### 4. Normalisasi Skema Database URI SQLAlchemy 2.0
Jika menggunakan `psycopg2-binary`, SQLAlchemy 2.0 secara default mencari driver `psycopg` (v3) jika format URI hanya `postgresql://`. Normalisasikan skema URL ke `postgresql+psycopg2://`:
```python
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
```
