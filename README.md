# bank-demo

Demo banking application, built one vertical slice at a time. So far:
API gateway (Node/Express) → Login/auth (Java/Spring Boot) → Postgres, and
API gateway → Account/balance (.NET/ASP.NET Core) → Postgres.

## Build and run

```bash
docker compose up --build
```

This builds the `auth`, `account`, and `gateway` images and starts all five
containers (`db`, `auth`, `account-db`, `account`, `gateway`) on a shared
network. The gateway listens on `localhost:3000`, auth on `localhost:8081`,
account on `localhost:5000`. Each service has its own Postgres container
(not exposed on a host port, except the auth `db` container which is on
`localhost:5432` for convenience).

To stop and remove the containers:

```bash
docker compose down
```

To also wipe the seeded database volume state on next start:

```bash
docker compose down -v
```

## Seeded users

The `db/init.sql` script seeds three demo users on first startup:

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

The `account-db/init.sql` script seeds starting balances for the same three demo users:

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

## Rebuilding after code changes

```bash
docker compose up --build auth      # rebuild just the auth service
docker compose up --build account   # rebuild just the account service
docker compose up --build gateway   # rebuild just the gateway
```
