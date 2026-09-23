# AutoApps

Turn any Google Sheet into a small internal app your colleagues can use, by describing it in chat.

A builder opens a sheet, picks one of three suggested apps (or describes their own), tweaks it in a chat, and publishes a link. Colleagues open the link, sign in with their company Google account, and see only their part: their own row to fill in, a form to submit, a filtered board, or live totals. Every change lands in the sheet, and the builder sees who changed what.

Live at **https://www.autoapps.win**. Product and plan: [`docs/PRD.md`](docs/PRD.md), [`docs/PLAN.md`](docs/PLAN.md), progress in [`docs/TRACKER.md`](docs/TRACKER.md), deviations in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## How it works

- **Apps are JSON specs, not generated code.** An `AppSpec` (`frontend/lib/apps/spec.ts`) describes up to four views: *my row*, *form*, *table*, *stats*. They are rendered by a fixed set of React components. The model writes and edits specs; zod and `validateSpec` check every one against the sheet's real columns before it is stored.
- **Any sheet, no assumed column names.** `extractSchema` detects the header row, column types and fill ratios. `analyzeShape` derives hints: who a row belongs to, which columns are meant to be filled in, status and key columns. Those are the only inputs to suggestions.
- **The server enforces the spec.** Reads return only the columns a view shows. Writes are accepted only for the viewer's own row, editable columns, and rows inside the view's filters. Consumers never get access to the sheet: all reads and writes use the builder's Google credentials.
- **Organization-scoped.** Sign in with Google and you join the organization that owns your email domain.
- **Models:** Nebius Token Factory (OpenAI-compatible API) with schema-constrained JSON output. `zai-org/GLM-5.3` writes and edits specs; `zai-org/GLM-5.3-Flash` suggests apps.

## Repository

| Path | What |
|---|---|
| `frontend/` | Next.js 16 app (App Router, MUI 7, NextAuth, Sequelize on Postgres). Web UI, API, runtime. |
| `extension/` | Chrome extension (Manifest V3). Adds a badge to Google Sheets and opens a side panel with the web app's `/extension/panel`. |
| `docs/` | PRD, plan, tracker, decisions, demo checklist. |

## Run locally

Requirements: Node 24, a Postgres database, a Google OAuth client with the Sheets API enabled, and a Nebius Token Factory API key.

```bash
cd frontend
cp .env.example .env        # fill in the values (see below)
npm install
npm run db:sync             # creates the tables on a fresh database
npm run dev                 # http://localhost:3000
```

Checks (run after every change):

```bash
cd frontend && npm run typecheck && npm run lint && npm run build && npx vitest run
```

Useful scripts, all run from `frontend/` with `.env` loaded:

| Command | What it does |
|---|---|
| `npm run seed:sheets` | Creates the five fixture sheets (`tests/fixtures/sheets.ts`) in the builder's Google Drive |
| `node --env-file=.env --import tsx scripts/try-ai.ts fixture:budget "each owner fills their own line"` | Generates a spec from a fixture (or a connection id) and prints it |
| `node --env-file=.env --import tsx scripts/try-nebius.ts zai-org/GLM-5.3 high` | Checks the Nebius connection and structured output |
| `node --env-file=.env --import tsx scripts/try-sheets.ts` | Creates a scratch sheet and reads, writes and appends to it |

### Environment variables (`frontend/.env`)

| Variable | Purpose |
|---|---|
| `DB_URL` | Postgres connection string (SSL is used for any non-localhost host) |
| `NEXTAUTH_URL` | `http://localhost:3000` locally, `https://autoapps.win` in production |
| `NEXTAUTH_SECRET` | Session signing secret (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth client. Redirect URI: `<origin>/api/auth/callback/google`. Scopes: `openid email profile` plus `spreadsheets`, requested separately at `/connect/google` |
| `DEMO_BUILDER_EMAIL`, `DEMO_CONSUMER_EMAIL` | Accounts `seed:sheets` writes into the fixture sheets |
| `NEBIUS_API_KEY` | Nebius Token Factory key |
| `NEBIUS_MODEL`, `NEBIUS_MODEL_SUGGEST`, `NEBIUS_REASONING_EFFORT` | Model ids and effort (defaults: `zai-org/GLM-5.3`, `zai-org/GLM-5.3-Flash`, `high`) |
| `SES_FROM_EMAIL`, `AWS_REGION` | Optional: invite emails through Amazon SES |

Production (Vercel, root directory `frontend`, Framework Preset *Next.js*) uses the same variables with `NEXTAUTH_URL=https://autoapps.win`. Local and production share one database, so they must also share one Google OAuth client.

### Chrome extension

```bash
cd extension
npm install
npm run build                                    # → extension/dist, pointed at https://www.autoapps.win
APP_ORIGIN=http://localhost:3000 npm run build   # or at a local frontend
```

Load it in `chrome://extensions` → Developer mode → **Load unpacked** → `extension/dist`. Open any Google Sheet and click the "⚡ Build an app from this sheet" badge, or the AutoApps toolbar icon. `npm run icons` redraws the icons (extension and web app share one mark).

## Demo script (about two minutes)

1. Open the budget sheet in Google Sheets. The AutoApps badge appears; click it and the side panel opens.
2. The panel reads the sheet and suggests three apps. Pick **"each owner fills in their own line"**.
3. About 15 seconds later a preview appears: each owner sees their cost center, last year's number read-only, and Q1–Q4 plus Justification to fill in.
4. In the chat: *"Also show them last year's number as read-only and make Justification required."* The preview updates.
5. **Publish**, then **Copy link**.
6. In a second browser profile, open the link and sign in as a colleague on the same domain. They see only their line, fill it in and save.
7. Back in the sheet, the row is filled. The app's **Activity** tab shows who changed what.

The full rehearsal checklist is in [`docs/DEMO.md`](docs/DEMO.md).
