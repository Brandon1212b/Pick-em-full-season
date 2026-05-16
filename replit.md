# NFL Pick'em League

A full-stack NFL Season-Long Pick'em League app where users submit predictions for all 18 weeks of the 2026-2027 season upfront, then track results live during the season.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/nfl-pickem run dev` — run the frontend (port 20657)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + shadcn/ui + Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contract
- `lib/db/src/schema/` — Drizzle table definitions (users, matches, picks, smackboard, season_config)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/nfl-pickem/src/pages/` — React pages (login, picks, dashboard, leaderboard, admin)
- `artifacts/nfl-pickem/src/lib/auth.tsx` — Auth context (localStorage-based, name-only login)

## Architecture decisions

- Name-only authentication: users log in by name only, stored in localStorage. No passwords or sessions.
- Pre-season lock: all 288 games across 18 weeks seeded upfront. Season mode toggle in admin locks all picks.
- Lock of the Week: one special pick per week worth 2 points if correct, 0 if wrong. One lock per week enforced at API level.
- Scoring: correct pick = 1 point, correct Lock = 2 points, wrong Lock = 0 points. Recalculated server-side when admin sets winners.
- Admin at `/admin` (hidden route) — commissioner sets match results and toggles season mode.

## Product

- **Login**: Enter name to join or return. No password needed.
- **The Grid** (`/picks`): Full 18-week schedule, pick winners, set locks, autofill, save all picks before season starts.
- **Dashboard** (`/dashboard`): Current week view with pick result status, plus Smack Board chat.
- **Leaderboard** (`/leaderboard`): Ranked standings with badges, cumulative trends chart, pick popularity breakdown.
- **Admin** (`/admin`): Set match winners, toggle season mode, send Discord/Slack webhook notifications.

## User preferences

- iOS / Apple Health aesthetic: soft gray backgrounds, iOS blue (#007AFF), white cards, 16px radius, system fonts
- No passwords, emails, or sign-up hurdles

## Gotchas

- After schema changes: run `pnpm --filter @workspace/db run push` then `pnpm run typecheck:libs`
- After OpenAPI changes: run `pnpm --filter @workspace/api-spec run codegen`
- Admin panel is at `/admin` — not linked from nav intentionally
- Smack Board polls every 15 seconds on the dashboard page

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
