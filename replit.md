# College Placement Drive & Student Application Tracker

A placement cell management system for coordinators to track company drives, student applications, pipeline stages, and ML-predicted at-risk cases.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/placement-tracker run dev` — run the React frontend (port 23301)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `python3 ml-service/predict.py` — run ML predictions manually (also triggerable via POST /api/predictions/run)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifacts/placement-tracker)
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- ML: Python 3 + scikit-learn (RandomForestClassifier)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/applications.ts` — applications table schema
- `lib/db/src/schema/predictions.ts` — ML predictions table schema
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/placement-tracker/src/` — React frontend pages and components
- `ml-service/predict.py` — scikit-learn prediction script (called by API)
- `ml-service/requirements.txt` — Python dependencies

## Architecture decisions

- OpenAPI-first: all API types are generated via Orval; no hand-written types for API shapes
- ML predictions run as a Python child process spawned by the Node.js API server (POST /api/predictions/run)
- Date columns use Drizzle `date(..., { mode: "string" })` and are stored/returned as YYYY-MM-DD strings; Orval coerces `format: date` to `Date` objects, so conversion happens in route handlers
- `numeric` Drizzle columns (package, cgpa, confidence) come back as strings from pg-node and are coerced to numbers in route response mappers
- ML model features: stage (ordinal), days since drive, CGPA, branch, company drive count — deliberately excludes offer_status and package (outcome fields not known at prediction time)

## Product

- **Dashboard** — live stats (applications, offers, offer rate, avg package), pipeline funnel chart, company breakdown table, recent activity feed
- **Applications** — searchable/filterable list; create new application via form; detail/edit view per application
- **Companies** — per-company summary of drives, application counts, offer rates, avg package
- **Predictions** — ML risk classification (Low/Medium/High) per application; confidence below 0.6 shows "Low confidence — no forced prediction"; re-run button triggers retraining

## Dataset

104 seeded records across 20 companies over 90 days. Includes deliberate edge cases:
- Two similar student names: "Arjun Kumar" and "Arjun K."
- Very similar name: "Arun Kumar"
- Missing CGPA on one student
- Orphan record: student "Test Student" / "Unknown Corp" with no related records

## User preferences

_Populate as you build._

## Gotchas

- After OpenAPI spec changes, always run `pnpm --filter @workspace/api-spec run codegen` before touching backend or frontend code
- Python ML service requires `scikit-learn`, `psycopg2-binary`, `numpy` (installed via uv in `.pythonlibs/`)
- Numeric db columns (package, cgpa, confidence) are returned as strings by node-postgres; always wrap with `Number(...)` in response mappers
- Drizzle `date` columns with `mode: "string"` require YYYY-MM-DD strings; convert `Date` objects with `.toISOString().split('T')[0]`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
