"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FieldInput, { isChecked } from "./FieldInput";
import { ApiError, apiFetch, runtimeUrl, RuntimeRow, useJson } from "./useAppData";
import type { AppSpec } from "@/lib/apps/spec";

type MyRowView = Extract<AppSpec["views"][number], { type: "my-row" }>;
type Candidate = { rowNumber: number; label: string };

const plain = (v: string) => v.replace(/[$€£,]/g, "").trim();

export default function MyRowView({
  shortId,
  draft,
  viewIndex,
  view,
  spec,
  viewer,
}: {
  shortId: string;
  draft: boolean;
  viewIndex: number;
  view: MyRowView;
  spec: AppSpec;
  viewer: { email: string; name: string };
}) {
  const [picked, setPicked] = React.useState<number | undefined>();
  const { data, error, loading, reload } = useJson<{ row: RuntimeRow | null; candidates?: Candidate[] }>(
    runtimeUrl(shortId, "/rows", { view: viewIndex, row: picked }, draft)
  );
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const row = data?.row ?? null;
  React.useEffect(() => {
    if (row) setValues(row.values);
  }, [row]);

  const columnOf = (header: string) => spec.columns.find((c) => c.header === header);
  const readOnlyFields = view.show.filter((h) => !view.editable.includes(h));
  const firstName = viewer.name.split(" ")[0] || viewer.email;

  const changed = row
    ? view.editable.filter((h) => {
        const type = columnOf(h)?.type;
        const before = row.values[h] ?? "";
        const after = values[h] ?? "";
        if (type === "currency" || type === "number") return plain(before) !== plain(after);
        if (type === "checkbox") return isChecked(before) !== isChecked(after);
        return before !== after;
      })
    : [];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!row || changed.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await apiFetch(runtimeUrl(shortId, `/rows/${row.rowNumber}`, {}, draft), {
        method: "PATCH",
        body: JSON.stringify({
          view: viewIndex,
          values: Object.fromEntries(changed.map((h) => [h, values[h] ?? ""])),
          expectedKey: row.key,
        }),
      });
      setSaved(true);
      reload();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save");
      if (err instanceof ApiError && err.code === "row_moved") reload();
    } finally {
      setSaving(false);
    }
  };

  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (loading && !data) {
    return (
      <Stack spacing={2}>
        <Skeleton width="40%" height={36} />
        <Skeleton variant="rounded" height={56} />
        <Skeleton variant="rounded" height={56} />
      </Stack>
    );
  }

  const candidates = data?.candidates;

  if (!row && candidates) {
    return (
      <Stack spacing={2}>
        <Typography variant="h6">Hi {firstName}, which line is yours?</Typography>
        <Typography color="text.secondary">
          We couldn&apos;t match {viewer.email} to a row. Pick yours to continue.
        </Typography>
        <Autocomplete
          options={candidates}
          getOptionLabel={(c) => c.label}
          isOptionEqualToValue={(a, b) => a.rowNumber === b.rowNumber}
          onChange={(_, c) => c && setPicked(c.rowNumber)}
          renderInput={(params) => <TextField {...params} label="Find your row" />}
        />
      </Stack>
    );
  }

  if (!row) {
    return (
      <Alert severity="info">
        There is no row for {viewer.email} in this app. Ask the person who shared it to add you.
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={save} noValidate>
      <Stack spacing={2.5}>
        <Typography variant="h6">{view.greeting ?? `Hi ${firstName}`}</Typography>

        {candidates && candidates.length > 1 && (
          <TextField
            select
            size="small"
            label="Your lines"
            value={row.rowNumber}
            onChange={(e) => setPicked(Number(e.target.value))}
            sx={{ maxWidth: 360 }}
          >
            {candidates.map((c) => (
              <MenuItem key={c.rowNumber} value={c.rowNumber}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>
        )}

        {readOnlyFields.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 2,
            }}
          >
            {readOnlyFields.map((h) => {
              const column = columnOf(h);
              const value = row.values[h] ?? "";
              return (
                <Box key={h}>
                  <Typography variant="caption" color="text.secondary">
                    {column?.label ?? h}
                  </Typography>
                  <Typography>
                    {column?.type === "checkbox" ? (isChecked(value) ? "Yes" : "No") : value || "—"}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}

        {readOnlyFields.length > 0 && view.editable.length > 0 && <Divider />}

        {view.editable.map((h) => {
          const column = columnOf(h);
          if (!column) return null;
          return (
            <FieldInput
              key={h}
              column={column}
              value={values[h] ?? ""}
              disabled={saving}
              onChange={(v) => setValues((s) => ({ ...s, [h]: v }))}
            />
          );
        })}

        {saveError && <Alert severity="error">{saveError}</Alert>}

        {view.editable.length > 0 && (
          <Box>
            <Button type="submit" variant="contained" size="large" disabled={saving || changed.length === 0}>
              {saving ? "Saving…" : (view.submitLabel ?? "Save")}
            </Button>
          </Box>
        )}
      </Stack>
      <Snackbar
        open={saved}
        autoHideDuration={4000}
        onClose={() => setSaved(false)}
        message={view.successMessage ?? "Saved"}
      />
    </Box>
  );
}
