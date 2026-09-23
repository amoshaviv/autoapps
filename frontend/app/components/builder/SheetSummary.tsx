"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ConnectionView, postJson } from "./types";

const TYPE_LABEL: Record<string, string> = {
  text: "Text",
  longtext: "Long text",
  number: "Number",
  currency: "Money",
  date: "Date",
  select: "Choice",
  checkbox: "Checkbox",
  email: "Email",
};

export default function SheetSummary({
  organizationSlug,
  connection,
  onChange,
  compact = false,
}: {
  organizationSlug: string;
  connection: ConnectionView;
  onChange: (connection: ConnectionView) => void;
  compact?: boolean;
}) {
  const schema = connection.schema;
  const [headerRow, setHeaderRow] = React.useState(String(schema?.headerRow ?? 1));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showFix, setShowFix] = React.useState(false);

  React.useEffect(() => setHeaderRow(String(schema?.headerRow ?? 1)), [schema?.headerRow]);

  const refresh = async (body: { sheetTitle?: string; headerRow?: number }) => {
    setBusy(true);
    setError(null);
    try {
      const { connection: next } = await postJson<{ connection: ConnectionView }>(
        `/api/organizations/${organizationSlug}/connections/${connection.id}/refresh`,
        body
      );
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not re-read the sheet");
    } finally {
      setBusy(false);
    }
  };

  if (!schema) return <Alert severity="warning">This sheet has not been read yet.</Alert>;

  return (
    <Box>
      <Stack direction={compact ? "column" : { xs: "column", sm: "row" }} spacing={1.5} alignItems={compact ? "stretch" : { sm: "center" }} sx={{ mb: 1.5 }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant={compact ? "subtitle1" : "h5"} fontWeight={700} noWrap>
            {connection.title ?? "Untitled spreadsheet"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {schema.rowCount} rows · {schema.headers.length} columns · header on row {schema.headerRow}
          </Typography>
        </Box>
        {connection.sheets.length > 1 && (
          <TextField
            select
            size="small"
            label="Tab"
            value={schema.sheetTitle}
            disabled={busy}
            onChange={(e) => refresh({ sheetTitle: e.target.value })}
            sx={{ minWidth: 180 }}
          >
            {connection.sheets.map((s) => (
              <MenuItem key={s.sheetId} value={s.title}>
                {s.title}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>

      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ mb: 1 }}>
        {schema.headers.map((h) => (
          <Tooltip
            key={h.index}
            title={`${TYPE_LABEL[h.inferredType] ?? h.inferredType} · ${Math.round(h.fillRatio * 100)}% filled${h.samples.length ? ` · e.g. ${h.samples.slice(0, 2).join(", ")}` : ""}`}
          >
            <Chip size="small" label={h.name} variant={h.fillRatio < 0.5 ? "outlined" : "filled"} />
          </Tooltip>
        ))}
      </Stack>

      {showFix ? (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
          <TextField
            size="small"
            type="number"
            label="Header row"
            value={headerRow}
            onChange={(e) => setHeaderRow(e.target.value)}
            slotProps={{ htmlInput: { min: 1 } }}
            sx={{ width: 120 }}
          />
          <Button
            size="small"
            variant="outlined"
            disabled={busy || !(Number(headerRow) >= 1)}
            onClick={() => refresh({ headerRow: Number(headerRow) })}
          >
            {busy ? "Reading…" : "Use this row"}
          </Button>
        </Stack>
      ) : (
        <Button size="small" onClick={() => setShowFix(true)} sx={{ px: 0 }}>
          Wrong header row?
        </Button>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
