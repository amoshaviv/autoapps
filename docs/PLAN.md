# AutoApps — Execution Plan

Companion to `docs/PRD.md`. Read the PRD first; this file says how to build it, in order.

Audience: the Claude Code session that implements this. Work top to bottom. Each task lists the files it touches, the steps, and a **Done when** check. Do not start a task before the previous task's check passes.

---

## 0. How to work

- **Track progress in `docs/TRACKER.md`.** Its protocol decides which task is next and how a task is claimed, checked, committed, and closed. This file only says how to do each task.
- **Scope discipline.** Build what a task says, nothing more. If the PRD and this plan disagree, the plan wins for *what to build now*; the PRD wins for *what it should mean*. Do not add features from PRD §15.
- **Verify after every task**: from `frontend/` run `npm run typecheck && npm run lint && npm run build`. From `extension/` run `npm run build`. Fix errors before moving on.
- **Commit after every task** with the task id in the message, e.g. `P2-3: generateSpec with validation retry`. Commit on `main`; this is a hackathon repo.
- **Reference code lives at `../flow-tester/frontend`** (do not modify it). When a task says "inherited", copy the file from there and adapt. Patterns to keep: server pages that call `getSession()` then `getDBModels()`; API routes that call `getToken({ req })` then `User.findByEmail`; MUI with the theme's `LinkBehavior`; `underscored: true` Sequelize models with `associate()` and static helpers.
- **Links are links.** Use `href` on MUI `Button`/`Link`/`MenuItem`; never `onClick` + `router.push` for navigation.
- **Before writing any model-calling code** (Phase 2), read PRD §9. The provider is Nebius Token Factory through the `openai` npm package with a custom `baseURL`; there is no Nebius TypeScript SDK and no Anthropic SDK in this project. Use the model ids from PRD §9 verbatim, always pass `reasoning_effort` explicitly (GLM-5.3 defaults to `max`, which is slow), and never pass `temperature`.
- **Secrets** live in `frontend/.env` (git-ignored). Never commit them. `.env.example` lists every variable with a placeholder.
- **When blocked** on something only a human can do (Google Cloud console, Vercel, a browser check), stop, say exactly what is needed, and continue with the next task that does not depend on it.
- **Do not** run `sequelize.sync({ force: true })` against a database you did not create in this session.

---

## 1. Repository layout (target)

```
AutoApps/
  CLAUDE.md                 conventions + pointers (exists)
  docs/PRD.md, docs/PLAN.md
  frontend/                 Next.js 16 app (copied from ../flow-tester/frontend, stripped)
    app/
      (legal)/              inherited
      authentication/       inherited (Google + credentials)
      [organizationSlug]/   apps list, apps/[appSlug] builder, users, settings, new
      a/[shortId]/          runtime
      extension/panel/      compact builder for the side panel
      connect/google/       incremental Sheets auth
      api/…                 see PRD §11
      components/           inherited pieces + new: apps/, runtime/, builder/
    lib/
      sequelize/            connection + models
      next-auth/            auth options
      auth/guards.ts        requireUser, requireOrgMember, requireAppAccess
      google/               oauth.ts (token refresh), sheets.ts (Sheets v4 client), schema.ts (header detection, type inference)
      apps/                 spec.ts (zod), validate.ts, runtime.ts (resolve rows, filters, metrics, write checks), slugs.ts
      ai/                   client.ts, prompts.ts, suggest.ts, generate.ts
      email.ts              inherited (SES invites)
    scripts/db-sync.ts      creates tables on a fresh DB
    theme.ts, proxy.ts, next.config.mjs, .env.example
  extension/                Manifest V3, TypeScript, esbuild
    manifest.json, src/background.ts, src/content.ts, src/sidepanel.ts, sidepanel.html, icons/
```

---

## 2. Human prerequisites (do these in parallel with Phase 0)

Owner: Amos. The implementer cannot do these.

Put every secret in a `.env` file at the repository root (`AutoApps/.env`, git-ignored); task P0-1 copies it to `frontend/.env`.

