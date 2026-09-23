"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import SheetSummary from "./SheetSummary";
import SuggestionsPanel from "./SuggestionsPanel";
import { ConnectionView, postJson } from "./types";

export default function NewAppFlow({
  organizationSlug,
  initialConnection,
  spreadsheetId,
  gid,
}: {
  organizationSlug: string;
  initialConnection: ConnectionView | null;
  spreadsheetId?: string;
  gid?: number;
}) {
  const router = useRouter();
  const [connection, setConnection] = React.useState<ConnectionView | null>(initialConnection);
  const [error, setError] = React.useState<{ message: string; code?: string } | null>(null);

  // Opened with ?spreadsheetId (the extension's link): read the sheet first
  React.useEffect(() => {
    if (initialConnection || !spreadsheetId) return;
    postJson<{ connection: ConnectionView }>(`/api/organizations/${organizationSlug}/connections`, { spreadsheetId, gid })
      .then(({ connection }) => setConnection(connection))
      .catch((err: Error & { code?: string }) => setError({ message: err.message, code: err.code }));
  }, [initialConnection, organizationSlug, spreadsheetId, gid]);

  if (error) {
    if (error.code === "sheets_not_connected") {
      const back = `/${organizationSlug}/new?spreadsheetId=${spreadsheetId}${gid !== undefined ? `&gid=${gid}` : ""}`;
      return (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" href={`/connect/google?callbackUrl=${encodeURIComponent(back)}`}>
              Connect Google Sheets
            </Button>
          }
        >
          AutoApps needs permission to read your Google Sheets.
        </Alert>
      );
    }
    return <Alert severity="error">{error.message}</Alert>;
  }

  if (!connection) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Skeleton width="40%" height={36} />
        <Skeleton width="25%" />
        <Skeleton variant="rounded" height={32} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <SheetSummary organizationSlug={organizationSlug} connection={connection} onChange={setConnection} />
      </Paper>
      <Divider sx={{ mb: 3 }} />
      <SuggestionsPanel
        organizationSlug={organizationSlug}
        connection={connection}
        // A redirect after creating the app, not navigation a link could express
        onCreated={(app) => router.push(`/${organizationSlug}/apps/${app.slug}`)}
      />
    </Box>
  );
}
