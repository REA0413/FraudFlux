import pytest
from fastapi.testclient import TestClient
from main import app

# Create a test client using httpx under the hood
client = TestClient(app)

# --- Test 1: ML Charge Evaluation Route ---
def test_evaluate_transaction_success():
    payload = {
        "transaction_id": "test_tx_001",
        "merchant_id": "677995a6-1e94-440d-9d27-79ae5d7d0e88",
        "amount": 150.00,
        "currency": "EUR",
        "issuer_country": "US",
        "billing_country": "US",
        "user_id": "test_user_123"
    }

    response = client.post("/v1/charge/evaluate", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "risk_score" in data
    assert data["decision"] in ["APPROVE", "DECLINE"]
    assert "threshold_applied" in data

# --- Test 2: Threshold Update (Valid Range 1-99) ---
def test_update_merchant_threshold_valid():
    payload = {
        "merchant_id": "677995a6-1e94-440d-9d27-79ae5d7d0e88",
        "auto_decline_threshold": 90
    }

    response = client.put("/v1/settings/thresholds", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["auto_decline_threshold"] == 90

# --- Test 3: Threshold Update (Invalid Boundary Validation) ---
def test_update_merchant_threshold_invalid_out_of_bounds():
    payload = {
        "merchant_id": "677995a6-1e94-440d-9d27-79ae5d7d0e88",
        "auto_decline_threshold": 150  # Out of range (>99)
    }

    response = client.put("/v1/settings/thresholds", json=payload)
    
    # Expect 422 Unprocessable Entity due to Pydantic field validation
    assert response.status_code == 422

# --- Test 4: CSV Export Streaming Endpoint ---
def test_export_transactions_csv():
    merchant_id = "677995a6-1e94-440d-9d27-79ae5d7d0e88"
    
    response = client.get(f"/v1/transactions/export?merchant_id={merchant_id}&days=30")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment; filename=" in response.headers["content-disposition"]
    
    # Check that CSV headers are present in response text
    content = response.text
    assert "transaction_id" in content
    assert "risk_score" in content
    assert "decision" in content