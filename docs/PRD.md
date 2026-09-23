# AutoApps — Product Requirements Document

Status: hackathon v1 · Owner: Amos · Written: 2026-09-23 · Build window: 2–3 days

---

## 1. Summary

AutoApps lets non-technical people in an organization build and share small internal apps on top of the systems and files they already use, without touching the underlying system. Version 1 targets **Google Sheets** only.

The hero flow: a Finance person opens next year's budget sheet. The AutoApps Chrome extension notices the sheet and proposes apps that fit it ("Let each cost-center owner fill in their own budget line"). They pick one, tweak it in a chat, publish, and get a link. A colleague opens the link, signs in with their company Google account, sees **only their row**, fills it in, and saves. The sheet updates underneath. Finance sees who has filled in what.

Everything is deployed and stored in the AutoApps backend. Apps are scoped to an organization; anyone with a company email can use them. Fine-grained permissions come later.

---

## 2. Goals and non-goals

### Goals (must be true at demo time)

1. From opening a Google Sheet to a shareable app link in under two minutes, with no code.
2. The consumer never sees or needs access to the source sheet.
3. Apps are described in a chat and edited in a chat; the builder never sees JSON.
4. Access is organization-scoped: sign in with Google, auto-join the org matching your email domain, use any app in the org.
5. Everything survives a page refresh: apps, versions, chat history, activity.

### Non-goals for v1

- Data sources other than Google Sheets (Workday, Excel files, databases). The data model leaves room for them.
- Per-app or per-role permissions beyond "member of the organization" and "builder vs consumer".
- Apps made of generated code. Apps are JSON specs rendered by a fixed component set (see §6).
- Chrome Web Store publication. The extension is loaded unpacked.
- Billing, mobile, offline, real-time collaboration, localization.
- Handling sheets with multiple header rows, merged cells, or pivot layouts. We auto-detect one header row and let the builder correct it.

---

## 3. Users and personas

| Persona | Who | What they do | Where |
|---|---|---|---|
| Builder | Finance analyst, HR partner, ops lead. Owns a sheet. Non-technical. | Creates, edits, publishes apps. Watches activity. | Chrome extension side panel, or the web app |
| Consumer | Any employee | Opens a link, signs in, fills or reads their part | Web app at `/a/{shortId}` |
| Org admin | Whoever signed up first, plus anyone they promote | Manages members and roles | Web app org settings (inherited from flow-tester) |

---

## 4. Hero scenario (the demo)

This is one example. Nothing in the product is specific to budgets or to these column names: the same flow must work on any sheet a person opens (a task tracker, an inventory list, an event sign-up, a hiring pipeline, a headcount roster). See §9 for how the product reads an arbitrary sheet.

Two Google accounts on the same domain: `finance@acme.com` (builder) and `sam@acme.com` (consumer).

1. Builder opens `FY2027 Budget` in Google Sheets. Columns: `Cost Center`, `Owner Email`, `Q1`, `Q2`, `Q3`, `Q4`, `Justification`, `Status`.
2. A small AutoApps badge appears on the sheet. Clicking it opens the Chrome side panel.
3. The panel says "Reading FY2027 Budget…" then shows three suggestions:
   - **Budget line self-service** — each owner sees and fills only their own line (matches `Owner Email`).
   - **Budget request form** — anyone submits a new line.
   - **Budget status board** — read-only table with totals per quarter.
4. Builder clicks the first. Fifteen seconds later a preview appears: a form with Q1–Q4 and Justification, `Cost Center` read-only.
5. Builder types "Also show them last year's number as read-only and make Justification required." The preview updates.
6. Builder clicks **Publish**. A link is copied: `https://autoapps.win/a/k3x9Qm2bLp`.
7. Consumer opens the link in another browser profile, signs in with Google, and sees "Hi Sam, here is your budget line for Marketing." They fill Q1–Q4, click Save, get a confirmation.
8. Builder refreshes the sheet: Sam's row is filled. In the AutoApps app page, the Activity tab shows "sam@acme.com updated Q1, Q2, Q3, Q4, Justification · just now".

---

## 5. Product surface

### 5.1 Chrome extension

