import urllib.request
import json
import io

def run_tests():
    print("=" * 60)
    print("RUNNING COMPREHENSIVE RECOVERY AUDIT SUITE")
    print("=" * 60)

    # 1. TEST UPLOAD BANNER PRODUCT
    boundary = "----TestBoundary123"
    parts = [
        f"--{boundary}",
        'Content-Disposition: form-data; name="file"; filename="sample-banner.png"',
        "Content-Type: image/png",
        "",
        "PNG_BINARY_CONTENT",
        f"--{boundary}--",
        ""
    ]
    payload = "\r\n".join(parts).encode("utf-8")
    req = urllib.request.Request("http://localhost:8000/api/v1/admin/upload", data=payload, headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    res = urllib.request.urlopen(req)
    upload_res = json.loads(res.read().decode("utf-8"))
    assert upload_res.get("success") == True, "Upload failed"
    assert "data" in upload_res and "viewUrl" in upload_res["data"], "Missing data.viewUrl in upload response"
    print("[PASS] 1. Upload Banner Product:", upload_res["data"]["viewUrl"])

    # 2. TEST CRUD PRODUCT
    # 2a. Create Product
    prod_payload = {
        "id": "audit-test-prod-001",
        "name": "Audit Test Premium Account",
        "category": {"id": "cat-ai-tools", "name": "AI Tools"},
        "price": 75000,
        "providerPrice": 50000,
        "stock": 25,
        "status": "active",
        "imageUrl": upload_res["data"]["viewUrl"],
        "description": "Automated audit test product",
    }
    req = urllib.request.Request("http://localhost:8000/api/v1/admin/products", data=json.dumps(prod_payload).encode("utf-8"), headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    created = json.loads(res.read().decode("utf-8"))
    assert created.get("success") == True, "Failed to create product"
    print("[PASS] 2a. Product Create:", created["data"]["id"])

    # 2b. Read Product (Storefront & Admin)
    req = urllib.request.Request("http://localhost:8000/api/v1/products/audit-test-prod-001")
    res = urllib.request.urlopen(req)
    read_prod = json.loads(res.read().decode("utf-8"))
    assert read_prod["data"]["name"] == "Audit Test Premium Account", "Failed to read product"
    print("[PASS] 2b. Product Read:", read_prod["data"]["name"])

    # 2c. Update Product
    update_payload = {"name": "Audit Test Premium Account Updated", "price": 80000}
    req = urllib.request.Request("http://localhost:8000/api/v1/admin/products/audit-test-prod-001", data=json.dumps(update_payload).encode("utf-8"), headers={"Content-Type": "application/json"}, method="PATCH")
    res = urllib.request.urlopen(req)
    updated = json.loads(res.read().decode("utf-8"))
    assert updated.get("success") == True, "Failed to update product"
    print("[PASS] 2c. Product Update:", updated["data"]["name"])

    # 2d. Toggle Status
    req = urllib.request.Request("http://localhost:8000/api/v1/admin/products/audit-test-prod-001/toggle-status", data=b"{}", headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    toggled = json.loads(res.read().decode("utf-8"))
    assert toggled.get("success") == True, "Failed to toggle status"
    print("[PASS] 2d. Product Toggle Status:", toggled["status"])

    # 2e. Delete Product
    req = urllib.request.Request("http://localhost:8000/api/v1/admin/products/audit-test-prod-001", method="DELETE")
    res = urllib.request.urlopen(req)
    deleted = json.loads(res.read().decode("utf-8"))
    assert deleted.get("success") == True, "Failed to delete product"
    print("[PASS] 2e. Product Delete:", deleted["message"])

    # 3. TEST IMPORT VIP PRODUCT
    # 3a. Search VIP Services
    req = urllib.request.Request("http://localhost:8000/api/v1/admin/vip-services?search=Canva&limit=5")
    res = urllib.request.urlopen(req)
    vip_search = json.loads(res.read().decode("utf-8"))
    assert vip_search.get("success") == True and len(vip_search.get("data", [])) > 0, "Failed to search VIP services"
    first_service = vip_search["data"][0]
    print("[PASS] 3a. VIP Explorer Search found:", first_service["name"], f"({first_service['code']})")

    # 3b. Import VIP Service
    import_payload = {
        "code": first_service["code"],
        "name": first_service["name"],
        "price": 25000,
        "providerPrice": first_service.get("price", 15000),
        "stock": 50,
        "categoryName": "Design & Kreatif",
        "description": "Layanan Canva import otomatis",
        "status": "active"
    }
    req = urllib.request.Request("http://localhost:8000/api/v1/admin/vip-services", data=json.dumps(import_payload).encode("utf-8"), headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    imported = json.loads(res.read().decode("utf-8"))
    assert imported.get("success") == True, "Failed to import VIP service"
    print("[PASS] 3b. VIP Service Imported:", imported["data"]["id"])

    # 4. TEST CHECKOUT FLOW
    # 4a. Validate Promo Voucher
    req = urllib.request.Request("http://localhost:8000/api/v1/promos/validate", data=json.dumps({"code": "GRANDOP26", "subtotal": 100000}).encode("utf-8"), headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    promo_res = json.loads(res.read().decode("utf-8"))
    assert promo_res.get("success") == True, "Promo code validation failed"
    print("[PASS] 4a. Promo Voucher Validated:", promo_res["data"]["code"], "Discount:", promo_res["data"]["discountAmount"])

    # 4b. Create Order
    order_payload = {
        "items": [
            {
                "product_id": imported["data"]["id"],
                "product_name": imported["data"]["name"],
                "unit_price": 25000,
                "quantity": 1,
                "purchased_details": {"target_email": "customer@audit.test"}
            }
        ],
        "payment_method": "manual_bca",
        "promo_code": "GRANDOP26",
        "referral_code": "ANDI10",
        "customer_contact": {
            "name": "Audit Customer",
            "email": "customer@audit.test",
            "phone": "081298765432"
        }
    }
    req = urllib.request.Request("http://localhost:8000/api/v1/orders", data=json.dumps(order_payload).encode("utf-8"), headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    order_res = json.loads(res.read().decode("utf-8"))
    assert order_res.get("success") == True, "Failed to create customer order"
    order_id = order_res["order"]["id"]
    print("[PASS] 4b. Order Created:", order_id, "Total:", order_res["order"]["totalAmount"])

    # 4c. Payment Instructions
    req = urllib.request.Request(f"http://localhost:8000/api/v1/orders/{order_id}/pay", data=json.dumps({"payment_method": "manual_bca"}).encode("utf-8"), headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    pay_res = json.loads(res.read().decode("utf-8"))
    assert pay_res.get("success") == True, "Failed to get payment instructions"
    print("[PASS] 4c. Payment Instructions Generated:", pay_res["payment"]["payment_method"])

    # 5. TEST SALES COMMISSION FLOW
    # 5a. Validate Referral Code
    req = urllib.request.Request("http://localhost:8000/api/v1/affiliate/validate-referral?code=AST-ACELINO-COOL")
    res = urllib.request.urlopen(req)
    ref_res = json.loads(res.read().decode("utf-8"))
    assert ref_res.get("valid") == True, "Referral code AST-ACELINO-COOL should be valid"
    print("[PASS] 5a. Referral Code Validated:", ref_res["data"]["partnerName"], f"({ref_res['data']['code']})")

    # 5b. Check Partner Orders & Ledger
    req = urllib.request.Request("http://localhost:8000/api/v1/admin/profit-distribution")
    res = urllib.request.urlopen(req)
    finance_res = json.loads(res.read().decode("utf-8"))
    assert finance_res.get("success") == True, "Failed to get profit distribution"
    print("[PASS] 5b. Finance Profit Waterfall Active:", "Total Profit Rp", finance_res["data"]["summary"]["totalTransactionProfit"])

    # 5c. Partner Payout Flow
    payout_payload = {"partnerId": "cmuxcxrbm0001kx04jk0guqdl", "amount": 100000, "bankAccount": "1234567890"}
    req = urllib.request.Request("http://localhost:8000/api/v1/sales/payout", data=json.dumps(payout_payload).encode("utf-8"), headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    payout_res = json.loads(res.read().decode("utf-8"))
    assert payout_res.get("success") == True, "Failed to submit payout request"
    print("[PASS] 5c. Sales Partner Payout Request Submitted:", payout_res["message"])

    print("=" * 60)
    print("ALL 5 CORE ARCHITECTURAL FLOWS VERIFIED SUCCESSFULLY (100% OPERATIONAL)")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
