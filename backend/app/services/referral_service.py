import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from sqlalchemy import text
from app.core.database import SessionLocal, Base, engine
from app.models.referral_session import ReferralSession
from app.models.partner import SalesPartner


class ReferralService:
    _table_ensured: bool = False

    @classmethod
    def ensure_table(cls):
        """Ensures referral_sessions table exists in the database and adds columns if necessary."""
        if cls._table_ensured:
            return
        try:
            if engine is not None:
                Base.metadata.create_all(bind=engine, tables=[ReferralSession.__table__])
                try:
                    with engine.connect() as conn:
                        conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_session_id VARCHAR;"))
                        conn.commit()
                except Exception:
                    pass
                cls._table_ensured = True
        except Exception as e:
            print(f"[ReferralService] DB table verification note: {e}")

    @staticmethod
    def compute_visitor_hash(client_ip: str, user_agent: str) -> str:
        """Generates a secure anonymous SHA-256 fingerprint from client IP and User-Agent."""
        raw = f"{client_ip.strip()}:{user_agent.strip()}"
        if not raw or raw == ":":
            return ""
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    @classmethod
    def track_click(
        cls,
        payload: Dict[str, Any],
        client_ip: str = "",
        user_agent: str = "",
    ) -> Dict[str, Any]:
        """
        Records a referral/campaign link click into referral_sessions.
        Updates SalesPartner total_clicks telemetry and calculates server-side TTL.
        """
        cls.ensure_table()
        ref_code = (
            payload.get("code")
            or payload.get("ref")
            or payload.get("ref_code")
            or ""
        ).strip().upper()

        campaign_id = (
            payload.get("campaign")
            or payload.get("campaign_id")
            or payload.get("utm_campaign")
            or ""
        ).strip()

        utm_source = (payload.get("utm_source") or "").strip() or None
        utm_medium = (payload.get("utm_medium") or "").strip() or None
        user_email = (payload.get("user_email") or payload.get("userEmail") or "").strip().lower() or None
        existing_session_id = (payload.get("session_id") or payload.get("sessionId") or "").strip() or None

        if not ref_code and not campaign_id:
            return {"success": False, "message": "Parameter referral code atau campaign tidak ditemukan"}

        now = datetime.utcnow()
        visitor_hash = cls.compute_visitor_hash(client_ip, user_agent)

        # 1. Determine Expiry Time (TTL)
        # Default referral TTL: 30 days
        expires_at = now + timedelta(days=30)

        # If campaign is active, verify campaign end date
        if campaign_id:
            try:
                from app.services.campaign_service import CampaignService
                campaign = CampaignService.get_campaign_by_slug_or_id(campaign_id)
                if campaign:
                    end_date_str = campaign.get("endDate") or campaign.get("end_date")
                    if end_date_str:
                        clean_end = str(end_date_str).replace("Z", "+00:00")
                        c_end_dt = datetime.fromisoformat(clean_end)
                        if c_end_dt.tzinfo is not None:
                            c_end_dt = c_end_dt.replace(tzinfo=None)
                        if c_end_dt > now:
                            expires_at = max(expires_at, c_end_dt)
            except Exception as e:
                print(f"[ReferralService] Campaign lookup note: {e}")

        # 2. Database Operations
        if SessionLocal is None:
            return {
                "success": True,
                "message": "Klik dicatat (mode database offline)",
                "data": {
                    "sessionId": f"temp_{uuid.uuid4().hex[:12]}",
                    "refCode": ref_code,
                    "campaignId": campaign_id,
                    "expiresAt": (expires_at.isoformat() + "Z"),
                },
            }

        db = SessionLocal()
        try:
            # Increment total_clicks on SalesPartner if ref_code matches
            if ref_code:
                partner = db.query(SalesPartner).filter(SalesPartner.code == ref_code).first()
                if partner:
                    partner.total_clicks = (partner.total_clicks or 0) + 1
                    partner.updated_at = now

            # Check if active session already exists for the given ID or recent visitor click
            session = None
            if existing_session_id:
                session = (
                    db.query(ReferralSession)
                    .filter(
                        ReferralSession.id == existing_session_id,
                        ReferralSession.status == "active",
                        ReferralSession.expires_at > now,
                    )
                    .first()
                )

            if not session and visitor_hash:
                one_hour_ago = now - timedelta(hours=1)
                session = (
                    db.query(ReferralSession)
                    .filter(
                        ReferralSession.visitor_hash == visitor_hash,
                        ReferralSession.ref_code == ref_code,
                        ReferralSession.status == "active",
                        ReferralSession.expires_at > now,
                        ReferralSession.created_at >= one_hour_ago,
                    )
                    .order_by(ReferralSession.created_at.desc())
                    .first()
                )

            if session:
                # Update attributes if needed
                if campaign_id and not session.campaign_id:
                    session.campaign_id = campaign_id
                if user_email and not session.user_email:
                    session.user_email = user_email
                if expires_at > session.expires_at:
                    session.expires_at = expires_at
                db.commit()
                db.refresh(session)
                return {
                    "success": True,
                    "message": "Sesi referral aktif diperbarui",
                    "data": session.to_dict(),
                }

            # Create new session
            new_id = f"ref_sess_{uuid.uuid4().hex[:16]}"
            session = ReferralSession(
                id=new_id,
                visitor_hash=visitor_hash or None,
                user_email=user_email,
                ref_code=ref_code,
                campaign_id=campaign_id or None,
                utm_source=utm_source,
                utm_medium=utm_medium,
                status="active",
                created_at=now,
                expires_at=expires_at,
            )
            db.add(session)
            db.commit()
            db.refresh(session)

            return {
                "success": True,
                "message": "Klik referral berhasil dicatat",
                "data": session.to_dict(),
            }
        except Exception as e:
            db.rollback()
            print(f"[ReferralService] Error recording track_click: {e}")
            return {
                "success": False,
                "message": f"Gagal mencatat klik referral: {str(e)}",
            }
        finally:
            db.close()

    @classmethod
    def claim_session(
        cls,
        order_id: str,
        ref_code: str,
        user_email: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> bool:
        """
        Marks an active referral session as 'claimed' upon successful checkout.
        """
        cls.ensure_table()
        if SessionLocal is None or (not ref_code and not session_id):
            return False

        now = datetime.utcnow()
        clean_ref = (ref_code or "").strip().upper()
        clean_email = (user_email or "").strip().lower() if user_email else None

        db = SessionLocal()
        try:
            session = None
            if session_id:
                session = (
                    db.query(ReferralSession)
                    .filter(
                        ReferralSession.id == session_id,
                        ReferralSession.status == "active",
                    )
                    .first()
                )

            if not session and clean_ref:
                query = db.query(ReferralSession).filter(
                    ReferralSession.ref_code == clean_ref,
                    ReferralSession.status == "active",
                    ReferralSession.expires_at > now,
                )
                if clean_email:
                    email_match = query.filter(ReferralSession.user_email == clean_email).order_by(ReferralSession.created_at.desc()).first()
                    if email_match:
                        session = email_match
                if not session:
                    session = query.order_by(ReferralSession.created_at.desc()).first()

            if session:
                session.status = "claimed"
                session.claimed_at = now
                session.claimed_order_id = order_id
                if clean_email and not session.user_email:
                    session.user_email = clean_email
                db.commit()
                print(f"[ReferralService] Session {session.id} successfully claimed for order {order_id}")
                return True

            return False
        except Exception as e:
            db.rollback()
            print(f"[ReferralService] Error claiming session: {e}")
            return False
        finally:
            db.close()

    @classmethod
    def auto_expire_sessions(cls) -> int:
        """
        Marks expired sessions where expires_at <= now as 'expired'.
        Returns total count of expired sessions.
        """
        cls.ensure_table()
        if SessionLocal is None:
            return 0

        now = datetime.utcnow()
        db = SessionLocal()
        try:
            expired_count = (
                db.query(ReferralSession)
                .filter(
                    ReferralSession.status == "active",
                    ReferralSession.expires_at <= now,
                )
                .update({"status": "expired"}, synchronize_session=False)
            )
            db.commit()
            return expired_count
        except Exception as e:
            db.rollback()
            print(f"[ReferralService] Error auto_expiring sessions: {e}")
            return 0
        finally:
            db.close()