- Manifest V3. Runs on `https://docs.google.com/spreadsheets/*`.
- **Content script**: detects the spreadsheet id and active sheet `gid` from the URL, injects a floating "Build an app from this sheet" badge. Clicking it opens the side panel.
- **Side panel**: an extension page that embeds the AutoApps web app in an iframe at `/extension/panel?spreadsheetId=…&gid=…`. When the active tab changes to another spreadsheet, the iframe URL updates.
- **Action icon**: also opens the side panel.
- The extension holds no business logic and no API calls of its own. All UI is served by the web app so the builder experience is identical in the panel and in a normal tab.
- Sign-in cannot happen inside an iframe (Google blocks it). The panel shows a "Sign in" button that opens the web app in a new tab and polls until the session exists.

### 5.2 Web app (Next.js, stripped flow-tester)

Routes:

| Route | Who | Purpose |
|---|---|---|
| `/` | anyone | Minimal landing. Signed-in users are redirected to their organization. |
| `/authentication/signin`, `/signup`, `/signup/invite/[token]` | anyone | Inherited. Google + email/password. GitHub and GitLab removed. |
| `/[organizationSlug]` | member | Apps list: cards with name, icon, status, source sheet, "Open", "Copy link". "New app" button (paste a Google Sheets URL). |
| `/[organizationSlug]/apps/[appSlug]` | member (edit: creator, admin, owner) | Builder: live preview of the draft, chat to edit, Publish, Share link, Activity tab, Versions list. |
| `/[organizationSlug]/new` | member | New-app flow: sheet summary, header-row override, three suggestions, free-text request. Accepts `connectionId` or `spreadsheetId`+`gid`. |
| `/[organizationSlug]/users`, `/[organizationSlug]/settings` | admin, owner | Inherited member management and org settings. |
| `/extension/panel` | member | Compact builder for the side panel. Same components as the builder page, narrower layout, no nav bar. |
| `/a/[shortId]` | member of the app's org | Runtime: the published app. Requires sign-in; redirects back after. |
| `/connect/google` | signed-in | Starts incremental Google auth for the Sheets scope, then returns to `callbackUrl`. |
| `/extension/connected` | signed-in | "You can close this tab" landing after sign-in or Sheets connection started from the panel. |

### 5.3 Builder experience

1. **Source**: a Google Sheets URL, from the extension or pasted. We read the spreadsheet title, the sheet tabs, and the active tab's header row plus sample rows using the builder's own Google credentials.
2. **Suggestions**: three app ideas generated from the sheet's shape, for any sheet. Each has a title, a one-line pitch, and an archetype, and the three cover different archetypes. A free-text box lets the builder describe something else.
3. **Generate**: picking an idea or sending a description creates an app in `draft` with version 1.
4. **Edit by chat**: every message produces a new draft version and a one-sentence explanation of what changed. Versions are listed; any can be restored as the new draft.
5. **Preview**: the draft renders exactly as consumers will see it, using the builder's identity. If the builder's email matches no row, the preview offers a row picker.
6. **Publish**: copies the draft to `published`. The share link is `/a/{shortId}`. Re-publishing after edits replaces the live version.
7. **Activity**: list of who did what through the app (row updated, row appended), newest first.

### 5.4 Consumer experience

- Opens `/a/{shortId}`. If signed out, Google sign-in, then back to the app.
- If their email domain matches the org's domain, they join automatically as `user`. Otherwise: "This app belongs to Acme. Ask an admin to invite you."
- Sees the app's views as tabs (or a single view with no tabs).
- **My row**: greeting, their row's read-only fields, editable fields, Save. Success message. If no row matches and the spec allows it: a searchable picker of rows.
- **Form**: fields, Submit, success message, "Submit another".
- **Table**: filtered, sortable, searchable read-only table; optionally inline-editable columns.
- **Stats**: metric tiles (count, sum, average, filled/empty counts).

---

## 6. The AppSpec (what an app *is*)

An app is a JSON document, version 1, generated and edited by the model and validated with zod on the server before it is stored. The renderer supports exactly four view types. No generated code ever runs.

