"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import AppRenderer from "@/app/components/runtime/AppRenderer";
import ActivityList from "./ActivityList";
import ChatPanel from "./ChatPanel";
import PublishBar from "./PublishBar";
import VersionsList from "./VersionsList";
import { useBuilderApp } from "./useBuilderApp";

export function PreviewFrame({ shortId, versionKey, draft }: { shortId: string; versionKey: string | null; draft: boolean }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, position: "relative" }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ position: "absolute", top: 8, right: 12, textTransform: "uppercase", letterSpacing: 1 }}
      >
        Preview
      </Typography>
      {/* Remount on each new version so the preview reloads the spec */}
      <AppRenderer key={versionKey ?? "none"} shortId={shortId} draft={draft} />
    </Paper>
  );
}

export default function BuilderShell({ organizationSlug, appSlug }: { organizationSlug: string; appSlug: string }) {
  const { data, error, reload, baseUrl } = useBuilderApp(organizationSlug, appSlug);
  const [tab, setTab] = React.useState(0);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) {
    return (
      <>
        <Skeleton width="40%" height={48} />
        <Skeleton variant="rounded" height={400} sx={{ mt: 2 }} />
      </>
    );
  }

  if (!data.canEdit) {
    return (
      <>
        <PublishBar data={data} baseUrl={baseUrl} onChanged={reload} />
        <Box sx={{ mt: 3 }}>
          {data.published ? (
            <PreviewFrame shortId={data.app.shortId} versionKey={data.app.publishedVersionId} draft={false} />
          ) : (
            <Alert severity="info">This app hasn&apos;t been published yet.</Alert>
          )}
        </Box>
      </>
    );
  }

  return (
    <>
      <PublishBar data={data} baseUrl={baseUrl} onChanged={reload} />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2, mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Preview" />
        <Tab label="Versions" />
        <Tab label="Activity" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <ChatPanel messages={data.messages} baseUrl={baseUrl} onChanged={reload} />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <PreviewFrame shortId={data.app.shortId} versionKey={data.app.draftVersionId} draft />
          </Grid>
        </Grid>
      )}
      {tab === 1 && <VersionsList data={data} baseUrl={baseUrl} onChanged={reload} />}
      {tab === 2 && <ActivityList baseUrl={baseUrl} />}
    </>
  );
}
