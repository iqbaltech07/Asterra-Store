import argparse
import os
import sys
from pathlib import Path
from urllib.parse import urlparse
import psycopg2
from psycopg2.extras import RealDictCursor

try:
    from dotenv import dotenv_values
except ImportError:
    dotenv_values = None


def mask_db_url(url: str) -> str:
    """Masks database credentials for safe logging."""
    try:
        parsed = urlparse(url)
        netloc_parts = parsed.netloc.split("@")
        if len(netloc_parts) == 2:
            return f"{parsed.scheme}://***:***@{netloc_parts[1]}{parsed.path}"
        return f"{parsed.scheme}://***{parsed.path}"
    except Exception:
        return "[DATABASE_URL_CONFIGURED]"


def resolve_database_urls(
    cli_prod_url: str | None = None,
    cli_staging_url: str | None = None,
) -> tuple[str, str]:
    """Resolves production and staging database URLs from CLI args, environment variables,
    or uncommitted local .env files. Never hardcodes credentials.
    """
    prod_url = (
        cli_prod_url
        or os.getenv("PROD_DATABASE_URL")
        or os.getenv("PROD_DB_URL")
    )
    staging_url = (
        cli_staging_url
        or os.getenv("STAGING_DATABASE_URL")
        or os.getenv("STAGING_DB_URL")
        or os.getenv("DATABASE_URL")
    )

    # Search local uncommitted env files if not yet resolved
    if dotenv_values and (not prod_url or not staging_url):
        base_dir = Path(__file__).resolve().parent.parent

        if not prod_url:
            prod_env_file = base_dir / ".env.production"
            if prod_env_file.exists():
                vals = dotenv_values(str(prod_env_file))
                prod_url = vals.get("DATABASE_URL") or vals.get("PROD_DATABASE_URL")

        if not staging_url:
            for env_candidate in [base_dir / ".env.development", base_dir / ".env"]:
                if env_candidate.exists():
                    vals = dotenv_values(str(env_candidate))
                    staging_url = vals.get("DATABASE_URL") or vals.get("STAGING_DATABASE_URL")
                    if staging_url:
                        break

    if not prod_url:
        raise ValueError(
            "Production Database URL not provided. Please set PROD_DATABASE_URL in environment or pass --prod-url."
        )
    if not staging_url:
        raise ValueError(
            "Staging Database URL not provided. Please set STAGING_DATABASE_URL in environment or pass --staging-url."
        )

    return prod_url.strip(), staging_url.strip()


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


def sync_data(prod_url: str, staging_url: str, dry_run: bool = True):
    print("=" * 70)
    print(" ASTERRA STORE: PRODUCTION -> STAGING DATA SYNCHRONIZATION")
    print("=" * 70)
    print(f"Mode: {'[DRY RUN - No changes applied]' if dry_run else '[LIVE EXECUTION]'}")
    print("Policy: Exclude Orders, Sales, Financials, and User Authentication.")
    print()

    print(f"Connecting to Production Database: {mask_db_url(prod_url)}...")
    conn_prod = psycopg2.connect(prod_url, connect_timeout=15)
    cur_prod = conn_prod.cursor(cursor_factory=RealDictCursor)

    print(f"Connecting to Staging Database: {mask_db_url(staging_url)}...")
    conn_staging = psycopg2.connect(staging_url, connect_timeout=15)
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
    parser.add_argument(
        "--prod-url",
        default=None,
        help="Production PostgreSQL connection URI (or via PROD_DATABASE_URL env)",
    )
    parser.add_argument(
        "--staging-url",
        default=None,
        help="Staging PostgreSQL connection URI (or via STAGING_DATABASE_URL env)",
    )
    args = parser.parse_args()

    try:
        resolved_prod_url, resolved_staging_url = resolve_database_urls(
            cli_prod_url=args.prod_url,
            cli_staging_url=args.staging_url,
        )
        sync_data(
            prod_url=resolved_prod_url,
            staging_url=resolved_staging_url,
            dry_run=not args.execute,
        )
    except Exception as e:
        print(f"[CONFIGURATION ERROR] {e}", file=sys.stderr)
        sys.exit(1)
