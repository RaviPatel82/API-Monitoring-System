# 🚀 OrionOps

**Real-time API hit tracking, monitoring, and analytics — multi-tenant, async, and fault-tolerant by design.**

[![Node.js](https://img.shields.io/badge/Node.js_18-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React_18-20232F?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://rabbitmq.com)

**[🌐 Live Dashboard](https://orionops-dev.vercel.app/)** ·
**[⚡ Live API](https://orionops-api-c8gdc0h3dzdxh4bt.centralindia-01.azurewebsites.net/)** ·
**[📦 SDK on npm](https://www.npmjs.com/package/orionops)** ·
**[🧰 SDK Source](https://github.com/RaviPatel82/OrionOps-sdk)**

<!--
  TODO: add a screenshot or short GIF of the live dashboard here.
  This is the single highest-impact thing missing from the repo right now —
  everything else here is text; this is the only thing that shows the product.
  ![Dashboard screenshot](./docs/dashboard.png)
-->

---

## 🚀 Overview

Instead of forcing application servers to block or run slow queries while
logging requests, OrionOps exposes a high-throughput `POST /api/hit`
ingestion endpoint that offloads analytics asynchronously through
**RabbitMQ**, and separates raw transactional logs (**MongoDB**) from
aggregated, dashboard-ready metrics (**PostgreSQL**).

Drop in the [`orionops`](https://www.npmjs.com/package/orionops) SDK as
middleware, and every request your service handles — latency, status code,
endpoint, method — streams to a live, per-tenant dashboard with zero
impact on your response time.

### ✨ Key features

- **⚡ Asynchronous telemetry ingestion** — decouples API-hit logging from
  analytics processing via RabbitMQ with publisher confirms; the ingest
  endpoint returns immediately and never blocks on a database write.
- **🔌 Circuit breaker on the publish path** — a custom closed → open →
  half-open state machine isolates the ingest API from RabbitMQ outages.
  Five consecutive publish failures trip the breaker; it fails fast with
  `503` + `retryAfter` instead of piling up dead connections, then
  self-tests with limited probes after a cooldown before fully reopening.
- **⏱️ Exponential backoff with jitter** — transient broker/network errors
  (`ECONNRESET`, `ETIMEDOUT`, etc.) are retried with `base * 2^attempt`
  delay and randomized jitter, specifically to avoid the thundering-herd
  problem when many clients recover at once.
- **🆔 Idempotent consumer** — a rolling deduplication cache lets the
  consumer safely support at-least-once delivery from RabbitMQ without
  writing duplicate records.
- **🔑 Granular API key management** — multi-tenant keys scoped by
  environment, allowed IP/origin, and per-key service limits.
- **📊 Interactive dashboards** — real-time traffic, latency, and status
  charts, built with React, TailwindCSS, and Recharts.
- **🌐 Language-agnostic ingestion** — `/api/hit` is a plain HTTP+JSON
  endpoint, so any service in any language can report metrics, even
  without the Node SDK.

---

## 🏗️ System architecture

```
┌────────────────────────────────────────┐
│          Client Applications           │
└──────────────────┬─────────────────────┘
                   │
      POST /api/hit (with API Key)
                   ▼
┌────────────────────────────────────────┐
│          Express Ingest App            │
│   - Validate API Key (MongoDB)         │
│   - Rate Limit (Express Rate Limit)    │
│   - Circuit Breaker check              │
└──────────────────┬─────────────────────┘
                   │ Asynchronous Publish
                   ▼
┌────────────────────────────────────────┐
│               RabbitMQ                 │ (Queue: api_hits)
└──────────────────┬─────────────────────┘
                   │ Consumer Subscription
                   ▼
┌────────────────────────────────────────┐
│          Background Consumer           │
│   - Idempotency & Zod Validation       │
│   - Save Raw Hits to MongoDB           │
│   - Fallback-Safe Upsert to Postgres   │
└───────────┬──────────────────┬─────────┘
            │                  │
            ▼                  ▼
   ┌──────────────┐   ┌──────────────┐
   │   MongoDB    │   │  PostgreSQL  │
   │ (Raw Logs &  │   │  (Aggregated │
   │  Metadata)   │   │   Metrics)   │
   └──────────────┘   └──────────────┘
```

Full write-up of the fault-tolerance patterns above (circuit breaker state
diagram, retry strategy, polyglot persistence, repository/DI pattern) is in
**[`docs/architecture.md`](./docs/architecture.md)**.

---

## 🛠️ Tech stack

| Technology             | Category          | Purpose                                                 |
| ---------------------- | ----------------- | ------------------------------------------------------- |
| **Node.js 18**         | Runtime           | JavaScript server runtime                               |
| **Express.js**         | Backend framework | Ingestion & admin REST APIs                             |
| **React + Vite**       | Frontend          | Single-page admin/analytics console                     |
| **TailwindCSS**        | Styling           | Utility-first CSS                                       |
| **Recharts**           | Visualization     | Real-time latency/traffic/status charts                 |
| **RabbitMQ**           | Message broker    | Async event ingestion, with dead-letter queue           |
| **MongoDB + Mongoose** | NoSQL store       | Raw telemetry events, tenant metadata, API key policies |
| **PostgreSQL**         | Relational store  | Pre-aggregated, time-bucketed dashboard metrics         |
| **Zod**                | Validation        | Type-safe schema validation for ingest payloads         |
| **JWT + bcrypt**       | Auth              | httpOnly-cookie sessions, password hashing              |
| **Docker + Compose**   | Infra             | Separate images for ingest API and consumer worker      |

---

## 📁 Project structure

```
orionops/
├── client/                  # Frontend application (Vite + React)
│   └── src/
│       ├── api/             # API client configuration
│       ├── components/      # UI components & route views
│       └── DashboardPage.jsx
├── docs/                    # Architecture, database, API & frontend docs
└── server/                  # Backend application (Express.js)
    └── src/
        ├── services/
        │   ├── analytics/   # Analytics query handlers & routes
        │   ├── auth/        # Authentication, JWT logic & routes
        │   ├── client/      # Tenant & API key management
        │   ├── ingest/      # POST /api/hit ingestion gateway
        │   └── processor/   # RabbitMQ consumer & Postgres upserts
        └── shared/
            ├── events/      # Circuit breaker & RabbitMQ producer
            ├── middlewares/ # Auth & request validation
            └── models/      # Mongoose schemas
```

## 📚 Documentation

- [🏗️ Architecture & fault-tolerance patterns](./docs/architecture.md)
- [💾 Database design (Mongo + Postgres schemas)](./docs/database.md)
- [🔌 API reference & auth](./docs/api-reference.md)
- [💻 Frontend application](./docs/frontend.md)

---

## 🔌 API at a glance

| Method       | Path                                          | Auth           | Purpose                                     |
| ------------ | --------------------------------------------- | -------------- | ------------------------------------------- |
| `GET`        | `/health`                                     | none           | Liveness check                              |
| `POST`       | `/api/auth/onboard-super-admin`               | none           | One-time platform bootstrap                 |
| `POST`       | `/api/auth/register` / `/login`               | none           | User auth                                   |
| `GET`        | `/api/auth/profile`                           | session cookie | Current user session                        |
| `GET`        | `/api/auth/logout`                            | session cookie | Destroy session                             |
| `POST`       | `/api/hit`                                    | `x-api-key`    | Submit one API traffic event (rate-limited) |
| `GET`        | `/api/admin/clients`                          | admin          | List tenants                                |
| `POST`       | `/api/admin/clients/onboard`                  | admin          | Create a tenant + initial user              |
| `GET`/`POST` | `/api/admin/clients/:clientId/users`          | admin          | List / create client-scoped users           |
| `PATCH`      | `/api/admin/clients/:clientId/users/:userId`  | admin          | Deactivate a client user                    |
| `GET`/`POST` | `/api/admin/clients/:clientId/api/keys`       | admin          | List / issue API keys                       |
| `DELETE`     | `/api/admin/clients/:clientId/api-key/:keyId` | admin          | Revoke an API key                           |
| `GET`        | `/api/analytics/stats`                        | session cookie | Aggregated stats for a time range           |
| `GET`        | `/api/analytics/dashboard`                    | session cookie | Stats + top endpoints + recent activity     |

Full request/response shapes, headers, and the role permission matrix
(`super_admin` / `client_admin` / `client_viewer`):
**[`docs/api-reference.md`](./docs/api-reference.md)**.

---

## ⚙️ Quick start

### Docker Compose (recommended)

```bash
cd server
docker-compose up --build -d
```

This builds and starts the ingest API, consumer worker, PostgreSQL,
MongoDB, RabbitMQ (management UI on `:15672`), and pgAdmin (`:8080`) — one
command, no external accounts needed. Schema is created automatically from
`scripts/init-postgres.sql`.

```bash
curl http://localhost:3000/health
```

### Manual setup

```bash
# Backend
cd server
npm install
psql -h localhost -U postgres -d api_monitoring -f scripts/init-postgres.sql
npm run dev          # ingest API
npm run processor     # consumer worker, separate terminal

# Frontend
cd ../client
npm install
npm run dev           # http://localhost:5173
```

See [Environment Configurations](#-environment-configurations) below for
required `.env` values.

---

## 📦 SDK

Instrument any Node service (Express, Fastify, or plain `http`/`https`) in
one line:

```bash
npm install orionops
```

```js
app.use(
    orionops({ apiKey: "pk_live_xxxxxxxxxxxx", serviceName: "my-service" }),
);
```

Full adapter docs, configuration reference, and design notes (never blocks
the response, never throws, no body capture):
**[orionops on npm](https://www.npmjs.com/package/orionops)** ·
**[SDK source](https://github.com/RaviPatel82/OrionOps-sdk)**

Not using Node? `/api/hit` is a plain HTTP+JSON endpoint — callable from
any language with an `x-api-key` header.

---

## 📝 Environment configurations

**`server/.env`**

```env
PORT=3000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/api_monitoring
MONGO_DB_NAME=api_monitoring

PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=api_monitoring
PG_USER=postgres
PG_PASSWORD=postgres

RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE=api_hits
RABBITMQ_RETRY_ATTEMPTS=5
RABBITMQ_RETRY_DELAY=1000

JWT_SECRET=replace_with_a_high_entropy_secret
JWT_EXPIRES_IN=24h

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

**`client/.env.development`**

```env
VITE_API_BASE_URL= http://localhost:3000
```

---

## ☁️ Deployment

Deployed as two separate Docker containers against managed cloud services
— no code changes between local and production, only env var values:

| Component             | Service                                                                        |
| --------------------- | ------------------------------------------------------------------------------ |
| Frontend              | [Vercel](https://vercel.com)                                                   |
| Ingest API + Consumer | [Azure App Service](https://azure.microsoft.com/products/app-service) (Docker) |
| PostgreSQL            | [Supabase](https://supabase.com)                                               |
| MongoDB               | [MongoDB Atlas](https://mongodb.com/atlas)                                     |
| RabbitMQ              | [CloudAMQP](https://cloudamqp.com)                                             |

---

## 🗺️ Roadmap

- [ ] Per-endpoint alerting (latency/error-rate thresholds → webhook/email)
- [ ] Raw event drill-down view in the dashboard (MongoDB already stores
      the data this needs)
- [ ] Public status-page mode tenants can share with their own users

## License

MIT
