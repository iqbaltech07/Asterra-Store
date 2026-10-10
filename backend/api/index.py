import sys
import os
import traceback
from pathlib import Path

# Add backend directory and app directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
app_dir = backend_dir / "app"

for p in [str(backend_dir), str(app_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app
except Exception as e:
    err_tb = traceback.format_exc()
    print("FATAL ERROR IMPORTING app.main:\n" + err_tb, flush=True)
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    app = FastAPI(title="Asterra Store API - Diagnostic Mode")

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
    def catch_all(full_path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "FastAPI failed to import app.main",
                "exception": str(e),
                "traceback": err_tb.splitlines(),
                "sys_path": sys.path,
                "cwd": os.getcwd(),
                "backend_dir": str(backend_dir),
                "files_in_backend": os.listdir(str(backend_dir)) if backend_dir.exists() else "not found",
            }
        )
