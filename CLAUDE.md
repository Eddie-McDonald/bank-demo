# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

bank-demo is a demo banking application built to be instrumented with Dynatrace OneAgent.
It is intentionally polyglot — one service per language — to showcase Dynatrace's
auto-instrumentation, distributed tracing, and Smartscape across runtimes.

## Architecture

Microservices, each in its own language, orchestrated with Docker Compose.

| Service           | Language / Runtime       | Port |
|-------------------|---------------------------|------|
| Web frontend      | Node.js + SPA (RUM)       | 8080 |
| API gateway       | Node.js (Express)         | 3000 |
| Login / auth      | Java (Spring Boot)        | 8081 |
| Account / balance | .NET (ASP.NET Core)       | 5000 |
| Transfer          | Python (FastAPI)          | 8000 |
| Databases         | PostgreSQL (shared instance, one DB per service) | 5432 |

Each service gets its own Dockerfile. Postgres is a single shared container (one instance,
one database per service — `authdb`, `accountdb`, etc.) to conserve memory on the 8 GB host;
see Current status for why this changed from the original one-container-per-service design.

## Build order

Build and verify ONE vertical slice at a time. Do NOT scaffold all services at once.

1. **First slice**: API gateway (Node) + Login/auth (Java/Spring Boot) + a Postgres
   container, wired in `docker-compose.yml`, with a working `/login` call working
   end-to-end.
2. Only after that slice runs do we add account, transfer, and the frontend, one at a time.

Check current progress against the status section below before starting new work.

## Constraints

- Target environment: Docker Desktop on WSL2, 8 GB RAM host — keep containers lean.
- Prefer small, standard base images (e.g. `eclipse-temurin` for Java, `node:20-slim`,
  `python:3.12-slim`).
- Dynatrace OneAgent is added LAST as a base-image layer per Dockerfile — do not add it
  until explicitly instructed, even if other services are complete.

## Current status

Slice 1 complete and verified (2026-07-10): API gateway (Node/Express, :3000) + Login/auth
(Java/Spring Boot, :8081) + Postgres, wired in `docker-compose.yml`. `/health` returns OK and
`/login` works end-to-end through the gateway to the auth service against the seeded `users`
table (e.g. alice/password123).

Slice 2 complete and verified (2026-07-10): Account/balance service (.NET/ASP.NET Core, :5000),
wired in `docker-compose.yml`. Exposes `GET /accounts/{username}/balance`, backed by a seeded
`accounts` table (alice/bob/carol). Gateway forwards `GET /accounts/{username}/balance` to it.

Postgres consolidated to a single shared container (2026-07-10): replaced the separate `db` and
`account-db` containers with one `db` Postgres instance hosting two databases, `authdb` and
`accountdb`, created and seeded by `db/init.sh` (runs `db/sql/auth.sql` and `db/sql/account.sql`
against each). Both `auth` and `account` connect to the same `bankdemo` role, just with different
`DB_NAME`s. Done to cut memory usage on the 8 GB host — was running two Postgres containers for
two small seed tables. `docker compose up --build -d` brings up all four containers (`db`, `auth`,
`account`, `gateway`) cleanly; login and balance lookups both verified working end-to-end.

Slice 3 complete and verified (2026-07-10): Transfer service (Python/FastAPI, :8000), wired in
`docker-compose.yml`. Exposes `POST /transfer` (`from_username`, `to_username`, `amount`), debits
the sender and credits the recipient in `accounts`, and inserts a row into a new `transfers` table
— all in one Postgres transaction with `SELECT ... FOR UPDATE` row locking, rejecting the transfer
with a 400 if the sender's balance is insufficient. The `transfers` table lives in **`accountdb`**,
not a separate `transferdb` as originally sketched below — it needs to commit atomically with the
balance debit/credit, and Postgres can't do a transaction across two databases. Seed/schema is
`db/sql/transfer.sql`, wired into `db/init.sh` after `account.sql`. Gateway forwards `POST
/transfer` to it. Verified end-to-end: a 250.00 alice→bob transfer correctly moved the balances
and was recorded in `transfers`; an oversized carol→alice transfer was rejected with "Insufficient
funds" and left carol's balance unchanged; login and balance lookups still work.

Next: add the frontend, per the build order above. No more backend databases are anticipated, but
if one is needed, prefer adding it to an existing database in `db/sql/` over a new Postgres
container unless it must be transactionally independent from what's already there.
