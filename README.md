# MedCart E-Pharmacy — Backend API

Node.js + Express + Sequelize (PostgreSQL) backend for the MedCart e-pharmacy app
described in the PRD and Flutter screen prompt pack. Covers auth/RBAC, multi-branch
catalog & stock, prescriptions, cart/checkout, orders, promo codes, loyalty, referrals,
notifications, reports, and a pluggable ERP sync adapter.

This has been built, migrated against a real Postgres instance, seeded, and smoke-tested
end-to-end (register → login → browse → cart → promo → checkout → stock deduction →
loyalty accrual → order history) during generation — see "What's been verified" below.

## Stack

- Node.js 18+, Express
- PostgreSQL 13+ via Sequelize ORM (migrations + seeders via sequelize-cli)
- JWT access tokens + rotating opaque refresh tokens
- Joi request validation, Helmet, CORS, rate limiting
- Multer for multipart uploads (prescriptions, avatars, return-request photos), with a
  storage adapter ready to swap in S3/MinIO

## Quick start

### Option A — Docker (fastest)

```bash
cp .env.example .env
docker compose up --build
```

This starts Postgres, runs migrations, seeds demo data, and boots the API on
`http://localhost:4000`.

### Option B — Local Postgres

```bash
cp .env.example .env        # edit DB_* credentials if needed
npm install
npm run db:create           # creates the database
npm run db:migrate          # runs all migrations
npm run db:seed             # loads demo branch/users/products/promo code
npm run dev                 # nodemon, or `npm start` for plain node
```

API is served under `http://localhost:4000/api/v1`. Health check: `GET /api/v1/health`.

### Demo accounts (from the seeder)

| Role       | Email                  | Password     |
| ---------- | ---------------------- | ------------ |
| admin      | admin@medcart.app      | Password123! |
| pharmacist | pharmacist@medcart.app | Password123! |

Demo branch, 3 products (2 OTC, 1 Rx-gated), stock levels, and a `WELCOME10` promo code
are seeded too.

## Project structure

```
src/
  config/           env-driven DB config (sequelize-cli + runtime), shared enums/constants
  models/           Sequelize models (one file per table) + index.js loader
  migrations/       Ordered schema migrations (run via sequelize-cli)
  seeders/          Demo data
  middlewares/      auth (JWT), rbac (role/branch scoping), validate (Joi), upload (multer), errorHandler
  services/         Business logic: token, otp, storage, notification, stock, promo, loyalty,
                     referral, order (checkout/status transitions), erpAdapter
  controllers/      Thin HTTP layer calling services/models
  routes/           One file per resource, mounted under /api/v1 in routes/index.js
  validators/       Joi schemas
  utils/            ApiError, apiResponse, asyncHandler, pagination, logger, orderNumber
  app.js            Express app assembly (middleware stack + routes)
  server.js         Entrypoint — connects DB, then listens
```

## Design notes worth knowing before you extend this

- **Every price is recomputed server-side at checkout** from the live `Product.basePrice`
  — client-sent prices are never trusted.
- **Every stock mutation goes through `stock.service.js`**, which writes a
  `stock_audit_logs` row alongside the change. Don't update `StockLevel.quantity`
  directly anywhere else, or you'll lose the audit trail the PRD calls for.
- **Rx gating is enforced twice**: once when adding an Rx item to the cart (must supply
  a `prescriptionId` you own), and again at checkout (that prescription must be
  `approved`). This mirrors the PRD's prescription→order linking requirement.
- **Checkout runs inside a single DB transaction** (`order.service.js#checkout`): stock
  deduction, order/order-item creation, loyalty point accrual, and cart clearing either
  all succeed or all roll back together. Side effects that shouldn't block the write
  (ERP sync queuing, push notification) run after the transaction commits.
