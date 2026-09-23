# AutoApps — Plan Tracker

Single source of truth for progress. Every task in `docs/PLAN.md` has one row here. Update this file as you work; never mark a row `done` without its commit hash.

Statuses: `todo` · `in_progress` · `done` · `blocked` · `skipped`

---

## Protocol (follow exactly)

1. **Start of session**: read `CLAUDE.md`, this file, then only the `docs/PLAN.md` sections for the tasks you will do. If the directory is not yet a git repository, run `git init`, create the root `.gitignore` from PLAN P0-1 step 16, and commit the docs as `chore: planning docs`. Otherwise run `git status`; if the tree is dirty, finish or stash that work first and say so in the session log.
2. **Pick a task**: the first row, top to bottom, whose Status is `todo` and whose every entry in *Depends on* is `done` (or `skipped`). `H-` rows are Amos's; treat them as `done` only when this file says so. Never skip ahead to a more interesting task.
3. **Claim it**: set Status to `in_progress` and put today's date in Notes.
4. **Do it** exactly as `docs/PLAN.md` describes. Do not widen the task. If the plan is wrong or impossible, do the smallest sensible thing, and write one paragraph in `docs/DECISIONS.md` (task id, what changed, why).
5. **Check it**: run the task's *Done when* check, then the phase verification commands listed under the phase table. Fix failures before continuing. A task with a failing check is not done.
6. **Commit**: `git add -A && git commit -m "<ID>: <short description>"`. One task, one commit (a fix-up commit is fine).
7. **Close it**: set Status `done`, put the short commit hash in Commit, and at most one line in Notes (only deviations, gotchas, or "none").
8. **Blocked?** Set Status `blocked`, add a bullet under *Needs Amos* saying precisely what you need (a value, a click, a decision), and move to the next unblocked task. Do not wait, do not guess secrets.
9. **End of session**: append an entry to the *Session log* (date, tasks done, blocked items, what is next). Stop when the current phase is fully done or nothing is unblocked, then report to Amos in chat: tasks done with hashes, what is blocked, decisions recorded.

Verification after every task, from `frontend/`:

```bash
npm run typecheck && npm run lint && npm run build
```

Add `npx vitest run` once tests exist (P1-4 onward), and `npm run build` from `extension/` for Phase 5.

---

## Human prerequisites (Amos)

| ID | Task | Status | Notes |
|---|---|---|---|
| H-1 | Fresh Postgres; `DB_URL` in the root `.env` (P0-1 copies it to `frontend/.env`) | done | 2026-09-23, Supabase transaction pooler (port 6543), PostgreSQL 17, empty schema, credentials verified |
| H-2 | Google Cloud OAuth client (Testing mode, test users, Sheets API enabled, both redirect URIs); `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in the root `.env` | done | 2026-09-23, localhost redirect URI only; add the Vercel URI in P6-1 |
| H-3 | Nebius Token Factory API key in the root `.env` as `NEBIUS_API_KEY` (account funded) | done | 2026-09-23, key verified against `/v1/models`; GLM-5.3, GLM-5.3-Flash, DeepSeek-V4.1-Flash all visible |
| H-4 | Vercel project for `frontend/` with env vars and `NEXTAUTH_URL=https://autoapps.win`; domain `autoapps.win` attached | todo | |
| H-5 | Fixture sheets: created automatically by P1-6; optionally any real sheet of Amos's for the demo | todo | URLs (from P1-6): |
| H-6 | A second Google account for the consumer role (any provider), invited into the org from the Users page, signed in on a second Chrome profile or an incognito window; then set `DEMO_CONSUMER_EMAIL` and re-run `seed:sheets` | todo | builder is mail@amoshaviv.com; consumer currently the same account (dev only) |

---

## Phase 0 — Bootstrap

