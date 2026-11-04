import argparse
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

PROD_DB_URL = "postgresql://postgres.kszyhgyddstbdooxsnuo:gWh4ph3ASw49BZRm@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
STAGING_DB_URL = "postgresql://postgres.dtksnmjlgumpzrtvvxas:hOcuOBmRdytexlFE@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Tables to synchronize in dependency order
# Format: (table_name, primary_key_column)
SYNC_TABLES = [
    ("categories", "id"),
    ("product_cards", "id"),
    ("products", "id"),
    ("product_attributes", "id"),
    ("homepage_product_sections", "section_key"),
    ("promo_banners", "id"),
    ("promo_codes", "id"),
    ("promo_campaigns", "id"),
    ("store_operating_hours", "id"),
    ("payment_settings", "id"),
    ("order_processing_settings", "id"),
    ("reseller_api_settings", "id"),
]

EXCLUDED_TABLES = [
    # Orders & Transaction data (Strictly untouched)
    "orders",
    "order_items",
    "order_logs",
    "referral_discount_usages",
    "promo_usages",
    # Sales, Partner & Financial ledger data (Strictly untouched)
    "sales_partners",
    "commissions",
    "profit_ledgers",
    "payout_requests",
    "referral_sessions",
    # User auth & sessions (Strictly untouched to preserve staging test identities)
    "user",
    "account",
    "session",
    "verification",
    "admin_users",
]


def sync_data(dry_run: bool = True):
    print("=" * 70)
    print(" ASTERRA STORE: PRODUCTION -> STAGING DATA SYNCHRONIZATION")
    print("=" * 70)
    print(f"Mode: {'[DRY RUN - No changes applied]' if dry_run else '[LIVE EXECUTION]'}")
    print("Policy: Exclude Orders, Sales, Financials, and User Authentication.")
    print()

    print("Connecting to Production Database (Source: kszyhgyddstbdooxsnuo)...")
    conn_prod = psycopg2.connect(PROD_DB_URL, connect_timeout=15)
    cur_prod = conn_prod.cursor(cursor_factory=RealDictCursor)

    print("Connecting to Staging Database (Destination: dtksnmjlgumpzrtvvxas)...")
    conn_staging = psycopg2.connect(STAGING_DB_URL, connect_timeout=15)
    conn_staging.autocommit = False
    cur_staging = conn_staging.cursor(cursor_factory=RealDictCursor)

    try:
        print("\nStarting table synchronization:")
        print("-" * 70)

        synced_prod_product_ids = []
        synced_prod_card_ids = []

        for table_name, pk_col in SYNC_TABLES:
            # 1. Fetch all rows from Production
            cur_prod.execute(f'SELECT * FROM "{table_name}"')
            prod_rows = cur_prod.fetchall()
            if not prod_rows:
                print(f"  • {table_name:<28}: 0 rows in production, skipped.")
                continue

            if table_name == "products":
                synced_prod_product_ids = [r["id"] for r in prod_rows]
            elif table_name == "product_cards":
                synced_prod_card_ids = [r["id"] for r in prod_rows]

            # 2. Fetch existing primary keys in Staging
            cur_staging.execute(f'SELECT "{pk_col}" FROM "{table_name}"')
            staging_keys = set(row[pk_col] for row in cur_staging.fetchall())

            # 3. Determine insert vs update counts
            cols = list(prod_rows[0].keys())
            cols_str = ", ".join([f'"{c}"' for c in cols])
            vals_placeholder = ", ".join(["%s"] * len(cols))

            update_assignments = ", ".join([
                f'"{c}" = EXCLUDED."{c}"' for c in cols if c != pk_col
            ])

            upsert_query = f"""
                INSERT INTO "{table_name}" ({cols_str})
                VALUES ({vals_placeholder})
                ON CONFLICT ("{pk_col}") DO UPDATE
                SET {update_assignments};
            """

            inserted = 0
            updated = 0
            for row in prod_rows:
                pk_val = row[pk_col]
                if pk_val in staging_keys:
                    updated += 1
                else:
                    inserted += 1

                if not dry_run:
                    values = [row[c] for c in cols]
                    cur_staging.execute(upsert_query, values)

            action_desc = f"+{inserted} new, ~{updated} updated"
            print(f"  ✓ {table_name:<28}: {len(prod_rows):<3} rows from Prod ({action_desc})")

        # Post-sync cleanups
        if not dry_run:
            print("\nApplying post-sync catalog cleanups in Staging...")

            # 1. Clean up legacy payment settings duplicate row in Staging
            cur_staging.execute("DELETE FROM payment_settings WHERE id = 'pay-cfg-default';")
            print("  ✓ Removed legacy dummy payment config ('pay-cfg-default') from Staging.")

            # 2. Archive products in Staging that are not part of Production catalog
            if synced_prod_product_ids:
                cur_staging.execute(
                    """
                    UPDATE products 
                    SET status = 'archived' 
                    WHERE id NOT IN %s AND status != 'archived';
                    """,
                    (tuple(synced_prod_product_ids),),
                )
                print(f"  ✓ Archived obsolete staging-only products: {cur_staging.rowcount} rows.")

            # 3. Archive product_cards in Staging that are not in Production
            if synced_prod_card_ids:
                cur_staging.execute(
                    """
                    UPDATE product_cards 
                    SET status = 'archived' 
                    WHERE id NOT IN %s AND status != 'archived';
                    """,
                    (tuple(synced_prod_card_ids),),
                )
                print(f"  ✓ Archived obsolete staging-only product cards: {cur_staging.rowcount} rows.")

        if dry_run:
            print("-" * 70)
            print("\n[DRY RUN FINISHED] No changes were written to the Staging Database.")
            conn_staging.rollback()
        else:
            print("-" * 70)
            print("\nCommitting changes to Staging Database...")
            conn_staging.commit()
            print("✓ SUCCESS: Staging Database is now fully synchronized with Production catalog & configs!")

    except Exception as exc:
        conn_staging.rollback()
        print(f"\n[ERROR] Synchronization failed: {exc}", file=sys.stderr)
        raise
    finally:
        cur_prod.close()
        conn_prod.close()
        cur_staging.close()
        conn_staging.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync catalog & config data from Prod to Staging")
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Apply changes to Staging DB (defaults to dry-run)",
    )
    args = parser.parse_args()

    sync_data(dry_run=not args.execute)