1. **Postgres**: a fresh database (Neon, RDS, or local). `DB_URL=postgres://…`.
2. **Google Cloud project** with the **Google Sheets API** enabled.
   - OAuth consent screen: External, **Testing** mode. Add every demo Google account as a test user. Scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/spreadsheets`.
   - OAuth client (Web application). Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://<vercel-domain>/api/auth/callback/google`.
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
3. **Nebius Token Factory API key** (https://tokenfactory.nebius.com → API keys) as `NEBIUS_API_KEY`. The account needs a positive balance; a few dollars covers the hackathon.
4. **Vercel** project pointing at `frontend/` (Phase 6), with the domain `autoapps.win` attached. Set the same env vars there plus `NEXTAUTH_URL=https://autoapps.win`. The root `.env` keeps `NEXTAUTH_URL=http://localhost:3000` for local development.
5. **Test sheets**: task P1-6 creates five fixture sheets of different shapes in the builder's Google Drive automatically, so nothing needs to be built by hand. If you want a real sheet of your own in the demo, any sheet works; just open it.
6. Two Chrome profiles (builder, consumer) signed into the two demo Google accounts.

---

## Phase 0 — Bootstrap (target: 3 h)

### P0-1 Copy and strip flow-tester's frontend

Files: everything under `frontend/`.

Steps:
1. `cp -R ../flow-tester/frontend ./frontend`, then delete `node_modules`, `.next`, `package-lock.json`, `tsconfig.tsbuildinfo`, `.env.development`.
2. Delete these directories and files entirely:
   - `app/(articles)`, `app/landing`, `app/dashboard`, `app/shared`, `app/profile` (keep if trivial to fix; otherwise delete), `app/sitemap.ts`
   - `app/[organizationSlug]/projects`, `app/[organizationSlug]/billing`
   - `app/api/git`, `app/api/public`, `app/api/webhooks`, `app/api/organizations/[organizationSlug]/billing`, `app/api/organizations/[organizationSlug]/projects`
   - `app/components/test-run`, `components/LowBalanceWarning.tsx`
   - `lib/ai.ts`, `lib/billing`, `lib/stripe.ts`, `lib/run-helpers.ts`, `lib/webhooks`, `lib/s3.ts`
   - `lib/sequelize/models/`: `automation*.ts`, `billing-*.ts`, `credential.ts`, `organization-analysis.ts`, `project.ts`, `test*.ts`
   - `types/models.ts`, `types/test.ts`
   - `public/` assets that mention FlowTester (keep `favicon.ico`, replace later)
3. `lib/sequelize/models/index.ts`: keep only `User`, `Organization`, `UsersOrganizations`, `Invite`, `ResetPasswordToken`. Remove the deleted models from `IModels` and `defineModels`.
4. `lib/sequelize/models/organization.ts`: remove the `Project`/`OrganizationAnalysis` associations and `getProjects`/`getAnalyses`. Remove `balance` and `stripeCustomerId` fields.
5. `lib/sequelize/models/users-organizations.ts`: remove `Tester` from `UserRole`. `invite.ts`: role `isIn` becomes `["owner","admin","user"]`.
6. `lib/next-auth/index.ts`: remove the GitHub and GitLab providers, every `Project`/`OrganizationAnalysis`/`runWebsiteAnalysis` reference, and the `lastProject` cookie. Keep `lastOrganization`. (Domain auto-join is P0-4; token handling is P1-2.)
7. `app/authentication/signin/page.tsx` and `signup/page.tsx`: remove GitHub/GitLab buttons.
8. `app/components/layout/NavBar.tsx`: remove project navigation; keep org menu, user menu, sign-out. Brand text "AutoApps".
9. `app/layout.tsx`: metadata for AutoApps (title "AutoApps", one-line description, no FlowTester URLs).
10. `app/page.tsx`: signed-out → simple landing (one headline, one paragraph, "Sign in with Google" button linking to `/authentication/signin`); signed-in → redirect to `/${firstOrg.slug}`.
11. `app/[organizationSlug]/page.tsx`: placeholder "Apps" heading (real list in P4-1).
12. `proxy.ts`: matcher `["/authentication/:path*", "/a/:path*", "/extension/:path*"]`; signed-out users hitting `/a/*` or `/extension/*` are redirected to `/authentication/signin?callbackUrl=<original>`. Org pages keep doing their own `getSession()` check and redirect, as flow-tester's pages already do. Keep the existing "signed-in user on `/authentication/*` → `/`" redirect (it must skip `/authentication/reset-password` if that page is kept).
13. `package.json`: name `autoapps-frontend`; scripts `dev`, `build`, `start`, `lint` (`eslint .`, copy `eslint.config.mjs` from `../Podcust/frontend`), `typecheck` (`tsc --noEmit`), `db:sync` (`node --env-file=.env --import tsx scripts/db-sync.ts`). Dependencies: remove `stripe`, `hls.js`, `@aws-sdk/client-s3`, `@aws-sdk/client-sqs`, `@google/genai`, `recharts`. Remove `@anthropic-ai/sdk`. Add `openai` (latest), `zod` (v4, for `z.toJSONSchema`), `nanoid`, `tsx` (dev).
14. If a `.env` file exists at the repository root (Amos puts secrets there before `frontend/` exists), copy it to `frontend/.env`. Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32` if it is missing. Then `npm install`.
15. Write `.env.example` with: `DB_URL`, `NEXTAUTH_URL=http://localhost:3000`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DEMO_BUILDER_EMAIL`, `DEMO_CONSUMER_EMAIL`, `NEBIUS_API_KEY`, `NEBIUS_MODEL=zai-org/GLM-5.3`, `NEBIUS_MODEL_SUGGEST=zai-org/GLM-5.3-Flash`, `NEBIUS_REASONING_EFFORT=high`, `SES_FROM_EMAIL` (optional), `AWS_REGION` (optional).
16. Write `.gitignore` at the repo root (`node_modules`, `.next`, `.env`, `*.tsbuildinfo`, `.DS_Store`, `extension/dist`) and `git init` if not already a repo.

Done when: `npm run typecheck && npm run lint && npm run build` pass with no references to tests, projects, billing, GitHub, or GitLab (`grep -ri "flowtester\|testSuite\|gitlab" frontend --exclude-dir=node_modules --exclude-dir=.next` returns nothing).

### P0-2 Database bootstrap script

Files: `frontend/scripts/db-sync.ts`.

Steps: connect via `getDBConnection()` from `lib/sequelize`, call `db.sync()` (no `force`, no `alter`), log the table names, exit 0. Refuse to run if `NODE_ENV === "production"` unless `--yes` is passed.

The database is Supabase's transaction pooler (port 6543, PgBouncer-style). In `lib/sequelize/index.ts` add `dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }` whenever `DB_URL` does not point at `localhost`, keep `pool: { max: 5 }`, and do not use named prepared statements (Sequelize's defaults are fine). Also set `logging: false` unless `DB_LOGGING=true`; flow-tester logs every query.

