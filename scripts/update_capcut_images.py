import os
import sys

UPLOADED_SRC = r"C:\Users\INFINIX\.gemini\antigravity-ide\brain\735fc9c9-fea8-4b38-a0f0-327aa3cfcbe8\.user_uploaded\media_1791791497406.jpg"
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

TARGET_PNG_FILES = [
    os.path.join(WORKSPACE_ROOT, "frontend-user", "public", "images", "apps", "capcut.png"),
    os.path.join(WORKSPACE_ROOT, "frontend-admin", "public", "images", "apps", "capcut.png"),
    os.path.join(WORKSPACE_ROOT, "frontend-sales", "public", "images", "apps", "capcut.png"),
    os.path.join(WORKSPACE_ROOT, "backend", "public", "images", "apps", "capcut.png"),
]

def step1_convert_images():
    print("=== STEP 1: CONVERT & DEPLOY CAPCUT BANNER IMAGE ===")
    from PIL import Image
    if not os.path.exists(UPLOADED_SRC):
        print(f"[ERROR] Source not found: {UPLOADED_SRC}")
        return False

    img = Image.open(UPLOADED_SRC)
    print(f"Loaded source image: size={img.size}, format={img.format}, mode={img.mode}")
    if img.mode != 'RGB':
        img = img.convert('RGB')

    for p in TARGET_PNG_FILES:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        img.save(p, "PNG", optimize=True)
        print(f"  [SAVED] {p} ({os.path.getsize(p)} bytes)")
    return True

def step2_update_db():
    print("\n=== STEP 2: UPDATE DATABASE IMAGE_URL FOR ALL CAPCUT PRODUCTS ===")
    import psycopg2
    from dotenv import load_dotenv

    load_dotenv(os.path.join(WORKSPACE_ROOT, "backend", ".env"))
    db_url = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
    if not db_url:
        print("[ERROR] No database URL found in backend/.env")
        return False

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name, provider_code, status, image_url
        FROM products
        WHERE LOWER(name) LIKE '%capcut%'
           OR LOWER(provider_code) LIKE '%capcut%'
           OR LOWER(brand) LIKE '%capcut%'
        ORDER BY id
    """)
    rows = cur.fetchall()
    print(f"Found {len(rows)} CapCut products in DB:")
    for r in rows:
        print(f"  ID: {r[0]} | SKU: {r[2]} | Old image: {r[4]}")

    new_image_url = "/images/apps/capcut.png"
    cur.execute("""
        UPDATE products
        SET image_url = %s, updated_at = NOW()
        WHERE LOWER(name) LIKE %s
           OR LOWER(provider_code) LIKE %s
           OR LOWER(brand) LIKE %s
    """, (new_image_url, '%capcut%', '%capcut%', '%capcut%'))

    affected = cur.rowcount
    print(f"Updated {affected} rows to image_url = '{new_image_url}'")
    conn.commit()
    conn.close()
    print("[SUCCESS] Database transaction committed successfully!")
    return True

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"
    if mode in ["all", "images"]:
        step1_convert_images()
    if mode in ["all", "db"]:
        step2_update_db()
