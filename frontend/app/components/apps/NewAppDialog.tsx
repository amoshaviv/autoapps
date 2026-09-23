"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export default function NewAppDialog({
  organizationSlug,
  open,
  onClose,
}: {
  organizationSlug: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<{ message: string; code?: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/organizations/${organizationSlug}/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetUrl: url.trim() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError({ message: body.error ?? "Could not read that sheet", code: body.code });
        return;
      }
      // A redirect after an action, not navigation a link could express
      router.push(`/${organizationSlug}/new?connectionId=${body.connection.id}`);
    } catch {
      setError({ message: "Could not reach AutoApps. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  const connectHref = `/connect/google?callbackUrl=${encodeURIComponent(`/${organizationSlug}?newApp=1`)}`;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit}>
        <DialogTitle>New app</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Paste the link of a Google Sheet. AutoApps reads its columns and suggests apps you can build on it.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Google Sheets link"
            placeholder="https://docs.google.com/spreadsheets/d/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
          {error && (
            <Alert
              severity={error.code === "sheets_not_connected" ? "info" : "error"}
              sx={{ mt: 2 }}
              action={
                error.code === "sheets_not_connected" ? (
                  <Button color="inherit" size="small" href={connectHref}>
                    Connect Google Sheets
                  </Button>
                ) : undefined
              }
            >
              {error.code === "sheets_not_connected"
                ? "AutoApps needs permission to read your Google Sheets."
                : error.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading || url.trim() === ""}>
            {loading ? "Reading sheet…" : "Continue"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
