Backend interview assignment implemented as a small NestJS microservices system:

- `gateway` (HTTP API, Kafka request/reply)
- `tournament-service` (Kafka handlers + NATS client + Postgres persistence)
- `user-service` (hardcoded users over NATS)
- `showcase-ui` (small React app to showcase endpoints)

## Architecture

### Services

- `gateway (port 3000)`
  - Exposes HTTP endpoints
  - Validates input
  - Handles JWT login/verification
  - Sends commands/queries to `tournament-service` via Kafka
  - No DB access

- `tournament-service`
  - Kafka microservice (command/query handlers)
  - Calls `user-service` via NATS for user data (no local user cache/DB)
  - Stores tournament and tournament player data in Postgres via TypeORM

- `user-service`
  - NATS responder with hardcoded users (`user1`..`user4`)
  - No Kafka
  - No database

- `showcase-ui (port 8080)`
  - Very simple React/Vite app to demo:
    - login (JWT)
    - join tournament
    - my tournaments
    - player tournaments lookup
    - gateway health


## Tech Stack

- Node.js (LTS, Docker images use Node 24)
- NestJS (HTTP + microservices)
- Kafka (`kafkajs`, Nest Kafka transport)
- NATS (Nest NATS client/server)
- PostgreSQL + TypeORM
- Docker Compose
- Jest (unit tests)
- React + Vite (showcase UI)

## Project Structure

```text
apps/
  gateway/              # HTTP API + JWT + Kafka client
  tournament-service/   # Kafka consumer + NATS client + Postgres
  user-service/         # NATS user lookup service (hardcoded users)
  showcase-ui/          # React demo app
  shared/
    contracts/          # Shared message/result types
    config/             # Shared env parsing helpers
openapi/                # Static OpenAPI spec for gateway Swagger UI
postman/                # Postman collection
docker-compose.yml
Dockerfile              # Shared backend image (gateway/user/tournament)
```

## Prerequisites

- Docker Desktop / Docker Engine + Docker Compose
- Node.js 24+ (for local dev)
- npm

## Quick Start (Recommended: Docker)

Start everything:

```bash
docker compose up -d --build
```

Services:

- Gateway API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`
- Showcase UI: `http://localhost:8080`
- Postgres: `localhost:5432`
- NATS: `localhost:4222`
- Kafka (host listener): `localhost:9094`

Stop everything:

```bash
docker compose down
```

Reset containers + volumes (clears local Postgres/Kafka data):

```bash
docker compose down -v
```
### Request Flow Examples

#### Join tournament (command)

1. UI / client calls `POST /tournaments/join` on `gateway`
2. `gateway` extracts `playerId` from JWT (`token.sub`)
3. `gateway` sends Kafka command `tournament.join.command`
4. `tournament-service` receives command
5. `tournament-service` requests user from `user-service` via NATS (`users.get-by-id`)
6. `tournament-service` persists/finds tournament in Postgres and adds player
7. `tournament-service` replies over Kafka
8. `gateway` returns HTTP response

#### Get tournaments (query)

1. UI / client calls `GET /tournaments/my-tournaments` or `GET /players/:playerId/tournaments`
2. `gateway` sends Kafka query `tournament.get-player-tournaments.query`
3. `tournament-service` reads from Postgres
4. `tournament-service` replies over Kafka
5. `gateway` returns HTTP response
## Environment Variables

See `.env.example` for defaults.

Important ones:

- `GATEWAY_PORT` (default `3000`)
- `SHOWCASE_UI_PORT` (default `8080`)
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (default `1h`)
- `POSTGRES_*`
- `KAFKA_EXTERNAL_PORT` (default `9094` for host clients)

Notes:

- Docker services use `kafka:9092` internally
- Host-run apps should use `localhost:9094` for Kafka

## Running Locally (Without Docker for App Processes)

You can run infra in Docker and services on your host machine.

### 1. Install dependencies from the base folder

```bash
npm install
```

### 1. Start infra only

```bash
npm run infra:up
```

### 2. Start backend services (separate terminals)

User service:

```bash
npm run start:user-service:dev
```

Tournament service:

```bash
npm run start:tournament-service:dev
```

Gateway:

```bash
npm run start:gateway:dev
```

### 3. Start showcase UI locally (optional)

```bash
cd apps/showcase-ui
npm install
npm run dev
```

Then open:

- UI: `http://localhost:5173`

The UI defaults to calling `http://localhost:3000`.

## API Endpoints (Gateway)

### Health

- `GET /health`

### Auth

- `POST /auth/login`
  - Demo login endpoint that issues a JWT for a `playerId`
  - Keeps auth simple for the assignment so the focus remains on Kafka/NATS flow

Request:

```json
{
  "playerId": "user1"
}
```

### Tournaments

- `POST /tournaments/join` (JWT required)
- `GET /tournaments/my-tournaments` (JWT required)
- `GET /players/:playerId/tournaments` (public/debug convenience route)

#### Join tournament request (JWT version)

```json
{
  "gameType": "chess",
  "tournamentType": "solo",
  "entryFee": 10
}
```

`playerId` is derived from the JWT (`token.sub`) in the gateway.

## Curl Examples

### 1. Login and get a token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"playerId\":\"user1\"}"
```

### 2. Join tournament (use token from login)

```bash
curl -X POST http://localhost:3000/tournaments/join \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"gameType\":\"chess\",\"tournamentType\":\"solo\",\"entryFee\":10}"
```

### 3. Get my tournaments

```bash
curl http://localhost:3000/tournaments/my-tournaments \
  -H "Authorization: Bearer <TOKEN>"
```

### 4. Get tournaments for a player (debug/public route)

```bash
curl http://localhost:3000/players/user1/tournaments
```

## Swagger / OpenAPI

- Swagger UI is available at `http://localhost:3000/docs`
- The project uses a **static OpenAPI JSON** (spec-first style) to keep controllers/DTOs free of Swagger decorators:
  - `openapi/tournament-gateway.openapi.json`

## Postman

Import:

- `postman/tournament-microservices.postman_collection.json`

The collection includes:

- login + token save
- join tournament
- my tournaments
- player tournaments
- health
- basic error scenarios (missing JWT, validation, duplicate join, missing user)

## Tests

Run all tests:

```bash
npm test
```

Run per app:

```bash
npm run test:gateway
npm run test:tournament-service
npm run test:user-service
```

Current tests are mostly unit tests for controllers/services (Kafka/NATS/DB dependencies mocked where appropriate).

## Build

Backend apps:

```bash
npm run build
```

Showcase UI:

```bash
npm --prefix apps/showcase-ui run build
```


## Demo Users (Hardcoded)

- `user1` (Alice)
- `user2` (Bob)
- `user3` (Carol)
- `user4` (Dan)

## Notes
- If Postgres auth fails with the expected password, you may have an existing Docker volume initialized with older credentials. Recreate with:

```bash
docker compose down -v
docker compose up -d postgres
```
