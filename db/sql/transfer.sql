CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    from_username VARCHAR(50) NOT NULL REFERENCES accounts(username),
    to_username VARCHAR(50) NOT NULL REFERENCES accounts(username),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
