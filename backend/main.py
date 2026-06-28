from fastapi import FastAPI

# Initialize the FastAPI app
app = FastAPI(title="FraudFlux API", version="1.0")

# Create a basic health-check route
@app.get("/")
def read_root():
    return {"status": "success", "message": "Welcome to the FraudFlux API Engine"}

# Create a dummy endpoint for evaluating a transaction
@app.post("/api/v1/evaluate")
def evaluate_transaction():
    # Later, this will connect to your XGBoost model!
    return {"risk_score": 0.15, "decision": "APPROVED"}