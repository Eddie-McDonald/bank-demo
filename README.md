# bank-demo

Demo banking application, built one vertical slice at a time. All backend and frontend
slices are now in place: a web frontend (Node/Express, static SPA) talks to an API gateway
(Node/Express), which fronts Login/auth (Java/Spring Boot), Account/balance (.NET/ASP.NET
Core), and Transfer (Python/FastAPI) — all backed by a single shared Postgres instance.

## Build and run

```bash
docker compose up --build
```

This builds the `auth`, `account`, `transfer`, `gateway`, and `frontend` images and
starts all six containers (`db`, `auth`, `account`, `transfer`, `gateway`, `frontend`)
on a shared network. Open **`http://localhost:8080`** in a browser for the UI. The gateway
listens on `localhost:3000`, auth on `localhost:8081`, account on `localhost:5000`, transfer
on `localhost:8000`. Postgres is a single shared instance (not per-service) to keep memory
usage down, hosting two databases — `authdb` and `accountdb` — each owned by the `bankdemo`
role. It's not exposed on a host port.

To stop and remove the containers:

```bash
docker compose down
```

To also wipe the seeded database volume state on next start:

```bash
docker compose down -v
```

## Seeded users

`db/init.sh` creates the `authdb` and `accountdb` databases on first startup and runs
`db/sql/auth.sql` against `authdb`, seeding three demo users:

| username | password    |
|----------|-------------|
| alice    | password123 |
| bob      | hunter2     |
| carol    | letmein     |

## Test with curl

Health check:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

Successful login, through the gateway:

```bash
curl -i -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}'
# HTTP/1.1 200 OK
# {"success":true,"message":"Login successful"}
```

Failed login (wrong password):

```bash
curl -i -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"wrong"}'
# HTTP/1.1 401 Unauthorized
# {"success":false,"message":"Invalid username or password"}
```

You can also call the auth service directly, bypassing the gateway:

```bash
curl -i -X POST http://localhost:8081/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","password":"hunter2"}'
```

## Seeded accounts

`db/init.sh` also runs `db/sql/account.sql` against `accountdb`, seeding starting balances
for the same three demo users:

| username | balance |
|----------|---------|
| alice    | 5000.00 |
| bob      | 1200.50 |
| carol    | 300.75  |

Balance lookup, through the gateway:

```bash
curl -i http://localhost:3000/accounts/alice/balance
# HTTP/1.1 200 OK
# {"username":"alice","balance":5000}
```

Unknown user:

```bash
curl -i http://localhost:3000/accounts/nobody/balance
# HTTP/1.1 404 Not Found
# {"message":"Account not found"}
```

You can also call the account service directly, bypassing the gateway:

```bash
curl -i http://localhost:5000/accounts/bob/balance
```

## Transfers

`db/init.sh` also runs `db/sql/transfer.sql` against `accountdb`, creating a `transfers` table.
Transfers debit the sender and credit the recipient in `accounts` and insert a row into
`transfers`, all in one transaction (with row locking so concurrent transfers on the same
account can't race).

Successful transfer, through the gateway:

```bash
curl -i -X POST http://localhost:3000/transfer \
  -H "Content-Type: application/json" \
  -d '{"from_username":"alice","to_username":"bob","amount":250.00}'
# HTTP/1.1 200 OK
# {"success":true,"from_username":"alice","to_username":"bob","amount":"250"}
```

Insufficient funds:

```bash
curl -i -X POST http://localhost:3000/transfer \
  -H "Content-Type: application/json" \
  -d '{"from_username":"carol","to_username":"alice","amount":100000.00}'
# HTTP/1.1 400 Bad Request
# {"detail":"Insufficient funds"}
```

You can also call the transfer service directly, bypassing the gateway:

```bash
curl -i -X POST http://localhost:8000/transfer \
  -H "Content-Type: application/json" \
  -d '{"from_username":"bob","to_username":"carol","amount":50.00}'
```

## Using the web UI

Open `http://localhost:8080` in a browser. It's a minimal, dependency-light vanilla
HTML/CSS/JS SPA (no frontend framework or build step) served by the `frontend` service,
which proxies API calls to the gateway server-side (`/api/login`, `/api/accounts/:username/
balance`, `/api/transfer`) so the browser only ever talks to `localhost:8080` — no CORS setup
needed.

1. Log in as `alice` / `password123`.
2. The dashboard shows the current balance, with a Refresh button.
3. Fill in the transfer form (recipient username + amount) and submit — the balance
   auto-refreshes afterward.

There's no session/token; the logged-in username is just held in browser memory, matching
the backend, which doesn't issue one either.

## Rebuilding after code changes

```bash
docker compose up --build auth       # rebuild just the auth service
docker compose up --build account    # rebuild just the account service
docker compose up --build transfer   # rebuild just the transfer service
docker compose up --build gateway    # rebuild just the gateway
docker compose up --build frontend   # rebuild just the frontend
```