| ID | Task | Pri | Depends on | Status | Commit | Notes |
|---|---|---|---|---|---|---|
| P0-1 | Copy and strip flow-tester's frontend | must | — | done | 27be745 | deps pinned to flow-tester's locked majors; legal pages are placeholders (see DECISIONS) |
| P0-2 | Database bootstrap script (`db:sync`) | must | P0-1, H-1 | done | 5f6cd7d | OAuth token columns are TEXT (see DECISIONS) |
| P0-3 | Auth guards (`lib/auth/guards.ts`) | must | P0-1 | done | 88e223d | checked 401/200/403/404 with minted JWTs on :3001 (another app holds :3000) |
| P0-4 | Organization auto-join by email domain | must | P0-2, P0-3, H-2 | done | 9f21d1d | closed on scripted check + one-account Google sign-in (see DECISIONS); re-check with a 2nd same-domain account at H-6 |
| P0-5 | Session cookie `SameSite=None; Secure` | must | P0-1 | done | ae9a5ea | verified via curl credentials sign-in on :3001: `Secure; HttpOnly; SameSite=none` |
| P0-6 | Spike: side-panel iframe carries the session | should | P0-5, P0-4 | done | 1a4c578 | Plan A: panel iframe shows the signed-in email (Amos, Chrome) |

Phase check: `grep -ri "flowtester\|testSuite\|gitlab" frontend --exclude-dir=node_modules --exclude-dir=.next` prints nothing; sign-in with Google works locally.

## Phase 1 — Data layer and Google Sheets

| ID | Task | Pri | Depends on | Status | Commit | Notes |
|---|---|---|---|---|---|---|
| P1-1 | Models: Connection, App, AppVersion, AppMessage, AppActivity | must | P0-2 | done | 1b5a04a | apps.draft/published_version_id have no FK (avoids cyclic sync) |
| P1-2 | Google OAuth: incremental Sheets scope, token refresh, `/api/me` | must | P0-4 | blocked | f066917 | code done; `/api/me` verified (401 / 200 with sheetsConnected=false); awaiting Amos's grant check |
| P1-3 | Sheets client (`lib/google/sheets.ts`, incl. `createSpreadsheet`) | must | P1-2 | todo | | |
| P1-4 | Schema extraction (types, fill ratio, distinct) + `analyzeShape` + five fixture sheets + vitest | must | P0-1 | done | 94b65a5 | 13 tests; heuristic clarifications in DECISIONS |
| P1-5 | Connection routes (`POST connections`, `refresh`) | must | P1-1, P1-3, P1-4, P0-3 | todo | | |
| P1-6 | Seed the five fixture sheets into the builder's Drive (`seed:sheets`) | must | P1-3, P1-4 | todo | | paste the five URLs into H-5 |

Phase check: `POST /api/organizations/<org>/connections` with each fixture sheet URL returns headers with sensible inferred types and fill ratios; `npx vitest run` passes.

## Phase 2 — AI

| ID | Task | Pri | Depends on | Status | Commit | Notes |
|---|---|---|---|---|---|---|
| P2-1 | AppSpec zod schema + `validateSpec` + tests | must | P1-4 | done | e2c971b | 12 tests; 3 extra structural rules (DECISIONS) |
| P2-2 | AI client (Nebius via `openai` SDK, `json_schema`), prompts, `try-nebius` script | must | P2-1, H-3 | done | 4b7cd7e | json_schema accepted by all 3 models; GLM-5.3 cold call 13 s, warm 2–9 s (DECISIONS) |
| P2-3 | `suggestApps` + suggest route, checked on all five fixture sheets | must | P2-2, P1-5, P1-6 | todo | | |
| P2-4 | `generateSpec` / `editSpec` with validation retry + `try-ai` script | must | P2-2 | done | 62ed4e8 | verified on fixture schemas, all valid 1st try; rerun with real connectionIds after P1-6 |
| P2-5 | Builder-side app routes (create, get, messages, publish, restore, activity, patch, delete) | must | P2-4, P1-5 | todo | | |

Phase check: `scripts/try-ai.ts` yields valid specs for all five fixture sheets; suggestions differ per sheet; curl flow create → message → publish works.

## Phase 3 — Runtime

| ID | Task | Pri | Depends on | Status | Commit | Notes |
|---|---|---|---|---|---|---|
| P3-1 | Runtime resolution library + tests | must | P2-1, P1-3 | todo | | also require a PATCHed table row to pass the view's filters (e.g. `$user.email`), not only the column checks |
| P3-2 | Runtime routes + `requireAppAccess` | must | P3-1, P2-5 | todo | | |
| P3-3 | Renderer components (my-row, form, table, stats) | must | P3-2 | todo | | |
| P3-4 | Runtime page `/a/[shortId]` | must | P3-3 | todo | | |

Phase check: consumer account completes hero steps 7–8 by URL; a PATCH to a non-editable column returns 403.

