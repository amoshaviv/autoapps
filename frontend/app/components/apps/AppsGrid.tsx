"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import AppCard, { AppSummary } from "./AppCard";
import NewAppDialog from "./NewAppDialog";

export default function AppsGrid({
  apps,
  organizationSlug,
  openNewApp = false,
}: {
  apps: AppSummary[];
  organizationSlug: string;
  openNewApp?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(openNewApp);

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Apps
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          New app
        </Button>
      </Stack>

      {apps.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10, border: 1, borderColor: "divider", borderRadius: 2, borderStyle: "dashed" }}>
          <Typography variant="h6" gutterBottom>
            No apps yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Start from any Google Sheet: paste its link and pick one of the suggested apps.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            New app
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {apps.map((app) => (
            <Grid key={app.slug} size={{ xs: 12, sm: 6, md: 4 }}>
              <AppCard app={app} organizationSlug={organizationSlug} />
            </Grid>
          ))}
        </Grid>
      )}

      <NewAppDialog organizationSlug={organizationSlug} open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
