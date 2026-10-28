import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.password_reset_service import PasswordResetService
from app.services.admin_user_service import AdminUserService
from app.services.partner_service import PartnerService
from app.core.security import verify_password


class TestPasswordResetFlow(unittest.TestCase):
    @classmethod
    def tearDownClass(cls):
        # Guarantee real accounts always have their standard passwords restored
        try:
            AdminUserService.update_admin("admin@asterra.store", {"password": "AsterraAdmin#2026"})
            AdminUserService.update_admin("marchelinokurniawan321@gmail.com", {"password": "AsterraSales#2026"})
        except Exception:
            pass

    def test_01_password_reset_link_admin_flow(self):
        admin_email = "admin@asterra.store"
        PasswordResetService._email_rate_limits.pop(f"admin:{admin_email}", None)
        try:
            res = PasswordResetService.request_reset_link(email=admin_email, portal="admin")
            self.assertTrue(res["success"])
            self.assertIn("instruksi untuk mengatur ulang kata sandi", res["message"])

            tokens = PasswordResetService._load_token_store()
            token_entry = next((t for t in tokens.values() if t.get("email") == admin_email and t.get("portal") == "admin"), None)
            self.assertIsNotNone(token_entry)
            token = token_entry["token"]

            # Verify token with matching portal
            verify_res = PasswordResetService.verify_reset_token(token=token, portal="admin")
            self.assertTrue(verify_res["success"])
            self.assertTrue(verify_res["valid"])
            self.assertIn("maskedEmail", verify_res)

            # Cross-portal separation: admin token must FAIL on sales portal
            cross_res = PasswordResetService.verify_reset_token(token=token, portal="sales")
            self.assertFalse(cross_res["valid"])

            # Reset password with new value
            new_pw = "NewAdminSecure#2026!"
            reset_res = PasswordResetService.reset_password_with_token(token=token, portal="admin", new_password=new_pw)
            self.assertTrue(reset_res["success"])

            # Verify database password was updated
            admin = AdminUserService.find_by_email(admin_email)
            self.assertIsNotNone(admin)
            self.assertTrue(verify_password(new_pw, admin["passwordHash"]))

            # Verify single-use token: reuse must fail
            reuse_res = PasswordResetService.reset_password_with_token(token=token, portal="admin", new_password="AnotherPassword#2026")
            self.assertFalse(reuse_res.get("success", False))
        finally:
            # Restore root admin password
            AdminUserService.update_admin(admin_email, {"password": "AsterraAdmin#2026"})

    def test_02_password_reset_anti_enumeration(self):
        # Non-existent email returns same generic success message
        res = PasswordResetService.request_reset_link(email="nonexistent.user.random999@asterra.store", portal="admin")
        self.assertTrue(res["success"])
        self.assertIn("instruksi untuk mengatur ulang kata sandi", res["message"])

    def test_03_password_reset_sales_flow(self):
        # Find or create a sales partner
        partner = PartnerService.find_by_email("marchelinokurniawan321@gmail.com")
        if not partner:
            partners = PartnerService.load_partners()
            partner = partners[0] if partners else None
        self.assertIsNotNone(partner)
        sales_email = partner["email"].lower()

        PasswordResetService._email_rate_limits.pop(f"sales:{sales_email}", None)
        try:
            res = PasswordResetService.request_reset_link(email=sales_email, portal="sales")
            self.assertTrue(res["success"])

            tokens = PasswordResetService._load_token_store()
            token_entry = next((t for t in tokens.values() if t.get("email") == sales_email and t.get("portal") == "sales"), None)
            self.assertIsNotNone(token_entry)
            token = token_entry["token"]

            # Token must be valid for sales portal
            verify_sales = PasswordResetService.verify_reset_token(token=token, portal="sales")
            self.assertTrue(verify_sales["valid"])

            # Token must FAIL on admin portal
            verify_admin = PasswordResetService.verify_reset_token(token=token, portal="admin")
            self.assertFalse(verify_admin["valid"])

            # Reset sales password
            new_sales_pw = "SalesNewPass#2026!"
            reset_res = PasswordResetService.reset_password_with_token(token=token, portal="sales", new_password=new_sales_pw)
            self.assertTrue(reset_res["success"])

            # Verify updated in AdminUserService
            sales_admin = AdminUserService.find_by_email(sales_email)
            self.assertIsNotNone(sales_admin)
            self.assertTrue(verify_password(new_sales_pw, sales_admin["passwordHash"]))
        finally:
            # Restore sales default password
            AdminUserService.update_admin(sales_email, {"password": "AsterraSales#2026"})

    def test_04_password_reset_sales_portal_separation(self):
        # Admin email requested on sales portal must NOT create a sales token
        admin_email = "admin@asterra.store"
        PasswordResetService._email_rate_limits.pop(f"sales:{admin_email}", None)
        res = PasswordResetService.request_reset_link(email=admin_email, portal="sales")
        self.assertTrue(res["success"])
        tokens = PasswordResetService._load_token_store()
        sales_tokens = [t for t in tokens.values() if t.get("email") == admin_email and t.get("portal") == "sales"]
        self.assertEqual(len(sales_tokens), 0)


if __name__ == "__main__":
    unittest.main()
