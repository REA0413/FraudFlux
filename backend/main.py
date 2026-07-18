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


# --- ENDPOINTS ---

@app.post("/api/v1/evaluate")
def evaluate_transaction(payload: TransactionPayload):
    # 1. Dummy Logic (Before ML)
    base_risk = 0.50 if payload.issuer_country != payload.billing_country else 0.10
    decision = "FLAGGED_FOR_REVIEW" if base_risk > 0.4 else "APPROVED"

    # 2. Prepare data for the database
    db_record = payload.model_dump() 
    db_record["risk_score"] = base_risk
    db_record["decision"] = decision

    # 3. Insert into Supabase
    try:
        data, count = supabase.table("transactions").insert(db_record).execute()
    except Exception as e:
        return {"error": f"Failed to save to database: {str(e)}"}
        
    return {
        "message": "Transaction evaluated and saved to database!",
        "transaction_id": payload.transaction_id,
        "risk_score": base_risk,
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