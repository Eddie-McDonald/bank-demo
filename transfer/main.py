import os
from decimal import Decimal

import psycopg2
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "accountdb")
DB_USER = os.environ.get("DB_USER", "bankdemo")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "bankdemo")


def get_connection():
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )


class TransferRequest(BaseModel):
    from_username: str
    to_username: str
    amount: Decimal = Field(gt=0)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/transfer")
def transfer(req: TransferRequest):
    if req.from_username == req.to_username:
        raise HTTPException(status_code=400, detail="Cannot transfer to the same account")

    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT username, balance FROM accounts WHERE username IN (%s, %s) FOR UPDATE",
                    (req.from_username, req.to_username),
                )
                balances = {username: balance for username, balance in cur.fetchall()}

                if req.from_username not in balances:
                    raise HTTPException(status_code=404, detail=f"Unknown sender: {req.from_username}")
                if req.to_username not in balances:
                    raise HTTPException(status_code=404, detail=f"Unknown recipient: {req.to_username}")
                if balances[req.from_username] < req.amount:
                    raise HTTPException(status_code=400, detail="Insufficient funds")

                cur.execute(
                    "UPDATE accounts SET balance = balance - %s WHERE username = %s",
                    (req.amount, req.from_username),
                )
                cur.execute(
                    "UPDATE accounts SET balance = balance + %s WHERE username = %s",
                    (req.amount, req.to_username),
                )
                cur.execute(
                    "INSERT INTO transfers (from_username, to_username, amount) VALUES (%s, %s, %s)",
                    (req.from_username, req.to_username, req.amount),
                )
    finally:
        conn.close()

    return {
        "success": True,
        "from_username": req.from_username,
        "to_username": req.to_username,
        "amount": str(req.amount),
    }
