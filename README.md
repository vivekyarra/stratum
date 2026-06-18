# STRATUM

STRATUM is a full-stack neighborhood intelligence platform built with Next.js 14, MapLibre, DynamoDB-style report ingestion, Aurora-style analytics, NextAuth, and Stripe checkout wiring.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

The app runs with deterministic demo data when AWS and Aurora environment variables are not configured. The B2B analytics endpoint still works locally with:

```bash
curl -H "Authorization: Bearer sk_stratum_demo_live" http://localhost:3000/api/analytics/san_francisco
```

## Key routes

- `/` landing page with live map hero, audience cards, pricing, and architecture diagram
- `/map` public full-screen MapLibre report map with layer toggles and no-login report submission
- `/neighborhood/[geohash]` health breakdown, 7-day trends, and anonymized reports
- `/dashboard` B2B API dashboard with API key and usage meter
- `/city/[city_id]` city heat map, infrastructure queue, and report export table

## API routes

- `POST /api/reports`
- `GET /api/map/clusters?bbox=minLng,minLat,maxLng,maxLat&layers=SAFETY,VIBE&city_id=san_francisco`
- `GET /api/neighborhood/[geohash]`
- `GET /api/analytics/[city_id]` with `Authorization: Bearer <api_key>`

## Production data architecture

Report writes use DynamoDB:

- Table: `stratum-reports`
- Partition key: `geohash`
- Sort key: `timestamp_id` in `ISO8601#uuid` format
- GSI: `city_id-time` with `city_id` as partition key and `timestamp_id` as sort key
- TTL: `ttl`, set to 90 days after report creation

Analytics and commercial state use Aurora PostgreSQL:

- `neighborhoods`
- `neighborhood_scores`
- `users`
- `api_subscriptions`
- `api_call_logs`

This is a CQRS-like split: DynamoDB absorbs high-volume anonymous geospatial writes by neighborhood cell, while Aurora serves score snapshots, account state, subscriptions, billing logs, and exportable analytics.

Production deployments can use the Aurora Data API by setting
`AURORA_RESOURCE_ARN`, `AURORA_SECRET_ARN`, and `AURORA_DATABASE`. Direct
PostgreSQL credentials remain supported for private-network deployments.

## Seed data

```bash
npm run migrate
npm run seed
```

The seed script generates 900 reports across San Francisco, Brooklyn, and Austin (300 per city) with this distribution:

- 40% infrastructure
- 30% safety
- 20% vibe
- 10% opportunity

If AWS/Aurora variables are missing, it writes `scripts/generated-seed-reports.json` instead of failing.

## Environment

Copy `.env.example` to `.env` and fill in production credentials. The app is intentionally usable without credentials for local review.
