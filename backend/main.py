import os
import io
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks
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
    customer_email: Optional[str] = None
    card_bin: Optional[str] = None
    issuer_bank_name: Optional[str] = None
    timestamp: Optional[str] = None
    zip: Optional[int] = 90210            # Added optional ZIP Code
    city_pop: Optional[int] = 50000        # Added optional City Population

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

# Helper function to save transaction records in the background
def save_transaction_log(db_record: dict):
    try:
        supabase.table("transactions").insert(db_record).execute()
    except Exception as e:
        print(f"Database error on background insert: {str(e)}")


@app.post("/api/v1/charge/evaluate")
async def evaluate_transaction(payload: TransactionPayload, background_tasks: BackgroundTasks):
    # 1. Fetch Dynamic Auto-Decline Threshold from 'merchants' table
    threshold = 85  # Fallback default
    try:
        res = supabase.table("merchants").select("auto_decline_threshold").eq("id", payload.merchant_id).execute()
        if res.data and len(res.data) > 0:
            threshold = res.data[0]["auto_decline_threshold"]
    except Exception as e:
        print(f"Warning: Could not fetch threshold, using default 85. Error: {e}")

    # 2. Hybrid Risk Computation (XGBoost ML Score + Contextual Heuristics)
    try:
        # Feed actual/passed numerical features directly into XGBoost
        input_df = pd.DataFrame([{
            "amt": payload.amount,
            "city_pop": payload.city_pop if payload.city_pop is not None else 50000,
            "zip": payload.zip if payload.zip is not None else 90210
        }])
        
        # Pure ML Model Probability (e.g. 0.08)
        ml_probability = float(model.predict_proba(input_df)[0][1])

        # Heuristic Risk Adjustments based on checkout context
        risk_modifier = 0.0

        # Factor A: Billing / Issuer Geo-Mismatch (+25%)
        if payload.issuer_country != payload.billing_country:
            risk_modifier += 0.25

        # Factor B: High-Risk / Disposable Email Domain (+20%)
        disposable_domains = ['temp-mail.org', 'mailinator.com', 'throwaway.net', 'bot']
        if payload.customer_email and any(d in payload.customer_email.lower() for d in disposable_domains):
            risk_modifier += 0.20

        # Factor C: High-Risk Issuer Country (+15%)
        high_risk_countries = ['NG', 'RU', 'KP', 'IR']
        if payload.issuer_country in high_risk_countries:
            risk_modifier += 0.15

        # Combine ML base score with contextual heuristic modifiers
        combined_score = ml_probability + risk_modifier
        base_risk = round(min(max(combined_score, 0.02), 0.98), 4)

    except Exception as e:
        print(f"Warning: Model inference error ({e}). Using rule-based fallback.")
        base_risk = 0.88 if payload.issuer_country != payload.billing_country else 0.15

    # 3. Decision Logic against Dynamic Threshold
    decision = "DECLINE" if (base_risk * 100) >= threshold else "APPROVE"

    # 4. Schedule Asynchronous Database Write in Background
    db_record = payload.model_dump()
    db_record["risk_score"] = base_risk
    db_record["decision"] = decision
    db_record["threshold_applied"] = threshold
    
    background_tasks.add_task(save_transaction_log, db_record)

    # 5. Return Evaluation Response Immediately
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
        response = supabase.table("transactions").select("*").execute()
        return response.data
    except Exception as e:
        return {"error": f"Failed to fetch from database: {str(e)}"}

# 4. Update Merchant Threshold
@app.put("/api/v1/settings/thresholds")
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
@app.get("/api/v1/settings/thresholds/{merchant_id}")
async def get_merchant_threshold(merchant_id: str):
    try:
        response = supabase.table("merchants").select("auto_decline_threshold").eq("id", merchant_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Merchant not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 6. CSV Export Endpoint
@app.get("/api/v1/transactions/export")
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