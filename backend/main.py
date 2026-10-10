import sys
from pathlib import Path

# Add backend directory and app directory to sys.path
backend_dir = Path(__file__).resolve().parent
app_dir = backend_dir / "app"

for p in [str(backend_dir), str(app_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.main import app
