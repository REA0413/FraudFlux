import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from supabase import create_client, Client
import joblib
import pandas as pd

# --- SUPABASE SETUP ---
# Load the hidden variables from the .env file
load_dotenv()

# Fetch the key securely
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_URL = "https://ofdwlagawlawrfqbgbbq.supabase.co"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Declare the app exactly ONE time
app = FastAPI(title="FraudFlux API", version="1.0")

# --- CORS CONFIGURATION ---
# This allows your React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (good for local development)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# --- AI MODEL SETUP ---
# Load the AI Model into memory when the server starts
model = joblib.load("xgboost_fraud_model.joblib")


# --- SCHEMAS (What data we expect) ---
class TransactionPayload(BaseModel):
    transaction_id: str
    timestamp: str
    amount: float = Field(..., gt=0)
    currency: str
    card_bin: str = Field(..., min_length=6, max_length=8)
    issuer_bank_name: str
    issuer_country: str
    merchant_category: str
    customer_email: EmailStr
    billing_country: str
    ip_address: Optional[str] = None
    distance_from_home_km: Optional[float] = None

class Transaction(BaseModel):
    amt: float
    city_pop: int
    zip: int

# --- Pydantic Schema for Req 5 ---
class ThresholdUpdateSchema(BaseModel):
    merchant_id: str
    auto_decline_threshold: int = Field(
        ..., 
        ge=1, 
        le=99, 
        description="Threshold percentage between 1 and 99"
    )


# --- ENDPOINTS ---

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from supabase import create_client, Client

# --- Pydantic Schema for Inbound Transactions ---
class TransactionPayload(BaseModel):
    transaction_id: str
    merchant_id: str
    amount: float
    currency: str = "EUR"
    issuer_country: str
    billing_country: str
    user_id: Optional[str] = None

@app.post("/v1/charge/evaluate")
async def evaluate_transaction(payload: TransactionPayload):
    # 1. Fetch Dynamic Auto-Decline Threshold from 'merchants' table
    threshold = 85  # Fallback default
    try:
        res = supabase.table("merchants").select("auto_decline_threshold").eq("id", payload.merchant_id).execute()
        if res.data and len(res.data) > 0:
            threshold = res.data[0]["auto_decline_threshold"]
    except Exception as e:
        print(f"Warning: Could not fetch threshold, using default 85. Error: {e}")

    # 2. Compute Risk Score (0 to 100 scale)
    # (Using rules now; replace 'base_risk' with model.predict_proba() once ML pipeline is loaded)
    base_risk = 88.0 if payload.issuer_country != payload.billing_country else 15.0

    # 3. Decision Logic against Dynamic Threshold
    decision = "DECLINE" if base_risk >= threshold else "APPROVE"

    # 4. Save Evaluation Record into Supabase 'transactions' table
    db_record = payload.model_dump()
    db_record["risk_score"] = base_risk
    db_record["decision"] = decision

    try:
        supabase.table("transactions").insert(db_record).execute()
    except Exception as e:
        print(f"Database error on transaction insert: {str(e)}")

    # 5. Return Evaluation Response
    return {
        "status": "success",
        "transaction_id": payload.transaction_id,
        "merchant_id": payload.merchant_id,
        "risk_score": base_risk,
        "threshold_applied": threshold,
        "decision": decision
    }

@app.post("/predict")
def predict_fraud(transaction: Transaction):
    # Convert the incoming JSON data into a format the AI understands (Pandas DataFrame)
    data = pd.DataFrame([transaction.model_dump()])
    
    # Ask the AI to make a prediction (0 for Normal, 1 for Fraud)
    prediction = model.predict(data)
    
    # Return the result to the frontend
    return {"is_fraud": int(prediction[0])}

@app.get("/api/v1/transactions")
def get_transactions():
    try:
        # Fetch the latest 50 transactions from Supabase
        response = supabase.table("transactions").select("*").limit(50).execute()
        
        # Return the list of transactions
        return response.data
    except Exception as e:
        return {"error": f"Failed to fetch from database: {str(e)}"}


# --- Endpoint: Update Merchant Threshold (Req 5) ---
@app.put("/v1/settings/thresholds")
async def update_merchant_threshold(payload: ThresholdUpdateSchema):
    try:
        # Update the merchant's auto_decline_threshold in Supabase
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


# --- Endpoint: Fetch Merchant Threshold ---
@app.get("/v1/settings/thresholds/{merchant_id}")
async def get_merchant_threshold(merchant_id: str):
    try:
        response = supabase.table("merchants").select("auto_decline_threshold").eq("id", merchant_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Merchant not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))