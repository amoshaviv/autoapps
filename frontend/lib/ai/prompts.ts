// Prompt text for suggestApps, generateSpec and editSpec (PRD §9).
// The only sheet inputs are the extracted schema and analyzeShape's hints.
import { ConnectionSchema } from "@/lib/google/schema";
import { analyzeShape, preferredIdentityColumns } from "@/lib/apps/shape";

const list = (items: string[]) => (items.length ? items.map((i) => `"${i}"`).join(", ") : "none");
const truncate = (value: string, max = 40) => (value.length > max ? `${value.slice(0, max)}…` : value);

export function describeSchema(connection: { title: string | null; schema: ConnectionSchema }): string {
  const { schema } = connection;
  const hints = analyzeShape(schema);

  const lines = [
    `# Spreadsheet "${connection.title ?? "Untitled"}", tab "${schema.sheetTitle}"`,
    `Header row: ${schema.headerRow}. Data rows: ${schema.rowCount}.`,
    "",
    "## Columns (exact header, inferred type, fill ratio, distinct values, samples)",
    ...schema.headers.map((h) => {
      const samples = h.samples.slice(0, 3).map((s) => `"${truncate(s)}"`).join(", ");
      const options = h.options ? `; options: ${h.options.map((o) => `"${o}"`).join(", ")}` : "";
      return `- "${h.name}": ${h.inferredType}, fill ${h.fillRatio}, ${h.distinctCount} distinct; samples: ${samples || "none"}${options}`;
    }),
    "",
    "## Shape hints",
    `- Identity candidates (columns that identify a person): ${
      preferredIdentityColumns(schema, hints)
        .map((name) => {
          const h = schema.headers.find((x) => x.name === name)!;
          const perPerson = h.distinctCount ? Math.round((schema.rowCount * h.fillRatio) / h.distinctCount * 10) / 10 : 0;
          return `"${name}" (${perPerson} rows per person)`;
        })
        .join(", ") || "none"
    }`,
    `- Fill-in candidates (mostly empty, meant to be completed): ${list(hints.fillInCandidates)}`,
    `- Status columns: ${list(hints.statusColumns)}`,
    `- Date columns: ${list(hints.dateColumns)}`,
    `- Numeric columns: ${list(hints.numericColumns)}`,
    `- Key candidates (identify a row): ${list(hints.keyCandidates)}`,
    `- Looks like a log (rows appended over time): ${hints.looksLikeLog ? "yes" : "no"}`,
    `- Empty columns: ${hints.emptyColumnCount}`,
  ];
  return lines.join("\n");
}

const ARCHETYPE_RULES = `Archetypes:
- my-row: each person sees and completes only their own row.
- form: anyone submits a new entry (appends a row).
- table: a board / directory / tracker view with filters, sorting and search, optionally with inline-editable status.
- stats: totals and progress (count, sum, average, filled/empty counts).
- mixed: a combination, usually stats plus a table.

Archetype rules:
- Identity candidate present and fill-in candidates present → my-row ("each person completes their own line").
- Looks like a log, or few rows with clear field columns → form ("submit a new entry").
- Status or category columns and more than ~15 rows → table with filters ("board / directory / tracker view"), optionally with inline-editable status.
- Numeric columns → stats ("totals and progress"), usually combined with a table as a mixed app.
- When a sheet fits nothing well, suggest a read-only table with search plus a form, and say so in the pitch.`;

const PROMPTING_RULES = `Rules:
- Use header names exactly as given; never invent columns.
- Prefer my-row when a column looks like emails or people's names and the request is about "each person filling their own".
- Keep apps small: one or two views unless asked. Write labels and help text for humans, not developers.
- summary is one or two sentences addressed to the builder.
- Return only the JSON object, no prose and no code fence.`;

export const SUGGEST_SYSTEM = `You help non-technical people turn a Google Sheet into a small internal app that colleagues use through a link. Given a sheet's columns and shape hints, propose exactly three app ideas.

${ARCHETYPE_RULES}

The three ideas must use three different archetypes. Each idea has a short title, a one-line pitch written for the sheet owner, and its archetype.

When the sheet has an identity candidate, exactly one idea must be scoped to the signed-in person and set identityColumn to that exact header. People sign in with their email, so use an email column whenever the sheet has one; use a name column only when there is no email column. Base the idea's shape on that column's rows per person:
- my-row when each person has about one row (rows per person ≈ 1), e.g. each owner fills in their own line;
- otherwise a table that shows only that person's rows (a person owns several rows, e.g. a manager and their reports).
Do not suggest my-row or set identityColumn when the sheet has no identity candidate.

${PROMPTING_RULES}`;

const SPEC_GUIDE = `An app is an AppSpec JSON document rendered by a fixed set of four view types; no code runs.
- source.sheetTitle and source.headerRow must equal the tab and header row given. Set source.keyColumn to a key candidate when there is one.
- columns lists every header the app touches, each with the closest type; select columns list their options. Mark columns people must not change as readOnly.
- Every header used by a view must also appear in columns.
- my-row views need identity: matchColumn is the header compared to the signed-in user, matchBy "email" for an email column or "name" for a name column, fallback "choose" (let them pick a row) or "deny". editable must be a subset of show, and never include readOnly columns.
- form views append a row. When identity.matchBy is "email", leave the identity column out of fields; the server fills it with the signed-in user's email. No other column is filled automatically: columns left out of fields stay empty in the new row (there is no automatic timestamp).
- table views may filter, sort, search, and make some columns editable. Filter values "$user.email" and "$user.name" are replaced with the signed-in user's.
- stats views show metrics: count, sum, avg, count_filled, count_empty, each optionally filtered.
- At most 4 views and 40 columns. access.audience is always "organization". version is always 1. icon is a single emoji.`;

export const GENERATE_SYSTEM = `You design small internal apps on top of a Google Sheet for non-technical people. Given the sheet's columns and shape hints and the builder's request (or a chosen idea), return { spec, summary }.

${SPEC_GUIDE}

${ARCHETYPE_RULES}

${PROMPTING_RULES}`;

export const EDIT_SYSTEM = `You edit an existing internal app built on a Google Sheet. You get the sheet's columns and shape hints, the current AppSpec, the recent conversation, and the builder's new message. Return { spec, summary } where spec is the full updated AppSpec and summary says in one or two sentences what changed.

Editing rules:
- Start from the current AppSpec and change only what the builder asked for.
- Keep every view, and within each view every filter, sort, search, editable list and column, unless the request changes it. Filters with "$user.email" or "$user.name" decide who sees which rows; never drop them unless asked.
- When the request is about an existing view, change that view in place. Add a new view only when the builder asks for one; never duplicate a view.
- Removing a column from a view also removes it from that view's editable list.

${SPEC_GUIDE}

${PROMPTING_RULES}`;
