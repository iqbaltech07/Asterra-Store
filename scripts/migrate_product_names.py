import os
import sys
import json
import argparse
from datetime import datetime
import psycopg2
from dotenv import load_dotenv

# Ensure scratch path is available for import
SCRATCH_DIR = os.path.join(os.path.dirname(__file__), '..', 'scratch')
sys.path.insert(0, SCRATCH_DIR)
from build_normalization_mapping import build_mapping

def run_migration(dry_run=True):
    load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))
    db_url = os.getenv('DIRECT_URL') or os.getenv('DATABASE_URL')
    if not db_url:
        print("[ERROR] No DATABASE_URL or DIRECT_URL found in backend/.env")
        sys.exit(1)

    print(f"=== ASTERRA STORE: PRODUCT NAME NORMALIZATION MIGRATION ===")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    print(f"Mode: {'DRY RUN (no database changes)' if dry_run else 'LIVE EXECUTION'}")

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # 1. Fetch current database state
    cur.execute('''
        SELECT id, name, category_id, category_name, brand, price, price_formatted,
               description, features, status, stock, image_url, popular, provider,
               provider_code, provider_name, provider_price, provider_status,
               profit_margin, profit_percentage, guarantee_title, guarantee_desc,
               process_title, process_desc, privacy_title, privacy_desc,
               created_at, updated_at
        FROM products ORDER BY id
    ''')
    columns = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    pre_products = [dict(zip(columns, r)) for r in rows]
    total_db = len(pre_products)
    print(f"Total products in DB before migration: {total_db}")

    # Save backup before any changes
    backup_path = os.path.join(SCRATCH_DIR, 'products_pre_migration_backup.json')
    # Convert datetime objects to string for JSON serialization
    serializable_backup = []
    for p in pre_products:
        item = dict(p)
        if isinstance(item.get('created_at'), datetime):
            item['created_at'] = item['created_at'].isoformat()
        if isinstance(item.get('updated_at'), datetime):
            item['updated_at'] = item['updated_at'].isoformat()
        serializable_backup.append(item)
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(serializable_backup, f, indent=2, ensure_ascii=False)
    print(f"Saved complete backup to {backup_path}")

    # 2. Load mapping
    mapping, exceptions = build_mapping()
    print(f"Total mappings to apply: {len(mapping)}")
    print(f"Total exceptions noted: {len(exceptions)}")

    # 3. Apply updates
    updated_records = []
    skipped_records = []

    for p in pre_products:
        pid = p['id']
        old_name = p['name']
        if pid in mapping:
            new_name, reason = mapping[pid]
            if old_name != new_name:
                cur.execute('''
                    UPDATE products
                    SET name = %s, updated_at = NOW()
                    WHERE id = %s
                ''', (new_name, pid))
                updated_records.append({
                    'id': pid,
                    'sku': p['provider_code'],
                    'old_name': old_name,
                    'new_name': new_name,
                    'reason': reason,
                    'status': p['status']
                })
            else:
                skipped_records.append(pid)
        else:
            skipped_records.append(pid)

    print(f"Updated records count in transaction: {len(updated_records)}")
    print(f"Unchanged records count: {len(skipped_records)}")

    # 4. Post-update verification within transaction
    cur.execute('''
        SELECT id, name, category_id, category_name, brand, price, price_formatted,
               description, features, status, stock, image_url, popular, provider,
               provider_code, provider_name, provider_price, provider_status,
               profit_margin, profit_percentage, guarantee_title, guarantee_desc,
               process_title, process_desc, privacy_title, privacy_desc,
               created_at, updated_at
        FROM products ORDER BY id
    ''')
    post_rows = cur.fetchall()
    post_products = [dict(zip(columns, r)) for r in post_rows]

    # Verify no accidental column changes
    errors = []
    for pre, post in zip(pre_products, post_products):
        if pre['id'] != post['id']:
            errors.append(f"Product ID mismatch: {pre['id']} vs {post['id']}")
        # Compare every column except name and updated_at
        for col in columns:
            if col not in ['name', 'updated_at']:
                if pre[col] != post[col]:
                    errors.append(f"Accidental column change in {pre['id']} for column '{col}': {pre[col]} -> {post[col]}")

    if errors:
        print("[CRITICAL ERROR] Integrity check failed:")
        for err in errors[:10]:
            print("  ", err)
        conn.rollback()
        conn.close()
        sys.exit(1)

    print("[SUCCESS] Integrity check PASSED: No non-name attributes were altered!")

    # 5. Commit or Rollback
    if dry_run:
        conn.rollback()
        print("\n[DRY RUN COMPLETE] Transaction rolled back safely. Database unchanged.")
    else:
        conn.commit()
        print("\n[LIVE EXECUTION COMPLETE] Transaction committed successfully to database!")
        conn.close()

        # 6. Synchronize JSON caches
        print("\n=== STEP 6: SYNCHRONIZING OFFLINE/FALLBACK JSON CACHES ===")
        import subprocess
        sync_script = os.path.join(os.path.dirname(__file__), 'sync-supabase-to-json.js')
        res = subprocess.run(['node', sync_script], capture_output=True, text=True, cwd=os.path.join(os.path.dirname(__file__), '..'))
        print(res.stdout)
        if res.stderr:
            print("[SYNC STDERR]:", res.stderr)
        return {
            'total_db': total_db,
            'updated_count': len(updated_records),
            'unchanged_count': len(skipped_records),
            'updated_records': updated_records,
            'dry_run': dry_run,
        }

    conn.close()


    # Return migration summary
    return {
        'total_db': total_db,
        'updated_count': len(updated_records),
        'unchanged_count': len(skipped_records),
        'updated_records': updated_records,
        'dry_run': dry_run,
    }

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Asterra Store Product Name Normalization Migration")
    parser.add_argument('--live', action='store_true', help="Execute live migration (default is dry-run)")
    args = parser.parse_args()

    run_migration(dry_run=not args.live)
