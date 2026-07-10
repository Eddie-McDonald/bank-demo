# bank-demo

Demo banking application, built one vertical slice at a time. This slice covers:
API gateway (Node/Express) → Login/auth (Java/Spring Boot) → Postgres.

## Build and run

```bash
docker compose up --build
```

This builds the `auth` and `gateway` images and starts all three containers
(`db`, `auth`, `gateway`) on a shared network. The gateway listens on
`localhost:3000`, auth on `localhost:8081`, Postgres on `localhost:5432`.

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

## Rebuilding after code changes

```bash
docker compose up --build auth   # rebuild just the auth service
docker compose up --build gateway   # rebuild just the gateway
```
