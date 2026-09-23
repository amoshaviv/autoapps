# AutoApps

Internal-app builder for non-technical people. v1: a Chrome extension plus a Next.js backend that turns a Google Sheet into a shareable, organization-scoped app described in chat.

**Read before doing anything:** `docs/TRACKER.md` (progress and the protocol you must follow), `docs/PLAN.md` (how, task by task), and `docs/PRD.md` (what and why). Pick tasks only through the tracker; each task ends with a "Done when" check, a commit, and a tracker update.

## Layout

- `frontend/` — Next.js 16 (App Router), MUI 7, NextAuth v4 (Google + credentials), Sequelize 6 on Postgres, `openai` SDK pointed at Nebius Token Factory. Copied from `../flow-tester/frontend` and stripped; that repo is read-only reference.
- `extension/` — Manifest V3 Chrome extension, TypeScript bundled with esbuild. It only opens a side panel that iframes `frontend`'s `/extension/panel`.
- `docs/` — `PRD.md`, `PLAN.md`, `TRACKER.md` (status of every task + protocol), `DECISIONS.md` (deviations, newest first).

## Commands

```bash
cd frontend && npm run dev          # http://localhost:3000
cd frontend && npm run typecheck && npm run lint && npm run build   # run after every task
cd frontend && npm run db:sync      # create tables on a fresh database
cd frontend && npx vitest run       # unit tests (schema, spec validation, runtime)
cd extension && npm run build       # → extension/dist, load unpacked in chrome://extensions
```

## Conventions

- Server pages: `getSession()` then `getDBModels()`; API routes: `handleRoute` + `requireUser` / `requireOrgMember` / `requireAppAccess` from `lib/auth/guards.ts`.
- Sequelize models use `underscored: true`, `associate()`, and static helpers on the model. No `sync()` outside `scripts/db-sync.ts`.
- Navigation uses `href` on MUI components (the theme's `LinkBehavior` maps to Next `Link`). Never `onClick` + `router.push`.
- The server enforces what an app may read or write from the stored `AppSpec`; the client is never trusted.
- Nothing may assume specific column names. Schema extraction and `analyzeShape` (PRD §9) are the only inputs to suggestions; every check runs on all five fixture sheets in `frontend/tests/fixtures/sheets.ts`.
- Model calls go to Nebius Token Factory (OpenAI-compatible, `https://api.tokenfactory.nebius.com/v1/`) through the `openai` package with `baseURL`. Models and `reasoning_effort` are in PRD §9 (`zai-org/GLM-5.3` for generation, `zai-org/GLM-5.3-Flash` for suggestions, env-overridable). Always set `reasoning_effort`, never `temperature`, always validate the JSON with zod.
- Secrets in `frontend/.env` only; `frontend/.env.example` lists every variable.
- Commit after every task with the task id (`P2-3: …`).
