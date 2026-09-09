# MedCart E-Pharmacy — Backend API

A production-grade backend for a multi-branch e-pharmacy platform. Built with Node.js, Express, and PostgreSQL, containerized, CI/CD-automated, and deployed to both AWS EC2 and Kubernetes.

## Stack

Node.js · Express · PostgreSQL (Sequelize) · JWT auth · Docker · GitHub Actions · Terraform · AWS EC2 · Kubernetes · Prometheus & Grafana

## Features

- Auth & role-based access control (customer, branch staff, pharmacist, admin)
- Multi-branch product catalog, stock levels, and audit-logged stock changes
- Prescription-gated checkout with server-side price recomputation
- Cart, promo codes, checkout, loyalty points, and referrals
- Order management with return requests
- Notifications and a pluggable ERP sync adapter

## Quick start

### Option A — Docker (fastest)

```bash
cp .env.example .env
docker compose up --build
```

Runs migrations, seeds demo data, and starts the API at `http://localhost:4000/api/v1`. The `postgres` service uses a `pg_isready` healthcheck combined with `depends_on: condition: service_healthy` on the API service, so the app never attempts to connect — or run migrations — before Postgres is actually ready. This avoids the race condition common in naive Compose setups where the app starts before the database does.

**Pre-built image**, if you'd rather pull than build:
```bash
docker pull taiwo17/epharmacy-backend:latest
```

**Debugging note:** the trickiest issue during containerization wasn't networking — it was a silent credential mismatch: the Postgres container was initialized with one password via `docker-compose.yml`, while the app read a *different* password from `.env`, producing a `password authentication failed` error that looked identical before and after wiping the data volume. Fixed by having Compose interpolate `${DB_USER}` / `${DB_PASSWORD}` / `${DB_NAME}` directly from `.env` instead of hardcoding separate values in the compose file, so both sides always agree.

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

Demo branch, 3 products (2 OTC, 1 Rx-gated), stock levels, and a `WELCOME10` promo code are seeded too.

## Live Deployment

Deployed on AWS EC2 via Terraform, with GitHub Actions auto-deploying every push to `main`. See [`infra/`](./infra) for the Terraform config and [`.github/workflows`](./.github/workflows) for the pipeline.

## Kubernetes

Also deployable to a Kubernetes cluster — see [`k8s/`](./k8s) for the manifests:

- **`deployment.yaml`** — runs the API as 2 self-healing replicas. Includes a `wait-for-postgres` **init container** that blocks the main app container from starting until Postgres is genuinely accepting connections (Kubernetes has no native `depends_on`, so this — combined with a `readinessProbe` on the Postgres deployment — is the equivalent).
- **`postgres.yaml`** — a single-replica Postgres deployment plus a `postgres` Service, which is what makes the hostname `postgres` resolvable inside the cluster.
- **`service.yaml`** — a `NodePort` Service exposing the API outside the cluster.

```bash
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl exec -it deployment/epharmacy-api -- npx sequelize-cli db:migrate
kubectl port-forward service/epharmacy-api 4000:4000
```

**Monitoring:** a Prometheus + Grafana stack (installed via the `kube-prometheus-stack` Helm chart) provides live, per-pod CPU/memory metrics for both the API replicas and the Postgres pod.

```bash
helm install monitoring prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace
kubectl --namespace monitoring port-forward svc/monitoring-grafana 3000:80
```

## CI/CD

Every push to `master` triggers `.github/workflows/ci-cd.yml`, which:

1. Spins up a throwaway Postgres service inside the CI runner
2. Runs migrations against it
3. Runs the test suite (`npm test`) — the pipeline stops here if tests fail
4. Logs into Docker Hub using repo secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`)
5. Builds and pushes the image to `taiwo17/epharmacy-backend:latest`

A broken image is never pushed — the test step gates the build/push steps.

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
tests/
  health.test.js    Smoke test hitting GET /api/v1/health
.github/workflows/
  ci-cd.yml         GitHub Actions pipeline — migrate, test, build, push to Docker Hub on every push to master
infra/              Terraform (AWS EC2, security group, key pair)
k8s/                Kubernetes manifests (Deployment, Service, Postgres + readiness probe)
```

