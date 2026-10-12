import os
from PIL import Image
import numpy as np

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
UPLOADED_LOGO = r"C:\Users\INFINIX\.gemini\antigravity-ide\brain\735fc9c9-fea8-4b38-a0f0-327aa3cfcbe8\.user_uploaded\media_1791808251234.png"
UPLOADED_BANNER = r"C:\Users\INFINIX\.gemini\antigravity-ide\brain\735fc9c9-fea8-4b38-a0f0-327aa3cfcbe8\.user_uploaded\media_1791791497406.jpg"

APPS_TARGETS = [
    os.path.join(WORKSPACE_ROOT, "frontend-user", "public", "images", "apps", "capcut.png"),
    os.path.join(WORKSPACE_ROOT, "frontend-admin", "public", "images", "apps", "capcut.png"),
    os.path.join(WORKSPACE_ROOT, "frontend-sales", "public", "images", "apps", "capcut.png"),
    os.path.join(WORKSPACE_ROOT, "backend", "public", "images", "apps", "capcut.png"),
]

BANNERS_TARGETS = [
    os.path.join(WORKSPACE_ROOT, "frontend-user", "public", "images", "banners", "capcut-banner.png"),
    os.path.join(WORKSPACE_ROOT, "frontend-admin", "public", "images", "banners", "capcut-banner.png"),
    os.path.join(WORKSPACE_ROOT, "frontend-sales", "public", "images", "banners", "capcut-banner.png"),
    os.path.join(WORKSPACE_ROOT, "backend", "public", "images", "banners", "capcut-banner.png"),
]

def deploy_logo():
    print("=== DEPLOYING CAPCUT LOGO (GAMBAR 1) ===")
    img = Image.open(UPLOADED_LOGO)
    gray = img.convert('L')
    gray_arr = np.array(gray)
    alpha = 255 - gray_arr
    rgba_arr = np.zeros((img.size[1], img.size[0], 4), dtype=np.uint8)
    rgba_arr[:, :, 3] = alpha
    
    clean_logo = Image.fromarray(rgba_arr, mode='RGBA')
    
    for path in APPS_TARGETS:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        clean_logo.save(path, format='PNG', optimize=True)
        print(f"  [SAVED LOGO] {path} ({os.path.getsize(path)} bytes)")

def deploy_banner():
    print("=== DEPLOYING CAPCUT PRODUCT BANNER ===")
    if os.path.exists(UPLOADED_BANNER):
        b_img = Image.open(UPLOADED_BANNER)
        if b_img.mode != 'RGB':
            b_img = b_img.convert('RGB')
        for path in BANNERS_TARGETS:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            b_img.save(path, format='PNG', optimize=True)
            print(f"  [SAVED BANNER] {path} ({os.path.getsize(path)} bytes)")
    else:
        print(f"  [WARNING] Uploaded banner not found at {UPLOADED_BANNER}")

if __name__ == "__main__":
    deploy_logo()
    deploy_banner()
    print("=== ALL IMAGES DEPLOYED SUCCESSFULLY ===")
