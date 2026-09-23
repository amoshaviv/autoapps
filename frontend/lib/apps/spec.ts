// The AppSpec (PRD §6): what an app is. Generated and edited by the model,
// validated here and in validate.ts before it is stored or rendered.
import { z } from "zod";

export const COLUMN_TYPES = [
  "text",
  "longtext",
  "number",
  "currency",
  "date",
  "select",
  "checkbox",
  "email",
] as const;

export const ColumnDefSchema = z.object({
  header: z.string().min(1).describe("Exact header text in the sheet"),
  label: z.string().optional(),
  type: z.enum(COLUMN_TYPES),
  options: z.array(z.string()).optional().describe("select only"),
  required: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  help: z.string().optional(),
});

export const FilterSchema = z.object({
  column: z.string().min(1),
  op: z.enum(["eq", "neq", "contains", "gt", "lt", "empty", "not_empty"]),
  value: z
    .string()
    .optional()
    .describe('"$user.email" and "$user.name" are substituted at runtime'),
});

export const MyRowViewSchema = z.object({
  type: z.literal("my-row"),
  title: z.string().min(1),
  greeting: z.string().optional(),
  show: z.array(z.string()).min(1),
  editable: z.array(z.string()),
  submitLabel: z.string().optional(),
  successMessage: z.string().optional(),
});

export const FormViewSchema = z.object({
  type: z.literal("form"),
  title: z.string().min(1),
  fields: z.array(z.string()).min(1),
  submitLabel: z.string().optional(),
  successMessage: z.string().optional(),
});

export const TableViewSchema = z.object({
  type: z.literal("table"),
  title: z.string().min(1),
  columns: z.array(z.string()).min(1),
  filter: z.array(FilterSchema).optional(),
  sort: z.object({ column: z.string(), direction: z.enum(["asc", "desc"]) }).optional(),
  search: z.boolean().optional(),
  editable: z.array(z.string()).optional(),
});

export const MetricSchema = z.object({
  label: z.string().min(1),
  column: z.string().min(1),
  agg: z.enum(["count", "sum", "avg", "count_filled", "count_empty"]),
  filter: z.array(FilterSchema).optional(),
});

export const StatsViewSchema = z.object({
  type: z.literal("stats"),
  title: z.string().min(1),
  metrics: z.array(MetricSchema).min(1),
});

export const ViewSchema = z.discriminatedUnion("type", [
  MyRowViewSchema,
  FormViewSchema,
  TableViewSchema,
  StatsViewSchema,
]);

export const MAX_VIEWS = 4;
export const MAX_COLUMNS = 40;

export const AppSpecSchema = z.object({
  version: z.literal(1),
  title: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional().describe("A single emoji"),
  source: z.object({
    type: z.literal("google_sheets"),
    sheetTitle: z.string().min(1).describe("Tab name; must exist in the connection"),
    headerRow: z.number().int().min(1).describe("1-based"),
    keyColumn: z.string().optional().describe("Header whose value identifies a row"),
  }),
  columns: z.array(ColumnDefSchema).min(1).max(MAX_COLUMNS),
  identity: z
    .object({
      matchColumn: z.string().min(1).describe("Header compared to the signed-in user"),
      matchBy: z.enum(["email", "name"]),
      fallback: z.enum(["choose", "deny"]),
    })
    .optional(),
  views: z.array(ViewSchema).min(1).max(MAX_VIEWS),
  access: z.object({ audience: z.literal("organization") }),
});

export type ColumnType = (typeof COLUMN_TYPES)[number];
export type ColumnDef = z.infer<typeof ColumnDefSchema>;
export type Filter = z.infer<typeof FilterSchema>;
export type View = z.infer<typeof ViewSchema>;
export type Metric = z.infer<typeof MetricSchema>;
export type AppSpec = z.infer<typeof AppSpecSchema>;