```ts
type AppSpec = {
  version: 1;
  title: string;
  description?: string;
  icon?: string;                      // single emoji
  source: {
    type: "google_sheets";
    sheetTitle: string;               // tab name, must exist in the connection
    headerRow: number;                // 1-based
    keyColumn?: string;               // header whose value identifies a row (used to verify writes)
  };
  columns: ColumnDef[];               // the subset of headers this app touches
  identity?: {
    matchColumn: string;              // header compared to the signed-in user
    matchBy: "email" | "name";
    fallback: "choose" | "deny";      // when no row matches
  };
  views: View[];                      // 1–4 views; rendered as tabs when >1
  access: { audience: "organization" };
};

type ColumnDef = {
  header: string;                     // exact header text in the sheet
  label?: string;
  type: "text" | "longtext" | "number" | "currency" | "date" | "select" | "checkbox" | "email";
  options?: string[];                 // select only
  required?: boolean;
  readOnly?: boolean;
  help?: string;
};

type Filter = {
  column: string;
  op: "eq" | "neq" | "contains" | "gt" | "lt" | "empty" | "not_empty";
  value?: string;                     // "$user.email" and "$user.name" are substituted at runtime
};

type View =
  | { type: "my-row"; title: string; greeting?: string; show: string[]; editable: string[]; submitLabel?: string; successMessage?: string }
  | { type: "form";   title: string; fields: string[]; submitLabel?: string; successMessage?: string }
  | { type: "table";  title: string; columns: string[]; filter?: Filter[]; sort?: { column: string; direction: "asc" | "desc" }; search?: boolean; editable?: string[] }
  | { type: "stats";  title: string; metrics: { label: string; column: string; agg: "count" | "sum" | "avg" | "count_filled" | "count_empty"; filter?: Filter[] }[] };
```

Validation rules enforced server-side (not just by the schema):

