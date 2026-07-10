CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    balance NUMERIC(12,2) NOT NULL
);

INSERT INTO accounts (username, balance) VALUES
    ('alice', 5000.00),
    ('bob', 1200.50),
    ('carol', 300.75)
ON CONFLICT (username) DO NOTHING;