Done when: `npm run db:sync` against the fresh database creates `users`, `organizations`, `users_organizations`, `invites`, `reset_password_tokens`.

### P0-3 Auth guards

Files: `frontend/lib/auth/guards.ts`.

```ts
export async function requireUser(request: NextRequest): Promise<IUserInstance>            // throws HttpError(401)
export async function requireOrgMember(request, organizationSlug, minRole: "user"|"admin"|"owner" = "user")
  : Promise<{ user, organization, role }>                                                 // 401 / 403 / 404
export class HttpError extends Error { constructor(public status: number, message: string, public code?: string) }
export function handleRoute(fn): RouteHandler   // wraps a handler, converts HttpError → NextResponse.json({error, code}, {status}), logs others as 500
```

Role order: `user < admin < owner`. Every new API route uses `handleRoute`.

Done when: a throwaway route returns 401 signed out and 200 signed in (delete it after).

### P0-4 Organization auto-join by email domain

Files: `frontend/lib/next-auth/index.ts`, `frontend/lib/sequelize/models/organization.ts`.

Steps:
1. Add `Organization.findByDomain(domain)`.
2. Extract the "create user + org" logic used by both the credentials `authorize` and the OAuth `signIn` callback into one function `ensureUserAndOrganization({ email, displayName, image, account? })` in `lib/next-auth/onboarding.ts`.
3. In it: if `getOrganizationInfoFromEmail` says company email and `findByDomain` returns an org → `addUserToOrganization(org, user, "user")`. Otherwise create the org as today (creator becomes `owner`). Invite-token flow stays as is and takes precedence.
4. `lastOrganization` cookie set to the joined/created org slug.

Done when: sign in with two Google accounts on the same company domain; the second lands in the first's organization as `user` (check `users_organizations`).

### P0-5 Session cookie usable inside an iframe

Files: `frontend/lib/next-auth/index.ts`, `frontend/next.config.mjs`.

Steps:
1. In `authOptions.cookies.sessionToken.options` set `{ httpOnly: true, sameSite: "none", secure: true, path: "/" }`. Keep the cookie name NextAuth would use (`__Secure-next-auth.session-token` when `NEXTAUTH_URL` is https, `next-auth.session-token` otherwise). Chrome accepts `Secure` cookies from `http://localhost`.
2. Do the same for `callbackUrl` and `csrfToken` cookies.
3. Make sure nothing sends `X-Frame-Options` or a `frame-ancestors` directive for `/extension/*` (Next.js sends neither by default; do not add a CSP header just for this). The side panel is an extension page, so framing must stay allowed.

Done when: after signing in at `http://localhost:3000`, DevTools shows the session cookie with `SameSite=None; Secure`.

### P0-6 Spike: side-panel iframe carries the session

Files: `extension/` skeleton (manifest, `sidepanel.html` with an iframe to `http://localhost:3000/extension/panel`, empty background). `frontend/app/extension/panel/page.tsx` temporarily renders the signed-in email or "signed out".

Steps: `npm run build` in `extension/`, load `extension/dist` unpacked in Chrome (`chrome://extensions` → Developer mode → Load unpacked), open the side panel from the action icon.

Done when: the panel shows the signed-in email. If it shows "signed out" after P0-5 is confirmed, record the finding in `docs/DECISIONS.md` and switch the extension to **Plan B**: the badge and action open `http://localhost:3000/{org}/new?spreadsheetId=…&gid=…` in a new tab, and P5 shrinks accordingly.

---

## Phase 1 — Data layer and Google Sheets (target: 4 h)

### P1-1 Models

Files: `frontend/lib/sequelize/models/connection.ts`, `app.ts`, `app-version.ts`, `app-message.ts`, `app-activity.ts`, `index.ts`, `organization.ts` (add `hasMany(App)`, `hasMany(Connection)`).

Follow PRD §10 exactly. Static helpers to implement:

- `Connection.findOrCreateForSheet(organization, ownerUser, spreadsheetId)`
- `App.createDraft({ organization, connection, user, name, spec, summary })` → creates app + version 1 + sets `draftVersionId`
- `App.findBySlugInOrg(organizationSlug, appSlug)`, `App.findByShortId(shortId)` (includes organization + connection)
- `App.prototype.addVersion(spec, summary, user)` → next `number`, sets `draftVersionId`
- `App.prototype.publish()` → `publishedVersionId = draftVersionId`, `status = "published"`
- `App.prototype.canEdit(user, role)` → creator or role ≥ admin
- `AppActivity.record({ app, user, action, rowNumber, changes })`

`short_id`: `nanoid(10)` from `nanoid` with the default alphabet minus `-` and `_` (use `customAlphabet`). `slug`: `kebabCase(name)` with the same unique-suffix loop flow-tester used for projects, scoped to the organization.

Done when: `npm run db:sync` creates the five new tables and `typecheck` passes.

### P1-2 Google OAuth: incremental Sheets scope and token refresh

Files: `frontend/lib/google/oauth.ts`, `frontend/lib/next-auth/index.ts`, `frontend/lib/sequelize/models/user.ts`, `frontend/app/connect/google/page.tsx`.