## Design notes worth knowing before you extend this

- **Every price is recomputed server-side at checkout** from the live `Product.basePrice` — client-sent prices are never trusted.
- **Every stock mutation goes through `stock.service.js`**, which writes a `stock_audit_logs` row alongside the change. Don't update `StockLevel.quantity` directly anywhere else, or you'll lose the audit trail the PRD calls for.
- **Rx gating is enforced twice**: once when adding an Rx item to the cart (must supply a `prescriptionId` you own), and again at checkout (that prescription must be `approved`). This mirrors the PRD's prescription→order linking requirement.
- **Checkout runs inside a single DB transaction** (`order.service.js#checkout`): stock deduction, order/order-item creation, loyalty point accrual, and cart clearing either all succeed or all roll back together. Side effects that shouldn't block the write (ERP sync queuing, push notification) run after the transaction commits.
- **The ERP adapter is a seam, not an integration.** `erpAdapter.service.js` defines the inbound (ERP → platform, for stock/price) and outbound (platform → ERP, for orders) contract and logs every attempt to `erp_sync_logs`, but the actual ERP-specific connector (SOAP/REST/SFTP-CSV) is intentionally left as a `TODO` — plug it in without touching any controller.
- **Payment methods store only tokenized references** (`providerTokenRef`, `last4`, `brand`) — this API is designed to receive a token from a client-side Paystack/Flutterwave/Stripe SDK, never a raw card number.
- **Media storage is a stub** (`storage.service.js`) that returns a working local URL shape so the rest of the app builds and runs today. Swap in `@aws-sdk/client-s3` once bucket credentials exist — every call site already goes through this one module.
- **RBAC**: four roles (`customer`, `branch_staff`, `pharmacist`, `admin`). `middlewares/rbac.js` has both `requireRole(...)` and `scopeToOwnBranch`, which restricts branch_staff/pharmacist actions to their own `branchId` unless they're admin.
- **Loyalty math (1 point per currency unit spent, 100 points = 1 currency unit discount) and the flat delivery fee are placeholder business rules** — they're centralized in `loyalty.service.js` and `order.service.js` respectively so they're a one-line change once the client confirms the real numbers.

## What's been verified

During generation this project was installed, migrated against a real PostgreSQL 16 instance, seeded, and exercised through its actual HTTP API (not just unit-level): register → login → list products/branches → select branch → add items to cart → apply promo code → checkout → confirmed stock was deducted, cart was cleared, loyalty points were credited, the order appeared in order history, and that adding a prescription-only item without a `prescriptionId` is correctly rejected. Role-based access control was confirmed by observing a `customer` token get a 403 on a staff-only stock endpoint.

What's *not* live-tested here (needs real third-party credentials you'll supply): payment gateway charge flow, SMS/email OTP delivery, push notifications, S3 upload, and the ERP connector — each has a clearly marked seam and `TODO` to wire in.

## Extending this

- **Backend portal APIs** (Stock Management, Order Queue, Prescription Review, Reports, Campaign Builder, ERP Sync Settings) already exist as REST endpoints here — a web dashboard just needs to consume `/api/v1/stock`, `/orders/queue`, `/prescriptions/queue`, `/reports/*`, `/campaigns`, and `/erp/sync-logs` with an admin/staff-scoped token.
- **Flutter app**: every screen in the prompt pack maps to one or more endpoints here — e.g. Prompt 9 (Home Dashboard) → `GET /products`, `GET /categories`, `GET /branches`; Prompt 16 (Cart) → `/cart/*`; Prompt 20 (Order Review) → `POST /orders/checkout`.
- Add a real queue/worker (BullMQ + Redis) once ERP sync and notification fan-out need to run asynchronously at scale — both are currently synchronous but isolated behind their service modules, so swapping in a queue is a contained change.

## Known Limitations

- PostgreSQL runs co-located with the app (in both the Docker Compose and Kubernetes setups) rather than as a managed service — AWS RDS is the intended production upgrade
- Secrets are managed via GitHub Secrets, not a dedicated secrets manager

## Author

[Shobo](https://github.com/Taiwo17) — TEEWEBDESIGN