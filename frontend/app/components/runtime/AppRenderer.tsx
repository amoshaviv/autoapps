"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import FormView from "./FormView";
import MyRowView from "./MyRowView";
import StatsView from "./StatsView";
import TableView from "./TableView";
import { runtimeUrl, RuntimeApp, useJson } from "./useAppData";

export default function AppRenderer({ shortId, draft = false }: { shortId: string; draft?: boolean }) {
  const { data, error, loading } = useJson<RuntimeApp>(runtimeUrl(shortId, "", {}, draft));
  const [tab, setTab] = React.useState(0);

  if (loading && !data) {
    return (
      <Stack spacing={2}>
        <Skeleton width="50%" height={48} />
        <Skeleton width="70%" />
        <Skeleton variant="rounded" height={240} />
      </Stack>
    );
  }

  if (error) {
    if (error.code === "app_not_published") {
      return <Alert severity="info">This app hasn&apos;t been published yet. Check back soon.</Alert>;
    }
    return <Alert severity={error.status === 403 ? "warning" : "error"}>{error.message}</Alert>;
  }
  if (!data) return null;

  const { spec, viewer } = data;
  const index = Math.min(tab, spec.views.length - 1);
  const view = spec.views[index];
  const common = { shortId, draft, viewIndex: index, spec };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        {spec.icon && (
          <Typography component="span" fontSize={32} lineHeight={1} aria-hidden>
            {spec.icon}
          </Typography>
        )}
        <Typography variant="h4" component="h1" fontWeight={700}>
          {spec.title}
        </Typography>
      </Stack>
      {spec.description && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {spec.description}
        </Typography>
      )}

      {spec.views.length > 1 && (
        <Tabs value={index} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }} variant="scrollable">
          {spec.views.map((v, i) => (
            <Tab key={i} label={v.title} />
          ))}
        </Tabs>
      )}
      {spec.views.length === 1 && <Box sx={{ mb: 2 }} />}

      <Box key={index}>
        {view.type === "my-row" && <MyRowView {...common} view={view} viewer={viewer} />}
        {view.type === "form" && <FormView {...common} view={view} />}
        {view.type === "table" && <TableView {...common} view={view} />}
        {view.type === "stats" && <StatsView {...common} view={view} />}
      </Box>
    </Box>
  );
}