Steps:
1. `user.ts`: replace the GitLab `refreshAccessToken` with a Google one: `POST https://oauth2.googleapis.com/token` (`client_id`, `client_secret`, `refresh_token`, `grant_type=refresh_token`) → update `providerAccessToken` and `providerAccessTokenExpiredAt` (Google does not return a new refresh token). Add `user.hasSheetsScope()` = `providerAccessTokenPermissions` includes `auth/spreadsheets` **and** `providerRefreshToken` is set.
2. `lib/google/oauth.ts`: `getAccessTokenForUser(user)` → refresh when `providerAccessTokenExpiredAt` is within 60 s; throw `HttpError(428, "Connect Google Sheets first", "sheets_not_connected")` when `hasSheetsScope()` is false.
3. `next-auth/index.ts` `signIn` callback, Google branch: **only** overwrite `providerRefreshToken` / `providerAccessTokenPermissions` when `account.refresh_token` is present; always update `providerAccessToken` and `providerAccessTokenExpiredAt`. Merge scopes (union of old and new) so a plain sign-in never narrows them.
4. `app/connect/google/page.tsx` (client component): on mount calls `signIn("google", { callbackUrl }, { scope: "openid email profile https://www.googleapis.com/auth/spreadsheets", access_type: "offline", prompt: "consent", include_granted_scopes: "true" })`. `callbackUrl` from the query string, default `/`.
5. `GET /api/me` (`app/api/me/route.ts`): `{ user: { email, displayName, profileImageURL }, organizations: [{ slug, name, role }], sheetsConnected }`.

Done when: visit `/connect/google`, grant, then `GET /api/me` returns `sheetsConnected: true`; sign out and sign in plainly; `/api/me` still says `true`.

### P1-3 Sheets client

Files: `frontend/lib/google/sheets.ts`.

Raw `fetch` against `https://sheets.googleapis.com/v4`, no `googleapis` package. Functions (all take an access token first):

```ts
getSpreadsheet(token, spreadsheetId)                         // title + sheets[{sheetId, title, rowCount, columnCount}]  (fields=properties.title,sheets.properties)
getValues(token, spreadsheetId, sheetTitle, a1Range?)        // string[][] via values/{range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE (what users see)
appendRow(token, spreadsheetId, sheetTitle, values: string[])// values/{sheet}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS → returns updated range → parse row number
updateCells(token, spreadsheetId, sheetTitle, rowNumber, cells: {columnIndex: number, value: string}[])  // one values:batchUpdate with one range per cell, USER_ENTERED
columnLetter(index0)                                          // 0 → A, 26 → AA
parseSpreadsheetUrl(url) → { spreadsheetId, gid? }
```

Errors: non-2xx → `HttpError(502, "Google Sheets error: <message>")`, except 401/403 → `HttpError(428, …, "sheets_not_connected")`. A 10-second in-memory cache keyed by `spreadsheetId + sheetTitle` for `getValues`; `appendRow`/`updateCells` invalidate it.

Add `createSpreadsheet(token, title, sheetTitle, values)` here too (`POST /v4/spreadsheets`, then a `values/{range}?valueInputOption=USER_ENTERED` PUT), returning `{ spreadsheetId, url }`.

Done when: a throwaway script creates a scratch spreadsheet named `AutoApps scratch` with three rows, reads it back, writes `"test"` into an empty cell, clears it, and prints the URL. No pre-existing sheet is needed.

### P1-4 Schema extraction

Files: `frontend/lib/google/schema.ts`.

`extractSchema(values: string[][], sheetTitle, headerRowOverride?) → ConnectionSchema` (shape in PRD §10):
- Header row detection: first row where ≥ 50 % of cells are non-empty strings and none parses as a number; fallback row 1.
- Headers: trimmed text; empty headers become `Column C` style names (by letter). Duplicate headers get ` (2)`.
- Per column, over all data rows: `fillRatio` (non-empty / rowCount, 2 decimals) and `distinctCount` (distinct non-empty values, capped at 1000).
- Inferred type per column from the next 50 rows: `email` (≥ 80 % contain `@`), `number`/`currency` (≥ 80 % numeric; currency if `$`/`€`/`£` present), `date` (≥ 80 % parse as dates), `checkbox` (`TRUE`/`FALSE`), `select` (≤ 8 distinct non-empty values and ≥ 10 rows), else `text` (`longtext` if median length > 60).
- Five sample rows and `rowCount` (non-empty rows after the header).

Also `lib/apps/shape.ts`: `analyzeShape(schema) → ShapeHints` exactly as PRD §9 "Reading any sheet" defines (identityCandidates, fillInCandidates, statusColumns, dateColumns, numericColumns, keyCandidates, looksLikeLog, rowCount, emptyColumnCount). Pure function, no I/O.

Fixtures in `frontend/tests/fixtures/sheets.ts`: five sheets as `string[][]`, each 12–25 rows, deliberately different shapes:

| Fixture | Headers | Shape it exercises |
|---|---|---|
| `budget` | Cost Center, Owner Email, FY2026 Actual, Q1, Q2, Q3, Q4, Justification, Status | identity by email, empty fill-in columns, numeric, status |
| `tasks` | Task, Assignee, Due Date, Priority, Status, Notes | identity by name, dates, select columns, many rows |
| `inventory` | SKU, Item, Category, Quantity, Reorder Level, Location, Last Counted | no identity column, numeric, key column |
| `rsvp` | Timestamp, Name, Email, Attending?, Dietary needs, Plus one | log-like, checkbox, form archetype |
| `headcount` | Employee, Manager Email, Department, Start Date, Level, Salary Band, Onboarding Complete | identity via manager email, checkbox, stats |

`fixtures/sheets.ts` exports each as `{ title, values }` so P1-6 can create them as real sheets.