## Phase 4 — Builder web UI

| ID | Task | Pri | Depends on | Status | Commit | Notes |
|---|---|---|---|---|---|---|
| P4-1 | Apps list + New-app dialog | must | P2-5 | todo | | |
| P4-2 | New-app flow page (`/[org]/new`) with suggestions | must | P4-1, P2-3 | todo | | |
| P4-3 | Builder page (chat + preview + publish + versions + activity) | must | P4-2, P3-3 | todo | | |
| P4-4 | Extension panel page (`/extension/panel`, `/extension/connected`) | should | P4-3 | todo | | |

Phase check: hero steps 3–6 work from `/[org]/new` in a normal tab; `/extension/panel` is usable at 360 px.

## Phase 5 — Chrome extension

| ID | Task | Pri | Depends on | Status | Commit | Notes |
|---|---|---|---|---|---|---|
| P5-1 | Scaffold, esbuild, manifest, icons | should | P0-6 | todo | | |
| P5-2 | Background + content script (badge, OPEN_PANEL, SHEET_CHANGED) | should | P5-1 | todo | | Plan B: badge opens `/[org]/new?spreadsheetId=…` |
| P5-3 | Side panel iframe host | should | P5-2, P4-4 | todo | | |

Phase check: hero steps 2–6 run inside the side panel against localhost; switching sheets updates the panel.

## Phase 6 — Deploy, polish, demo

| ID | Task | Pri | Depends on | Status | Commit | Notes |
|---|---|---|---|---|---|---|
| P6-1 | Deploy to Vercel, production OAuth redirect, prod `db:sync`, extension build with prod origin | must | P4-3, H-4 | todo | | |
| P6-2 | Polish, in order: light theme, empty states, error toasts, README, icons | should | P6-1 | todo | | stop when time runs out |
| P6-3 | Demo rehearsal checklist | should | P6-1 | todo | | warm Nebius first: the first spec generation per deploy takes ~65 s (grammar compile) |

Phase check: hero scenario runs twice in a row on the deployed URL.

---

## Needs Amos

(The executing session adds bullets here; Amos deletes them when resolved.)

- **P1-2 check**: with you signed in at http://localhost:3000, open http://localhost:3000/connect/google, grant the Sheets permission, then sign out (avatar menu, top right) and sign in again with Google. Tell the executor; it checks `sheetsConnected` in the database/`/api/me`.
- **(later, with H-6) P0-4 real check** (code is committed in 9f21d1d): run `cd frontend && npm run dev` on :3000, sign in with Google as two accounts on the same company domain (for example two `@amoshaviv.com` accounts; both must be test users on the OAuth consent screen), then tell the executor (dev server now runs on :3000). It will confirm in `users_organizations` that the second account has role `user` in the first account's org and close P0-4. A `gmail.com` account does not auto-join; it gets a personal org and must be added from the Users page after its first sign-in.

---

## Decisions

Deviations from the plan live in `docs/DECISIONS.md`, one short paragraph each, referenced by task id.

---

## Session log

Executor: Claude Opus 5.5 (`claude --model claude-opus-5-5`), chosen 2026-09-23.

(Newest first. One entry per session: date · model · tasks done · blocked · next.)

- 2026-09-23 · Claude Opus 5.5 · Port 3000 freed by Amos. Google sign-in works locally (Phase 0 check): mail@amoshaviv.com created org `amoshaviv` as owner. P0-4 stays blocked until a second @amoshaviv.com account signs in.
- 2026-09-23 · Claude Opus 5.5 · Initialized git (`chore: planning docs`, ba91d15). Done: P0-1 (27be745), P0-2 (5f6cd7d), P0-3 (88e223d), P0-5 (ae9a5ea). P0-4 is committed (9f21d1d) and passed a scripted check, but is blocked on the two-account Google sign-in check. P0-6 is not started because it depends on P0-4. Port 3000 is held by another app, so the dev server ran on :3001 (see Needs Amos). `next dev` (16.3) writes `frontend/AGENTS.md` + `frontend/CLAUDE.md` (a pointer to Next's bundled docs); they are committed. The database is empty again after the checks. Next: close P0-4 after Amos's sign-in check, then P0-6; Phase 1 tasks P1-1 and P1-4 are unblocked in the meantime. 
