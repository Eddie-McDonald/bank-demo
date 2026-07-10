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
| Databases         | PostgreSQL (per service)  | 5432 |

Each service gets its own Dockerfile and its own Postgres container (no shared database).

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
(Java/Spring Boot, :8081) + Postgres, wired in `docker-compose.yml`. `docker compose up --build -d`
brings up all three containers cleanly. `/health` returns OK and `/login` works end-to-end through
the gateway to the auth service against the seeded `users` table (e.g. alice/password123).

Next: add account/balance (.NET), transfer (Python/FastAPI), and the frontend, one at a time, per
the build order above.