Done when: `frontend/tests/schema.test.ts` (vitest, copy config from `../Podcust/frontend/vitest.config.ts`) runs `extractSchema` and `analyzeShape` over all five fixtures and asserts, per fixture, the header row, at least three inferred types, the fill ratios of two columns, and the expected identity candidates (`budget` → Owner Email; `tasks` → Assignee; `inventory` → none; `rsvp` → Email; `headcount` → Manager Email). `npx vitest run` passes.

### P1-5 Connection routes

Files: `frontend/app/api/organizations/[organizationSlug]/connections/route.ts`, `…/connections/[connectionId]/refresh/route.ts`.

- `POST connections`: body `{ spreadsheetUrl?, spreadsheetId?, gid? }`. `requireOrgMember`. `getAccessTokenForUser(user)` (428 if not connected). `getSpreadsheet` → pick the tab whose `sheetId === gid` or the first. `getValues` for that tab → `extractSchema`. `findOrCreateForSheet` then update `title`, `sheets`, `schema`, `schemaFetchedAt`. Respond `{ connection, apps }` where `apps` are this org's apps on this connection.
- `POST refresh`: `{ sheetTitle?, headerRow? }` re-extracts.

Done when: `curl` with the session cookie returns a fixture sheet's headers with sensible inferred types and fill ratios.

### P1-6 Seed fixture sheets in Google Drive

Files: `frontend/scripts/seed-sheets.ts` (uses `createSpreadsheet` from P1-3).

`npm run seed:sheets` (emails from `DEMO_BUILDER_EMAIL` and `DEMO_CONSUMER_EMAIL` in `.env`, overridable as two positional args): loads the builder user by email, gets an access token (428 → tell the user to visit `/connect/google`), and creates one spreadsheet per fixture from `tests/fixtures/sheets.ts`, substituting `<consumerEmail>` into the identity column of two rows per sheet (Owner Email, Email, Manager Email) and `<builderEmail>` into one row. Prints each spreadsheet URL. Re-running creates new sheets; say so in the output.

Done when: five sheets exist in the builder's Drive and their URLs are pasted into the H-5 row of `docs/TRACKER.md`.

---

## Phase 2 — AI (target: 4 h)

Read PRD §9 first. The provider is Nebius Token Factory (OpenAI-compatible); the model ids and `reasoning_effort` settings there are the defaults for the env vars.

### P2-1 Spec schema and validation

Files: `frontend/lib/apps/spec.ts` (zod schema + inferred TS type, exactly PRD §6), `frontend/lib/apps/validate.ts`.

`validateSpec(spec, schema: ConnectionSchema) → { ok: true } | { ok: false, errors: string[] }` implementing every rule in PRD §6 with human-readable messages ("View 1 references column 'Ownr Email' which does not exist. Available: …").

Done when: `frontend/tests/spec.test.ts` covers one valid spec and each rule's failure.

### P2-2 AI client and prompts

Files: `frontend/lib/ai/client.ts`, `frontend/lib/ai/prompts.ts`, `frontend/scripts/try-nebius.ts`.

