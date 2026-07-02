from fastapi import FastAPI
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

app = FastAPI(title="FraudFlux API", version="1.0")

# 1. The Advanced Pydantic Schema (The strict bouncer)
class TransactionPayload(BaseModel):
    transaction_id: str
    timestamp: str
    
    # Financial Data
    amount: float = Field(..., gt=0, description="Transaction amount must be greater than 0")
    currency: str
    
    # Card Intelligence (Your suggestions!)
    card_bin: str = Field(..., min_length=6, max_length=8, description="Bank Identification Number")
    issuer_bank_name: str
    issuer_country: str
    
    # User / Merchant Context
    merchant_category: str
    customer_email: EmailStr  # Pydantic will automatically verify it has an @ symbol!
    
    # Behavioral / Geo Data
    billing_country: str
    ip_address: Optional[str] = None
    distance_from_home_km: Optional[float] = None

@app.get("/")
def read_root():
    return {"status": "success", "message": "Welcome to the FraudFlux API Engine"}

@app.post("/api/v1/evaluate")
def evaluate_transaction(payload: TransactionPayload):
    
    # Example Logic: Basic rule-based check before AI
    if payload.issuer_country != payload.billing_country:
        base_risk = 0.50
    else:
        base_risk = 0.10
        
    return {
        "message": "Payload parsed successfully",
        "transaction_id": payload.transaction_id,
        "amount": payload.amount,
        "risk_score": base_risk,
        "decision": "FLAGGED_FOR_REVIEW" if base_risk > 0.4 else "APPROVED"
    }