- Every header referenced anywhere exists in the connection's cached schema for `source.sheetTitle`.
- `my-row` requires `identity`. `editable` ⊆ `show`. `readOnly` columns are never in `editable` or `fields`.
- `form` fields cannot include the identity column when `matchBy` is `email` (the server fills it in with the signed-in user's email).
- At most 4 views, at most 40 columns.

Runtime enforcement: the server decides what a user may read and write **from the spec**, never from the client. A `PATCH` on a `my-row` app is accepted only for the row that matches the caller's identity and only for `editable` columns.

---

## 7. Data access model

- The **builder's** Google credentials are used for all reads and writes to a sheet. Consumers never authorize Sheets.
- On first use, the builder grants the `https://www.googleapis.com/auth/spreadsheets` scope through incremental auth (`access_type=offline`, `prompt=consent`). We store the refresh token on the user record and refresh access tokens server-side.
- Plain sign-in (builders and consumers alike) requests only `openid email profile`. A plain sign-in must never overwrite a stored refresh token.
- Each spreadsheet is a `Connection` owned by the builder who connected it, scoped to the organization. Its cached schema (tabs, header row, headers with inferred types, five sample rows, row count) is refreshed when the builder asks or when a generation request is made.
- Writes verify the row before writing: re-read the `keyColumn` (or `identity.matchColumn`) cell at the target row and compare with the expected value. On mismatch, re-locate the row by scanning the column; if still not found, fail with a clear message.
- Every write through an app is recorded in `app_activities`.

Google OAuth caveats for the hackathon: the `spreadsheets` scope is "sensitive", so the OAuth app stays in **Testing** mode with the demo accounts listed as test users. Refresh tokens issued in Testing mode expire after 7 days; reconnecting is one click.

---

## 8. Access control

Inherited from flow-tester: `User`, `Organization` (unique `domain`), `UsersOrganizations` with roles `owner | admin | user` (`tester` removed), `Invite`.

New rules:

| Action | owner | admin | user |
|---|---|---|---|
| Sign in and auto-join org by email domain | — | — | anyone with a matching domain becomes `user` |
| Use a published app in the org | ✓ | ✓ | ✓ |
| Create apps, connect sheets | ✓ | ✓ | ✓ |
| Edit, publish, delete an app | ✓ | ✓ | creator only |
| See an app's activity | ✓ | ✓ | creator only |
| Manage members, org settings | ✓ | ✓ | — |

Personal-email sign-ups (gmail.com etc.) still get a personal organization, as in flow-tester. A user can belong to several organizations; the builder UI has an org switcher in the nav bar.

---

## 9. AI design

Provider: **Nebius Token Factory** at `https://api.tokenfactory.nebius.com/v1/`, an OpenAI-compatible endpoint. TypeScript client: the `openai` npm package with a custom `baseURL` and `apiKey: process.env.NEBIUS_API_KEY`. Nebius documents only Python, but the Node SDK works unchanged because the wire format is OpenAI's.

### Reading any sheet

The product never assumes column names. Every sheet goes through the same two steps before a model sees it.

**1. Schema extraction** (deterministic, `lib/google/schema.ts`): header-row detection, per-column inferred type (`text`, `longtext`, `number`, `currency`, `date`, `select`, `checkbox`, `email`), sample values, distinct-value count, and **fill ratio** (share of data rows where the cell is non-empty). Fill ratio is the key signal for "fill in your part" apps: columns that are mostly empty are what people are expected to complete.

**2. Shape analysis** (deterministic, `lib/apps/shape.ts`): from the schema, derive hints that are passed to the model alongside the raw schema:

| Hint | How it is derived | What it suggests |
|---|---|---|
| `identityCandidates` | columns typed `email`, or `text` columns whose header contains owner, name, assignee, person, employee, manager, requester | a `my-row` app where each person sees their own row |
| `fillInCandidates` | columns with fill ratio < 0.5 that are not identity or key columns | the fields a `my-row` or `table` app should make editable |
| `statusColumns` | `select` columns with headers containing status, stage, state, phase, priority | filters for `table` views and `count` metrics for `stats` |
| `dateColumns`, `numericColumns` | by inferred type | sorting, `sum`/`avg` metrics, "upcoming" filters |
| `keyCandidates` | columns with high distinct count and a fill ratio near 1 | `source.keyColumn` for safe writes |
| `looksLikeLog` | many rows, a date column, low fill-in ratio | a `form` app that appends rows |
| `rowCount`, `emptyColumnCount` | counts | whether a form (few rows) or a table (many rows) fits |

**Archetype rules** the suggestion prompt states explicitly, and that the three suggestions must draw from distinct archetypes:

- Identity candidate present and fill-in candidates present → **my-row** ("each person completes their own line").
- Looks like a log, or few rows with clear field columns → **form** ("submit a new entry").
- Status or category columns and more than ~15 rows → **table** with filters ("board / directory / tracker view"), optionally with inline-editable status.
- Numeric columns → **stats** ("totals and progress"), usually combined with a table as a `mixed` app.
- When a sheet fits nothing well, suggest a read-only **table** with search plus a **form**, and say so in the pitch.

Sheets with several tabs: v1 analyzes the active tab only; the builder can switch tabs in the connection panel.

### Model choice

Researched 2026-09-23 against Nebius's public catalog (`https://tokenfactory.nebius.com/api/public/models_info`), its chat-completion API reference, and independent September 2026 write-ups. The workload needs exact adherence to a JSON schema, exact reuse of header names, sound judgment about which columns matter, and answers well under 30 s. Volume is tiny, so price is not a deciding factor.

| Model id on Nebius | Throughput on Nebius | $/M in / out | Assessment |
|---|---|---|---|
| `zai-org/GLM-5.3` | ~455 tok/s (speculative decoding) | 1.40 / 4.40 | Highest-ranked open-weight model on the Artificial Analysis index as of Sept 2026; strong instruction following and tool use; supports JSON-schema output. Thinking is always on and `reasoning_effort` defaults to `max`, so it must be set explicitly (`low` / `high`). |
| `zai-org/GLM-5.3-Flash` | ~349 tok/s | 0.15 / 0.50 | Same family, 18B active parameters, near-flagship on agent tasks, verbose. Right size for the suggestion call. |
| `deepseek-ai/DeepSeek-V4.1-Flash` | ~139 tok/s | 0.30 / 1.20 | Newest DeepSeek (2026-09-10). Thinking can be switched off (`reasoning_effort: "none"`), very low first-token latency elsewhere. Kept as the fallback. |
| `moonshotai/Kimi-K3` | ~264 tok/s | 3.00 / 15.00 | Quality on par with GLM-5.3, but capped at 8K output on Nebius, no temperature control, three times the price. Not chosen. |
| `openai/gpt-oss-120b`, `Qwen/Qwen3-235B-A22B-Instruct-2507` | 40 / 27 tok/s | cheap | Tagged "JSON mode" in the catalog but served slowly on Nebius. Not chosen. |

**Decision.** `zai-org/GLM-5.3` with `reasoning_effort: "high"` for `generateSpec` and `editSpec`; `zai-org/GLM-5.3-Flash` with `reasoning_effort: "low"` for `suggestApps`. All three are environment-configurable (`NEBIUS_MODEL`, `NEBIUS_MODEL_SUGGEST`, `NEBIUS_REASONING_EFFORT`). The documented fallback for either slot is `deepseek-ai/DeepSeek-V4.1-Flash` with `reasoning_effort: "none"`. Task P2-4 measures latency and reasoning tokens on the demo sheet; if generation exceeds 20 s, lower the effort to `"low"` before changing the model.

### Structured output

- Request `response_format: { type: "json_schema", json_schema: { name, schema, strict: true } }`, with the schema derived from the zod `AppSpec` definition. Nebius serves these models on vLLM, whose guided decoding constrains the answer that follows the reasoning block, so schema mode and thinking coexist.
- Embed the same JSON schema in the system prompt as well. Nebius's own docs recommend providing it in both places, and it keeps output correct if enforcement is ever silently unavailable.
- Always parse and validate with zod on the server, whatever the API promises. If Nebius rejects `json_schema` for a model (HTTP 400), fall back automatically to `{ type: "json_object" }` and log it.
- `max_completion_tokens: 24000`. On Nebius this cap includes reasoning tokens, and the default is only 8192.
- Do not pass `temperature`; some models on the platform reject it and GLM's default is the recommended value.
- Ignore `reasoning_content` in responses and never send it back. Chat history is rebuilt from stored user and assistant text only.

### Calls

Three calls, all in `frontend/lib/ai/`:

| Call | Input | Output | Model, effort |
|---|---|---|---|
| `suggestApps` | spreadsheet title, tab name, headers with inferred types, samples, fill ratios, shape hints (§9 above), row count, org name | exactly 3 ideas `{ title, pitch, archetype, identityColumn?, editableColumns? }`, three distinct archetypes | `NEBIUS_MODEL_SUGGEST`, `low` |
| `generateSpec` | same schema context and shape hints + chosen idea or free-text request | `{ spec: AppSpec, summary: string }` | `NEBIUS_MODEL`, `NEBIUS_REASONING_EFFORT` |
| `editSpec` | schema context + current spec + last 10 chat messages + new message | `{ spec: AppSpec, summary: string }` | `NEBIUS_MODEL`, `NEBIUS_REASONING_EFFORT` |

Prompting rules the system prompt must state:

- Use header names **exactly** as given; never invent columns.
- Prefer `my-row` when a column looks like emails or people's names and the request is about "each person filling their own".
- Keep apps small: one or two views unless asked. Write labels and help text for humans, not developers.
- `summary` is one or two sentences addressed to the builder.
- Return only the JSON object, no prose and no code fence.

After each call the server validates the spec (§6). On failure it retries once with the validation errors appended to the conversation; on a second failure it returns the errors to the builder as an assistant message and keeps the previous version.

Latency budget: suggestions under 10 s, generation under 30 s. The UI shows a progress state for both.

Rate limits: Nebius starts projects at roughly 60 requests and 400K tokens per minute and scales them automatically, far above hackathon needs.

---

## 10. Data model

All tables use UUID primary keys, `created_at`/`updated_at`, underscored column names (Sequelize `underscored: true`), matching flow-tester.

```
users, organizations, users_organizations, invites, reset_password_tokens   -- inherited

connections
  id, organization_id, owner_user_id, type ('google_sheets'),
  spreadsheet_id, title, sheets JSONB [{sheetId, title, rowCount, columnCount}],
  schema JSONB {sheetTitle, headerRow, headers:[{name, index, inferredType, samples[], fillRatio, distinctCount}], sampleRows[][], rowCount},
  schema_fetched_at
  UNIQUE (organization_id, spreadsheet_id)

apps
  id, organization_id, connection_id, created_by_id,
  slug (UNIQUE per organization), short_id (UNIQUE, 10 chars, nanoid),
  name, description, icon, status ('draft' | 'published'),
  draft_version_id, published_version_id

app_versions
  id, app_id, number, spec JSONB, summary, created_by_id
  UNIQUE (app_id, number)

app_messages
  id, app_id, user_id, role ('user' | 'assistant'), content, version_id (nullable)

app_activities
  id, app_id, user_id, action ('row_updated' | 'row_appended'), row_number, changes JSONB {header: {from, to}}
```

Removed from flow-tester: projects, tests, test versions/runs, suites, automations, credentials, organization analyses, billing transactions/invoices, and their routes, pages, and env vars.

---

## 11. API

All routes return JSON. Errors are `{ error: string, code?: string }` with a sensible status. Auth uses the NextAuth JWT cookie, resolved by a shared helper `requireUser(request)` and `requireOrgMember(request, organizationSlug, minRole?)`.

Builder side, under `/api/organizations/[organizationSlug]/`:

| Method, path | Body → response |
|---|---|
| `POST connections` | `{ spreadsheetUrl \| spreadsheetId, gid? }` → `{ connection, apps: [...] }`. `428 { code: "sheets_not_connected" }` when the caller has no Sheets refresh token. |
| `POST connections/[id]/refresh` | `{ sheetTitle?, headerRow? }` → `{ connection }` (re-reads schema) |
| `POST connections/[id]/suggest` | `{}` → `{ ideas: [3] }` |
| `GET apps` | → `{ apps: [...] }` |
| `POST apps` | `{ connectionId, idea? , prompt? }` → `{ app, version, message }` |
| `GET apps/[appSlug]` | → `{ app, draft: version, published: version \| null, messages, versions, connection }` |
| `POST apps/[appSlug]/messages` | `{ content }` → `{ version, message }` (new draft version) |
| `POST apps/[appSlug]/publish` | `{}` → `{ app }` |
| `POST apps/[appSlug]/versions/[id]/restore` | `{}` → `{ version }` (copies into a new draft version) |
| `PATCH apps/[appSlug]` | `{ name?, icon?, description? }` → `{ app }` |
| `DELETE apps/[appSlug]` | → `204` |
| `GET apps/[appSlug]/activity` | → `{ activities: [...] }` |

Runtime, under `/api/apps/[shortId]/` (any org member; `?draft=1` allowed only for people who can edit the app):

| Method, path | Body → response |
|---|---|
| `GET .` | → `{ app: {name, icon, description}, spec, viewer: { email, name, canEdit } }` |
| `GET rows?view=N` | `my-row` → `{ row: { rowNumber, values } \| null, candidates?: [{ rowNumber, label }] }` · `table` → `{ rows: [{ rowNumber, values }], total }` · `stats` → `{ metrics: [{ label, value }] }` |
| `POST rows` | `{ view: N, values: { header: value } }` → `{ rowNumber }` (form views only) |
| `PATCH rows/[rowNumber]` | `{ view: N, values, expectedKey? }` → `{ ok: true }` (my-row and editable table columns only) |

Misc: `GET /api/me` → `{ user, organizations: [{ slug, name, role }], sheetsConnected: boolean }`.

---

## 12. Non-functional requirements

- **Security**: server-side spec enforcement for every read and write; refresh tokens never leave the server; the runtime never receives the spreadsheet id.
- **Session in an iframe**: the NextAuth session cookie is `SameSite=None; Secure` so the side panel iframe carries the session. Verified in a spike on day one; fallback is opening the builder in a normal tab.
- **Sheets API quota**: 300 read requests per minute per project. Cache each sheet's values in memory for 10 seconds per process; batch cell updates for one row into a single `values:batchUpdate`.
- **Performance**: the runtime page renders within 2 s for sheets up to 2,000 rows (read the used range once, filter in memory).
- **Reliability during the demo**: every AI call has a retry; every external failure has a human-readable error in the UI; the "paste a sheet URL" path works without the extension.
- **Database**: fresh Postgres; schema created by `sequelize.sync()` through an explicit script for the hackathon (flow-tester's manual SQL migrations are not carried over).

---

## 13. Success criteria for the hackathon

1. The hero scenario in §4 runs end to end on a deployed URL with two Google accounts, twice in a row, with no manual database edits.
2. Sheet to link in under two minutes, timed.
3. Any sheet handed over during Q&A yields three sensible, distinct suggestions and a working app; verified beforehand on at least five fixture sheets of different shapes (§9).
4. Refreshing any page loses nothing.

---

## 14. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Session cookie not sent in the side-panel iframe | Day-one spike (Plan P0-6). Fallback: extension opens `/[org]/new?sheet=…` in a tab. |
| Google OAuth Testing-mode limits (test users, 7-day refresh tokens) | Add both demo accounts as test users; reconnect Sheets the morning of the demo. |
| The model produces a spec that references a wrong header | Server validation with exact-header check, one retry with errors; builder sees a friendly message and keeps the last good version. |
| Rows shift while the app is in use | Verify the key cell before writing; relocate by scan; refuse with a message if not found. |
| Header row is not row 1 | Auto-detect (first row with ≥ 50 % non-empty text cells and no numbers); builder can override in the connection panel. |
| Google Sheets DOM changes break the badge | The badge only reads `location`; the action icon and a pasted URL are independent paths. |

---

## 15. Later (explicitly out of v1)

- More sources: Excel/CSV upload, Workday, Airtable, Postgres. `Connection.type` and a `SourceAdapter` interface are the seam.
- Per-app audiences (specific people, groups, "anyone with the link"), approval flows, notifications.
- Generated-code views for cases the four archetypes cannot express.
- Chrome Web Store listing, Google OAuth verification.
- Suggestion badge count on the sheet, org switcher inside the panel, "preview as" another user.
