import os
import io
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from supabase import create_client, Client
import joblib
import pandas as pd

# --- SUPABASE SETUP ---
load_dotenv()
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_URL = "https://ofdwlagawlawrfqbgbbq.supabase.co"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- FASTAPI APP SETUP ---
app = FastAPI(title="FraudFlux API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI MODEL SETUP ---
model = joblib.load("xgboost_fraud_model.joblib")


# --- PYDANTIC SCHEMAS ---
class TransactionPayload(BaseModel):
    transaction_id: str
    merchant_id: str
    amount: float
    currency: str = "EUR"
    issuer_country: str
    billing_country: str
    user_id: Optional[str] = None

class Transaction(BaseModel):
    amt: float
    city_pop: int
    zip: int

class ThresholdUpdateSchema(BaseModel):
    merchant_id: str
    auto_decline_threshold: int = Field(
        ..., 
        ge=1, 
        le=99, 
        description="Threshold percentage between 1 and 99"
    )


# --- ENDPOINTS ---

# 1. Charge Evaluation with ML Model & Dynamic Threshold (Req 5)
@app.post("/v1/charge/evaluate")
async def evaluate_transaction(payload: TransactionPayload):
    # Fetch Dynamic Auto-Decline Threshold from 'merchants' table
    threshold = 85
    try:
        res = supabase.table("merchants").select("auto_decline_threshold").eq("id", payload.merchant_id).execute()
        if res.data and len(res.data) > 0:
            threshold = res.data[0]["auto_decline_threshold"]
    except Exception as e:
        print(f"Warning: Could not fetch threshold, using default 85. Error: {e}")

    # Compute Risk Score with XGBoost Model
    try:
        feature_dict = {
            "amount": payload.amount,
            "issuer_country": payload.issuer_country,
            "billing_country": payload.billing_country,
        }
        input_df = pd.DataFrame([feature_dict])
        fraud_probability = model.predict_proba(input_df)[0][1]
        base_risk = round(float(fraud_probability * 100), 2)
    except Exception as e:
        print(f"Warning: ML model inference failed ({e}). Using rule-based fallback.")
        base_risk = 88.0 if payload.issuer_country != payload.billing_country else 15.0

    # Decision Logic
    decision = "DECLINE" if base_risk >= threshold else "APPROVE"

    # Save to Supabase 'transactions'
    db_record = payload.model_dump()
    db_record["risk_score"] = base_risk
    db_record["decision"] = decision

    try:
        supabase.table("transactions").insert(db_record).execute()
    except Exception as e:
        print(f"Database error on transaction insert: {str(e)}")

    return {
        "status": "success",
        "transaction_id": payload.transaction_id,
        "merchant_id": payload.merchant_id,
        "risk_score": base_risk,
        "threshold_applied": threshold,
        "decision": decision
    }

# 2. Legacy Predict Route
@app.post("/predict")
def predict_fraud(transaction: Transaction):
    data = pd.DataFrame([transaction.model_dump()])
    prediction = model.predict(data)
    return {"is_fraud": int(prediction[0])}

# 3. Get Transactions List
@app.get("/api/v1/transactions")
def get_transactions():
    try:
        response = supabase.table("transactions").select("*").limit(50).execute()
        return response.data
    except Exception as e:
        return {"error": f"Failed to fetch from database: {str(e)}"}

# 4. Update Merchant Threshold (Req 5)
@app.put("/v1/settings/thresholds")
async def update_merchant_threshold(payload: ThresholdUpdateSchema):
    try:
        response = supabase.table("merchants").update({
            "auto_decline_threshold": payload.auto_decline_threshold
        }).eq("id", payload.merchant_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Merchant profile not found")

        return {
            "status": "success",
            "message": "Fraud risk threshold updated successfully",
            "merchant_id": payload.merchant_id,
            "auto_decline_threshold": payload.auto_decline_threshold
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 5. Fetch Merchant Threshold
@app.get("/v1/settings/thresholds/{merchant_id}")
async def get_merchant_threshold(merchant_id: str):
    try:
        response = supabase.table("merchants").select("auto_decline_threshold").eq("id", merchant_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Merchant not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 6. CSV Export Endpoint (Req 6)
@app.get("/v1/transactions/export")
async def export_transactions_csv(merchant_id: str, days: int = 30):
    try:
        cutoff_time = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

        res = (
            supabase.table("transactions")
            .select("*")
            .eq("merchant_id", merchant_id)
            .gte("created_at", cutoff_time)
            .order("created_at", desc=True)
            .execute()
        )

        transactions = res.data or []

        if not transactions:
            df = pd.DataFrame(columns=[
                "transaction_id", "merchant_id", "amount", "currency", 
                "issuer_country", "billing_country", "risk_score", "decision", "created_at"
            ])
        else:
            df = pd.DataFrame(transactions)

        stream = io.StringIO()
        df.to_csv(stream, index=False)
        stream.seek(0)

        filename = f"fraudflux_report_{days}d.csv"
        return StreamingResponse(
            iter([stream.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV export: {str(e)}")