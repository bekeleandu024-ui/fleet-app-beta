# Fleet App — MVP skeleton

This repository is a Next.js frontend plus a small set of backend microservice skeletons for the Fleet App MVP.

Services added under `services/` (TypeScript + Express):

- master-data — CRUD for drivers, units, trailers (port 4001)
- orders — order intake CRUD (port 4002)
- dispatch — trips creation/listing (port 4003)
- tracking — GPS pings endpoint (port 4004)

There's a `docker-compose.yml` that brings up Postgres (placeholder), Kafka (placeholder), and builds each service.

Quick dev instructions (local machine):

1. From each service folder, install deps and run dev server:

```powershell
cd services\master-data
npm install
npm run dev

# open another terminal for other services
cd ..\orders
npm install
npm run dev
```

2. Or use docker-compose to build and run containers (may take longer):

```powershell
docker-compose up --build
```

3. Example API calls (after the services are running):

Create a driver:

```powershell
curl -X POST http://localhost:4001/drivers -H "Content-Type: application/json" -d '{"name":"Alice","phone":"+15551234"}'
```

Create an order:

```powershell
curl -X POST http://localhost:4002/orders -H "Content-Type: application/json" -d '{"customer":"ACME","origin":"NYC","destination":"BOS","pieces":1}'
```

Create a trip from an order:

```powershell
curl -X POST http://localhost:4003/trips -H "Content-Type: application/json" -d '{"orderIds":["<order-id>"],"plannedPickup":"2025-11-05T09:00:00Z"}'
```

Send a GPS ping:

```powershell
curl -X POST http://localhost:4004/pings -H "Content-Type: application/json" -d '{"tripId":"<trip-id>","lat":40.7,"lon":-74.0}'
```

Notes & next steps:

- Currently each service uses an in-memory store for fast iteration; for production wire each service to Postgres (master-data, orders, dispatch) and to an event bus for async flows (Kafka). 
- Add authentication (AuthN) and authorization (RBAC/ABAC). Consider an API gateway (traefik/nginx or managed) and service discovery for scale.
- Add ePOD uploads (use S3-compatible storage), signature capture endpoints, and link ePODs to trips.
- Add CI, tests, linting and a monorepo workspace if you want to centralize dependencies.

If you want, I can:
- Turn these into a single monorepo with npm workspaces and a top-level dev script.
- Add Postgres wiring and simple Prisma schemas.
- Add basic unit tests (jest/vitest) for the APIs.