- `client.ts`: one `OpenAI` instance from the `openai` package with `baseURL: "https://api.tokenfactory.nebius.com/v1/"` and `apiKey: process.env.NEBIUS_API_KEY`. Constants from env with defaults: `MODEL = process.env.NEBIUS_MODEL ?? "zai-org/GLM-5.3"`, `MODEL_SUGGEST = process.env.NEBIUS_MODEL_SUGGEST ?? "zai-org/GLM-5.3-Flash"`, `REASONING_EFFORT = process.env.NEBIUS_REASONING_EFFORT ?? "high"`. One helper:

  ```ts
  callStructured<T>(args: {
    model: string; system: string; messages: { role: "user" | "assistant"; content: string }[];
    schema: z.ZodType<T>; schemaName: string; reasoningEffort: "none" | "low" | "medium" | "high";
  }): Promise<{ data: T; usage: unknown; ms: number }>
  ```

  Inside: `jsonSchema = z.toJSONSchema(schema)`; system prompt = `system` + "\n\nReturn only a JSON object matching this schema:\n" + `JSON.stringify(jsonSchema)`; call `client.chat.completions.create({ model, messages, response_format: { type: "json_schema", json_schema: { name: schemaName, schema: jsonSchema, strict: true } }, reasoning_effort, max_completion_tokens: 24000 })`. If the API answers 400 and the message mentions `response_format` or `json_schema`, retry once with `response_format: { type: "json_object" }` and `console.warn`. Then: `finish_reason === "length"` → `HttpError(502, "Model output was cut off")`; take `choices[0].message.content`, strip a leading/trailing ```json fence if present, `JSON.parse`, `schema.safeParse`; on failure `HttpError(502, "Model returned invalid JSON: <first zod issue>")`. Log elapsed ms, `usage.completion_tokens`, and `usage.completion_tokens_details?.reasoning_tokens`. Never read or forward `reasoning_content`.
- `prompts.ts`: `describeSchema(connection)` renders the schema as compact markdown (title, tab, row count, one line per header: name, inferred type, fill ratio, distinct count, three samples) followed by the `analyzeShape` hints as a short bullet list. System prompts for suggest/generate/edit state the archetype rules and prompting rules from PRD §9 verbatim, and the suggest prompt requires three distinct archetypes.
- `scripts/try-nebius.ts` (`node --env-file=.env --import tsx scripts/try-nebius.ts [modelId]`): calls `callStructured` with a toy schema `{ greeting: string, number: number }` and prints data, usage, and ms. Run it for `zai-org/GLM-5.3`, `zai-org/GLM-5.3-Flash`, and `deepseek-ai/DeepSeek-V4.1-Flash` (with `reasoning_effort: "none"` for the last) and record in `docs/DECISIONS.md` whether `json_schema` was accepted or the `json_object` fallback fired, plus latency for each.

Done when: `typecheck` passes and `try-nebius` prints a valid object for `zai-org/GLM-5.3` and `zai-org/GLM-5.3-Flash` in under 10 s each.

### P2-3 suggestApps

Files: `frontend/lib/ai/suggest.ts`, `frontend/app/api/organizations/[organizationSlug]/connections/[connectionId]/suggest/route.ts`.

Output zod: `{ ideas: z.array(Idea).length(3) }`, `Idea = { title, pitch, archetype: enum(my-row, form, table, stats, mixed), identityColumn?: string }`. Model `MODEL_SUGGEST`, `reasoningEffort: "low"`.

Done when: run against all five seeded fixture sheets (P1-6), each returns three ideas with three distinct archetypes, and the identity-bearing sheets (`budget`, `tasks`, `rsvp`, `headcount`) include a `my-row` idea naming the right identity column while `inventory` does not. Record the five outputs in `docs/DECISIONS.md` briefly (one line per sheet) so prompt changes can be compared later.

### P2-4 generateSpec and editSpec with retry

Files: `frontend/lib/ai/generate.ts`.

```ts
generateSpec({ connection, idea?, prompt?, organizationName }) → { spec, summary }
editSpec({ connection, currentSpec, history: {role, content}[], message })   → { spec, summary }
```
Both: call → `validateSpec` → on errors, append a user message "The spec failed validation:\n- …\nFix these and return the full spec." and call once more → if still failing throw `HttpError(422, errors.join("\n"), "invalid_spec")`. Model `MODEL`, `reasoningEffort: REASONING_EFFORT`. Log elapsed ms, completion tokens, and reasoning tokens per call. If a generation on a fixture sheet takes over 20 s, set `NEBIUS_REASONING_EFFORT=low` in `.env` and `.env.example` and note it in `docs/DECISIONS.md`.

Done when: `frontend/scripts/try-ai.ts` (`node --env-file=.env --import tsx scripts/try-ai.ts <connectionId> "<prompt>"`) prints a valid spec for each of the five fixture sheets with a prompt that fits it (`budget`: "each owner fills their own line"; `tasks`: "a board where each assignee updates status"; `inventory`: "a table with low-stock filter and totals"; `rsvp`: "a sign-up form"; `headcount`: "managers confirm onboarding for their reports"), and every spec passes `validateSpec` on the first or second attempt.

### P2-5 App routes (builder side)

Files: `frontend/app/api/organizations/[organizationSlug]/apps/route.ts`, `…/apps/[appSlug]/route.ts`, `…/messages/route.ts`, `…/publish/route.ts`, `…/versions/[versionId]/restore/route.ts`, `…/activity/route.ts`.

Implement PRD §11 builder table. `POST apps`: name comes from `spec.title`; store the user's request as the first `app_messages` row and the summary as the assistant reply linked to version 1. `POST messages`: `editSpec` with the last 10 messages; store both messages; new version. Edit/publish/delete/activity require `app.canEdit(user, role)`.

Done when: with `curl`, create an app from the demo connection, send one edit message, publish, and `GET apps/[slug]` shows two versions and `publishedVersionId` set.

---

## Phase 3 — Runtime (target: 5 h)

### P3-1 Runtime resolution library

Files: `frontend/lib/apps/runtime.ts`.

Pure functions over `{ headers: string[], rows: string[][] }` (the sheet's values with the header row applied):

- `loadSheet(connection, spec)` → reads values via the connection owner's token, applies `spec.source.headerRow`, returns `{ headers, rows: { rowNumber, values: Record<header, string> }[] }`.
- `resolveIdentityRow(spec, rows, viewer)` → matching row or `null`; when `fallback === "choose"` also `candidates` (`rowNumber` + label = keyColumn or first column value).
- `applyFilters(rows, filters, viewer)` with `$user.email` / `$user.name` substitution; `sortRows`; `computeMetrics`.
- `assertPatchAllowed(spec, viewIndex, viewer, rowNumber, values, sheet)` → throws 403 with a reason: view must be `my-row` (row must equal the identity row) or `table` with `editable`; every key in `values` must be in the view's editable list and not `readOnly`.
- `assertAppendAllowed(spec, viewIndex, values)` → view must be `form`; keys ⊆ `fields`; required fields present; server adds the identity column value when `identity.matchBy === "email"`.
- `buildRowValues(spec, headers, values, viewer)` → full-width array for append.
- `diffRow(before, after)` → `changes` for the activity log.

Done when: `frontend/tests/runtime.test.ts` covers identity match, choose fallback, filters with `$user.email`, patch refusal for non-editable columns, and append with identity injection.

### P3-2 Runtime routes

Files: `frontend/app/api/apps/[shortId]/route.ts`, `…/rows/route.ts`, `…/rows/[rowNumber]/route.ts`, `frontend/lib/auth/guards.ts` (add `requireAppAccess(request, shortId, { draft })`).

`requireAppAccess`: user must be a member of the app's organization (auto-join by domain at sign-in already happened). `draft=1` → also `canEdit`. Returns `{ app, spec, viewer, canEdit, connection }` where `spec` is the published version, or the draft when requested, or 404 `"app_not_published"` when there is no published version and no draft access.

Implement PRD §11 runtime table. `PATCH`: re-read the row's key cell (`spec.source.keyColumn` or `identity.matchColumn`); if it differs from `expectedKey`, scan the column for the expected value and use that row; if not found → 409 `"row_moved"`. Write via `updateCells`; record activity. `POST`: `appendRow`; record activity.

Done when: on the `budget` fixture, `curl` as the consumer account returns only the consumer's row for the my-row view, a PATCH to `Q1` succeeds and appears in the sheet, and a PATCH to `Cost Center` returns 403; on the `rsvp` fixture a POST appends a row with the consumer's email filled in by the server.

### P3-3 Renderer components

Files: `frontend/app/components/runtime/AppRenderer.tsx`, `MyRowView.tsx`, `FormView.tsx`, `TableView.tsx`, `StatsView.tsx`, `FieldInput.tsx`, `useAppData.ts`.

- `AppRenderer({ shortId, draft?: boolean })` (client component): fetches `GET /api/apps/[shortId]?draft=`, renders header (icon, title, description), tabs when `views.length > 1`, and the view component. Loading, error, and "not published" states.
- `FieldInput` maps `ColumnDef.type` to MUI inputs: `TextField` (text, longtext multiline, email, number with `inputMode`), `Select` for select, `Checkbox`, `TextField type="date"`. Currency shows a prefix adornment.
- `MyRowView`: greeting (`identity` match → "Hi {displayName}"), read-only fields as text, editable fields as inputs, Save → `PATCH`, snackbar with `successMessage`. Candidate picker when `row === null && candidates`. "No row for you" message when `fallback === "deny"`.
- `FormView`: fields, Submit → `POST`, success state with "Submit another".
- `TableView`: MUI `Table` with sticky header, client-side search box when `search`, sort by clicking headers, inline edit of `editable` columns (click cell → input → blur/Enter → `PATCH`).
- `StatsView`: grid of metric tiles.

Keep everything in MUI; no charts.

Done when: `/a/[shortId]` (P3-4) renders all four view types from hand-written specs for the `budget` and `rsvp` fixture sheets without console errors.

### P3-4 Runtime page

Files: `frontend/app/a/[shortId]/page.tsx`, `frontend/app/a/layout.tsx`.

Server page: `getSession()`; signed out → `redirect("/authentication/signin?callbackUrl=/a/…")` (proxy already does this; keep the page check as a backstop). Membership failure → friendly "This app belongs to {org}" page. Otherwise render `<AppRenderer shortId />` in a centered `Container maxWidth="md"` with a slim top bar (AutoApps mark, user avatar, sign out). No org NavBar.

Done when: the consumer account can complete the hero flow steps 7–8 by URL.

---

## Phase 4 — Builder web UI (target: 4 h)

### P4-1 Apps list

Files: `frontend/app/[organizationSlug]/page.tsx`, `frontend/app/components/apps/AppCard.tsx`, `NewAppDialog.tsx`.

Grid of `AppCard` (icon, name, status chip, sheet title, creator avatar, "Open" → builder, "Copy link" when published). "New app" opens `NewAppDialog`: paste a Sheets URL → `POST connections` → on 428 show "Connect Google Sheets" linking to `/connect/google?callbackUrl=<here>` → on success navigate to `/[org]/new?connectionId=…`.

### P4-2 New-app flow page

Files: `frontend/app/[organizationSlug]/new/page.tsx`, `frontend/app/components/builder/SuggestionsPanel.tsx`.

Accepts `connectionId` **or** `spreadsheetId` + `gid` (creates the connection itself; this is what the extension links to under Plan B). Shows the sheet title, tab, detected headers as chips, a "Wrong header row?" number input calling `refresh`. Loads `suggest` → three idea cards + a free-text field. Choosing either → `POST apps` with a progress state ("Designing your app…") → redirect to the builder page.

### P4-3 Builder page

Files: `frontend/app/[organizationSlug]/apps/[appSlug]/page.tsx`, `frontend/app/components/builder/BuilderShell.tsx`, `ChatPanel.tsx`, `VersionsList.tsx`, `ActivityList.tsx`, `PublishBar.tsx`.

Two-column layout on desktop (stacked on mobile): left = `ChatPanel` (message list from `app_messages`, input, sending state); right = `<AppRenderer shortId draft />` inside a bordered "Preview" frame that remounts (key = draft version id) after each new version. Top `PublishBar`: name (editable inline), status, "Publish" (disabled when draft == published), "Copy link" (`/a/{shortId}` absolute URL), "Open live". Tabs under the bar: Preview · Versions (restore) · Activity. Non-editors see preview only.

### P4-4 Extension panel page

Files: `frontend/app/extension/panel/page.tsx`, `frontend/app/extension/layout.tsx`.

Single-column, 360 px-friendly variant that reuses `SuggestionsPanel`, `ChatPanel`, `PublishBar`, and `AppRenderer` in a stacked layout. Reads `spreadsheetId` and `gid` from the query string. States: signed out (button "Sign in to AutoApps" with `target="_blank"` to `/authentication/signin?callbackUrl=/extension/connected`, and a 3-second `GET /api/me` poll) → not connected (button to `/connect/google?callbackUrl=/extension/connected`, `target="_blank"`, same poll) → loading sheet → suggestions → app draft (mini preview + chat + Publish/Copy link + "Open in AutoApps" `target="_blank"`). `/extension/connected` is a tiny page that says "You can close this tab".

If the same sheet already has apps in this org, list them first with "Open" and "Copy link".

Done when (whole phase): hero steps 3–6 work in a normal browser tab from `/[org]/new`, and the panel page works at 360 px width when opened directly in a tab.

---

## Phase 5 — Chrome extension (target: 3 h)

Skip P5-2 and P5-3 details if P0-6 forced Plan B; then the badge and action simply open the new-app URL in a tab.

### P5-1 Scaffold and build

Files: `extension/package.json`, `extension/tsconfig.json`, `extension/build.mjs` (esbuild), `extension/manifest.json`, `extension/sidepanel.html`, `extension/icons/` (three PNG sizes; a plain colored square with an "A" is fine).

`build.mjs`: bundle `src/background.ts`, `src/content.ts`, `src/sidepanel.ts` to `dist/*.js` as IIFE, copy `manifest.json`, `sidepanel.html`, `icons/` to `dist/`. `APP_ORIGIN` injected at build time from `process.env.APP_ORIGIN` (default `http://localhost:3000`). Scripts: `build`, `watch`.

`manifest.json`: MV3; `permissions: ["sidePanel", "tabs", "storage"]`; `host_permissions: ["https://docs.google.com/spreadsheets/*"]`; `content_scripts` on `https://docs.google.com/spreadsheets/*` with `content.js` at `document_idle`; `side_panel.default_path: "sidepanel.html"`; `action` with icons; `background.service_worker: "background.js"`.

### P5-2 Background and content scripts

Files: `extension/src/background.ts`, `extension/src/content.ts`, `extension/src/shared.ts` (`parseSheetUrl`, message types).

- `background.ts`: on install, `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`. Listen for `{ type: "OPEN_PANEL" }` from content scripts → `chrome.sidePanel.open({ tabId: sender.tab.id })`. On `chrome.tabs.onUpdated` / `onActivated`, compute `{ spreadsheetId, gid }` from the tab URL and broadcast `{ type: "SHEET_CHANGED", ... }` via `chrome.runtime.sendMessage` (ignore "no receiver" errors).
- `content.ts`: inject a fixed-position badge (bottom-right, above the sheet tabs bar; z-index high; AutoApps colors) with text "Build an app from this sheet". Click → `chrome.runtime.sendMessage({ type: "OPEN_PANEL" })`. Re-evaluate on `hashchange` (gid changes). Do not touch the Sheets DOM beyond appending one element to `document.body`.

### P5-3 Side panel

Files: `extension/src/sidepanel.ts`, `extension/sidepanel.html`.

`sidepanel.html`: full-height iframe, no chrome. `sidepanel.ts`: on load, `chrome.tabs.query({ active: true, currentWindow: true })` → set `iframe.src = ${APP_ORIGIN}/extension/panel?spreadsheetId=…&gid=…` (or `/extension/panel` with no params → the page shows "Open a Google Sheet to get started"). Listen for `SHEET_CHANGED` and update `src` only when the spreadsheet id or gid changed.

Done when (whole phase): with the extension loaded unpacked, hero steps 2–6 run inside the side panel against `localhost:3000`, and switching to another spreadsheet tab updates the panel.

---

## Phase 6 — Deploy, polish, demo (target: 3 h)

### P6-1 Deploy

- Vercel: root directory `frontend`, env vars from §2, `NEXTAUTH_URL=https://autoapps.win`. The same Supabase database serves development and production for the hackathon, so `db:sync` has already run against it; do not run it again with `--yes` unless a new table was added.
- Google OAuth: add `https://autoapps.win/api/auth/callback/google` to the `AutoApps web` client's redirect URIs; consent screen stays in Testing.
- Extension: `APP_ORIGIN=https://<domain> npm run build`; reload unpacked on the builder profile. Add `https://<domain>/*` to `host_permissions` only if Plan B needed fetches (it should not).

### P6-2 Polish (in this order, stop when time runs out)

1. Light theme as default in `theme.ts` (internal tools read better on white); primary color one brand hue; keep the `LinkBehavior` adapter.
2. Empty states: no apps yet, no suggestions, sheet with no header.
3. Error toasts everywhere a `fetch` can fail, with the server's `error` text.
4. `README.md` at the repo root: what it is, how to run frontend + extension locally, env vars, demo script.
5. Favicon and extension icons with the same mark.

### P6-3 Demo rehearsal checklist

- Reconnect Google Sheets on the builder account the morning of the demo (Testing-mode refresh tokens expire after 7 days).
- Demo sheet reset: clear Q1–Q4 and Justification for the consumer's row.
- Rehearse the hero scenario twice on the deployed URL; time "open sheet → link copied".
- Have `/[org]/new` open in a tab as the fallback if the side panel misbehaves.
- Keep the five fixture sheets open in tabs; during Q&A, open whichever one the audience asks about, or a sheet they hand over.

---

## Priorities if time runs short

P0 (must): P0-1…P0-5, P1-1…P1-6, P2-1…P2-5, P3-1…P3-4, P4-1…P4-3, P6-1.
P1 (should): P4-4, P5-1…P5-3, P6-2 items 1–3, P6-3.
P2 (nice): versions restore UI, table inline edit, stats view polish, activity tab, P6-2 items 4–5.

If the extension cannot be finished, the demo still works: the extension's only job is to open the panel; the paste-a-URL path in P4-1/P4-2 is the same product.
