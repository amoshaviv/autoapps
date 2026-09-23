"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import FieldInput from "./FieldInput";
import { apiFetch, runtimeUrl } from "./useAppData";
import type { AppSpec } from "@/lib/apps/spec";

type FormView = Extract<AppSpec["views"][number], { type: "form" }>;

export default function FormView({
  shortId,
  draft,
  viewIndex,
  view,
  spec,
}: {
  shortId: string;
  draft: boolean;
  viewIndex: number;
  view: FormView;
  spec: AppSpec;
}) {
  const empty = React.useMemo(() => Object.fromEntries(view.fields.map((f) => [f, ""])), [view.fields]);
  const [values, setValues] = React.useState<Record<string, string>>(empty);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // Unchecked checkboxes are sent as FALSE; other blank fields are left out
      const payload = Object.fromEntries(
        view.fields
          .map((f) => {
            const type = spec.columns.find((c) => c.header === f)?.type;
            return [f, type === "checkbox" && !values[f] ? "FALSE" : values[f]] as const;
          })
          .filter(([, v]) => v !== "")
      );
      await apiFetch(runtimeUrl(shortId, "/rows", {}, draft), {
        method: "POST",
        body: JSON.stringify({ view: viewIndex, values: payload }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <CheckCircleOutline color="success" sx={{ fontSize: 56 }} />
        <Typography variant="h6" sx={{ mt: 1 }}>
          {view.successMessage ?? "Thanks! Your response was saved."}
        </Typography>
        <Button
          sx={{ mt: 3 }}
          variant="outlined"
          onClick={() => {
            setValues(empty);
            setDone(false);
          }}
        >
          Submit another
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={submit} noValidate>
      <Stack spacing={2.5}>
        {view.fields.map((field) => {
          const column = spec.columns.find((c) => c.header === field);
          if (!column) return null;
          return (
            <FieldInput
              key={field}
              column={column}
              value={values[field] ?? ""}
              disabled={submitting}
              onChange={(v) => setValues((s) => ({ ...s, [field]: v }))}
            />
          );
        })}
        {error && <Alert severity="error">{error}</Alert>}
        <Box>
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? "Sending…" : (view.submitLabel ?? "Submit")}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