- **The ERP adapter is a seam, not an integration.** `erpAdapter.service.js` defines the
  inbound (ERP → platform, for stock/price) and outbound (platform → ERP, for orders)
  contract and logs every attempt to `erp_sync_logs`, but the actual ERP-specific
  connector (SOAP/REST/SFTP-CSV) is intentionally left as a `TODO` — plug it in without
  touching any controller.
- **Payment methods store only tokenized references** (`providerTokenRef`, `last4`,
  `brand`) — this API is designed to receive a token from a client-side Paystack/
  Flutterwave/Stripe SDK, never a raw card number.
- **Media storage is a stub** (`storage.service.js`) that returns a working local URL
  shape so the rest of the app builds and runs today. Swap in `@aws-sdk/client-s3` once
  bucket credentials exist — every call site already goes through this one module.
- **RBAC**: four roles (`customer`, `branch_staff`, `pharmacist`, `admin`).
  `middlewares/rbac.js` has both `requireRole(...)` and `scopeToOwnBranch`, which
  restricts branch_staff/pharmacist actions to their own `branchId` unless they're admin.
- **Loyalty math (1 point per currency unit spent, 100 points = 1 currency unit
  discount) and the flat delivery fee are placeholder business rules** — they're centralized
  in `loyalty.service.js` and `order.service.js` respectively so they're a one-line change
  once the client confirms the real numbers.

## What's been verified

During generation this project was installed, migrated against a real PostgreSQL 16
instance, seeded, and exercised through its actual HTTP API (not just unit-level):
register → login → list products/branches → select branch → add items to cart → apply
promo code → checkout → confirmed stock was deducted, cart was cleared, loyalty points
were credited, the order appeared in order history, and that adding a prescription-only
item without a `prescriptionId` is correctly rejected. Role-based access control was
confirmed by observing a `customer` token get a 403 on a staff-only stock endpoint.

What's _not_ live-tested here (needs real third-party credentials you'll supply):
payment gateway charge flow, SMS/email OTP delivery, push notifications, S3 upload, and
the ERP connector — each has a clearly marked seam and `TODO` to wire in.

## Extending this

- **Backend portal APIs** (Stock Management, Order Queue, Prescription Review, Reports,
  Campaign Builder, ERP Sync Settings) already exist as REST endpoints here — a web
  dashboard just needs to consume `/api/v1/stock`, `/orders/queue`, `/prescriptions/queue`,
  `/reports/*`, `/campaigns`, and `/erp/sync-logs` with an admin/staff-scoped token.
- **Flutter app**: every screen in the prompt pack maps to one or more endpoints here —
  e.g. Prompt 9 (Home Dashboard) → `GET /products`, `GET /categories`, `GET /branches`;
  Prompt 16 (Cart) → `/cart/*`; Prompt 20 (Order Review) → `POST /orders/checkout`.
- Add a real queue/worker (BullMQ + Redis) once ERP sync and notification fan-out need
  to run asynchronously at scale — both are currently synchronous but isolated behind
  their service modules, so swapping in a queue is a contained change.

## Docker Image

A pre-built image is available on Docker Hub if you'd rather pull than build:

```bash
docker pull taiwo17/epharmacy-backend:v1
```

The Compose setup uses a `healthcheck` on the Postgres service (`pg_isready`) combined
with `depends_on: condition: service_healthy` on the API service, so the API container
won't attempt to connect — or run migrations — until Postgres is actually ready to
accept connections. This avoids the race condition that's common in naive Compose
setups where the app starts before the database does.

**Debugging note:** the trickiest issue during containerization wasn't networking —
it was a silent credential mismatch: the Postgres container was initialized with one
password via `docker-compose.yml`, while the app read a _different_ password from
`.env`, producing a `password authentication failed` error that looked identical
before and after wiping the data volume. Fixed by having Compose interpolate
`${DB_USER}` / `${DB_PASSWORD}` / `${DB_NAME}` directly from `.env` instead of
hardcoding separate values in the compose file, so both sides always agree.
