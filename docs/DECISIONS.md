# Decisions and deviations

One paragraph per entry, newest first. Reference the task id. Record only things that differ from `docs/PLAN.md` or that a future session would otherwise have to rediscover (e.g. the P0-6 spike result, a Google API quirk, a library swap).

- **2026-09-23 · P3-1 runtime write rules.** The rules beyond the plan's wording:
  - **Table edits:** the target row must pass the view's filters, so a manager filtered to `$user.email` cannot PATCH another manager's row.
  - **`my-row`:** a viewer may write only rows matching their identity. If they own several, they can pick among them.
  - **`fallback: "choose"`:** this lets a viewer pick and edit any row only when *no* row matches them (PRD §5.4's picker). Anyone who has a row cannot touch other rows.
  - **Required columns:** these are enforced on PATCH as well as on append.
  - **Owner not connected:** when the owner's Google connection is gone, consumers get 503 `owner_not_connected`, not 428, since they cannot fix it.
  - **Header names:** `resolveHeaderNames` is shared with `extractSchema`, so runtime header names ("Column C", "Name (2)") always match the schema's.
  - **Reads:** `projectRow` limits every read to the view's columns.

- **2026-09-23 · P2-3 suggestions: the person-scoped idea may be a table.** The plan expected a `my-row` idea for headcount on Manager Email. But each manager owns about 4.5 rows, and `my-row` shows one row per person, so "a table of your rows" is the right shape (P2-4 built exactly that). The rules are now:
  - when a sheet has an identity column, exactly one idea is scoped to the signed-in person, with `identityColumn` set;
  - that idea is `my-row` when there is about one row per person, and otherwise a table of their rows;
  - email identity columns win over name columns (`preferredIdentityColumns` in `lib/apps/shape.ts`), because people sign in by email. Without this, GLM-5.3-Flash kept choosing the Employee name column for headcount. The model is shown only the preferred columns, with rows per person.

  `suggestApps` checks for distinct archetypes, a person-scoped idea on a preferred column, and no `my-row` without an identity column, retrying once with the errors. Output on the seeded sheets (two identical-shape rounds, 3–10 s each):
  - budget: my-row (Owner Email), table, mixed/stats;
  - tasks: my-row (Assignee), table, mixed/form;
  - inventory: table, mixed, form (no identity);
  - rsvp: my-row (Email), table, form;
  - headcount: table scoped to Manager Email, stats, form.

- **2026-09-23 · P1-3 Sheets error mapping.** 401, or a 403 that mentions scope/auth, maps to 428 `sheets_not_connected`, as planned. Any other 403 (the spreadsheet is not shared with the builder) maps to 403 `sheet_forbidden`, and a 404 to 404 `sheet_not_found`, because reconnecting Sheets would not fix either. Sheet names in ranges are always quoted (`'Form Responses 1'!A1`). `createSpreadsheet` pads rows to equal width. Checked live with `scripts/try-sheets.ts`: scratch sheet https://docs.google.com/spreadsheets/d/120bZU0BE2PAz39vG5-WJZkCB833K-eYWTWGT9UYdhtg (safe to delete).

- **2026-09-23 · P2-4 generation results; effort stays `high`.** `try-ai` on the five fixture schemas (`fixture:NAME`, because no real connections exist until the Sheets grant; the same code path runs on `connection.schema`). Every spec passed `validateSpec` on the first attempt.

  | Fixture | Latency | Result |
  |---|---|---|
  | budget | **65 s** (first call) | my-row on Owner Email plus stats |
  | budget edit | 4 s | made Justification required |
  | tasks | 7 s | my-row plus a board with inline status |
  | inventory | 8.6 s | stats plus a table sorted by quantity |
  | rsvp | 6.7 s | a form; the email is filled by the server |
  | headcount | 8.6 s | a table filtered to `Manager Email = $user.email`, with an editable checkbox |

  The 65 s is Nebius compiling the `json_schema` grammar the first time it sees a schema (reasoning tokens were only 186). Every later call with the same schema was 4–9 s, so `NEBIUS_REASONING_EFFORT` stays `high`. Consequence for the demo: run one generation after each deploy and before presenting (added to P6-3's notes). The prompt now says explicitly that only the identity email is auto-filled, after the model claimed the RSVP timestamp would be.

- **2026-09-23 · P2-2 Nebius structured output measured.** `scripts/try-nebius.ts` with a toy `{ greeting, number }` schema: all three models accepted `response_format: json_schema` (strict) with `reasoning_effort` set, and the `json_object` fallback never fired.

  | Model | Effort | Latency |
  |---|---|---|
  | `zai-org/GLM-5.3` | `high` | 13.2 s on the first (cold) call, then 8.9 / 5.6 / 2.2 s |
  | `zai-org/GLM-5.3` | `low` | 12.9 s (first call) |
  | `zai-org/GLM-5.3-Flash` | `low` | 1.1–1.4 s |
  | `deepseek-ai/DeepSeek-V4.1-Flash` | `none` | 2.3 s |

  GLM-5.3's latency is dominated by time-to-first-token and varies a lot. Reasoning tokens were 1–5 on this trivial prompt, so effort barely mattered here. P2-4 measures real spec generation. The system prompt's embedded JSON schema is sent without its `$schema` key.

- **2026-09-23 · P2-1 extra spec rules.** Besides PRD §6's rules, `validateSpec` also requires:
  - every header a view uses (show, editable, fields, table columns, filters, sort, metrics) to be declared in `columns`, so the renderer always has a type for it;
  - no header declared twice in `columns`;
  - `source.sheetTitle` and `source.headerRow` to match the connection's cached schema, because otherwise the header names refer to a different tab or row.

  `validateSpec` returns the parsed spec on success (`{ ok: true, spec }`).

- **2026-09-23 · P1-4 schema heuristics.** Four clarifications of PRD §9 / PLAN P1-4, chosen for arbitrary sheets rather than the fixtures:
  1. `select` needs ≤ 8 distinct values over ≥ 10 *filled* cells. Counting all rows turned sparse free-text columns (a Justification with two entries) into selects.
  2. Name-like identity columns may be `text` or `select`: an Assignee column with six people is inferred as `select`, and PRD's rule only named `text`. `identityCandidates` lists email columns first, then name-like ones.
  3. Dates are recognised by explicit patterns (ISO, `m/d/yyyy` with optional time and AM/PM, month names), not `Date.parse`, which accepts strings like "Item 2".
  4. `looksLikeLog` = ≥ 10 rows, a ≥ 90 %-filled date column whose sample rows are in ascending order (a form timestamp), and at most a third of the columns being fill-in candidates.

  Select columns also carry `options` (all distinct values) in the schema, for the spec generator.

- **2026-09-23 · P0-6 spike result: Plan A.** Amos checked it in Chrome: an iframe of `http://localhost:3000/extension/panel` in the side panel shows "Signed in as mail@amoshaviv.com", so the `SameSite=None; Secure` session cookie is sent and no `host_permissions` were needed. Phase 5 follows the full side-panel plan (P5-2/P5-3), not Plan B. Recheck on the production origin in P6-1.

- **2026-09-23 · P1-2 plain sign-in keeps the Sheets token.** The plan says a plain sign-in always overwrites `providerAccessToken`, but that token only carries `openid email profile`, so Sheets calls would fail until it expired while `hasSheetsScope()` still said true. Two changes: the Google provider always sends `include_granted_scopes=true`, so new tokens keep earlier grants; and `updateGoogleTokens` (`lib/google/oauth.ts`) does not replace a stored Sheets-scoped access token with one that lacks the scope. Scopes are merged, and the refresh token is overwritten only when Google sends a new one. `SHEETS_SCOPE` lives in `lib/google/scopes.ts` so the client page `/connect/google` does not import server code.

- **2026-09-23 · P0-4 closed without the two-account check.** Only one `@amoshaviv.com` Google account exists so far. Amos approved closing P0-4 on two checks: a script calling `ensureUserAndOrganization` directly (the second same-domain user joined the first's org as `user`, a personal email got its own org, and signing in again created no duplicates), and a real Google sign-in by mail@amoshaviv.com, which created org `amoshaviv` as owner. Repeat the real check with a second same-domain account once H-6 is done.

- **2026-09-23 · P0-2 token columns.** `users.provider_access_token`, `provider_refresh_token`, and `provider_access_token_permissions` are `TEXT` instead of flow-tester's `varchar(255)`, because Google documents access tokens up to 2048 bytes and the merged scope string grows in P1-2. Changed before the first `db:sync`, so no migration was needed.

- **2026-09-23 · P0-1 copy and strip.** flow-tester's `"latest"` ranges now resolve to MUI 9 and TypeScript 6, so dependencies are pinned to the versions flow-tester had locked (MUI `^7.3.6`, TypeScript `^5.9.3`, React `^19.2`, ESLint `^9` for the FlatCompat config copied from Podcust); Next resolves to 16.3. `app/profile` and `api/profile` were deleted (they depend on S3). The org settings route no longer accepts an image upload (S3 removed); it returns 400 if one is sent. The three legal pages held FlowTester-specific terms (billing, GitHub, test runs), so they are now short placeholders, not renamed copies. `ResetPasswordToken` was imported but never registered in flow-tester's `defineModels`; it is now registered so P0-2 creates its table. Invite emails use `SES_FROM_EMAIL`/`AWS_REGION` and are skipped with an error message when `SES_FROM_EMAIL` is unset. The sign-in page's Google button now honours `?callbackUrl=` (relative paths only) so the proxy redirect for `/a/*` and `/extension/*` returns the user to where they started.

- **2026-09-23 · LLM provider (PRD §9).** The hackathon requires Nebius Token Factory, so the Anthropic SDK plan was replaced before implementation started. Chosen: `zai-org/GLM-5.3` (`reasoning_effort: high`) for spec generation and editing, `zai-org/GLM-5.3-Flash` (`low`) for suggestions, `deepseek-ai/DeepSeek-V4.1-Flash` (`none`) as fallback. Basis: Nebius's public catalog (throughput and price), its chat-completion reference (`response_format: json_schema`, `reasoning_effort` enum, `max_completion_tokens` includes reasoning, default 8192), and Sept 2026 third-party rankings placing GLM-5.3 first among open-weight models. Unverified until P2-2 runs: that `json_schema` mode is accepted for these models on Nebius; the client falls back to `json_object` and zod validation covers both paths.
