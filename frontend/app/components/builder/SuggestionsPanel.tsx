"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ConnectionView, Idea, postJson } from "./types";

const ARCHETYPE_LABEL: Record<Idea["archetype"], string> = {
  "my-row": "Each person fills their own",
  form: "Form",
  table: "Board / tracker",
  stats: "Dashboard",
  mixed: "Dashboard + list",
};

const PROGRESS = [
  "Reading your columns…",
  "Designing your app…",
  "Choosing fields and labels…",
  "Checking it against your sheet…",
  "Almost there…",
];

export interface CreatedApp {
  slug: string;
  shortId: string;
  name: string;
}

export default function SuggestionsPanel({
  organizationSlug,
  connection,
  onCreated,
  compact = false,
}: {
  organizationSlug: string;
  connection: ConnectionView;
  onCreated: (app: CreatedApp) => void;
  compact?: boolean;
}) {
  const [ideas, setIdeas] = React.useState<Idea[] | null>(null);
  const [ideasError, setIdeasError] = React.useState<string | null>(null);
  const [prompt, setPrompt] = React.useState("");
  const [creating, setCreating] = React.useState<string | null>(null);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState(0);

  // Re-suggest whenever the sheet is re-read (tab or header row changed)
  const schemaKey = `${connection.id}:${connection.schemaFetchedAt}`;
  const loadIdeas = React.useCallback(async () => {
    setIdeas(null);
    setIdeasError(null);
    try {
      const { ideas } = await postJson<{ ideas: Idea[] }>(
        `/api/organizations/${organizationSlug}/connections/${connection.id}/suggest`
      );
      setIdeas(ideas);
    } catch (err) {
      setIdeasError(err instanceof Error ? err.message : "Could not load suggestions");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationSlug, schemaKey]);

  React.useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  React.useEffect(() => {
    if (!creating) return;
    setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, PROGRESS.length - 1)), 6000);
    return () => clearInterval(timer);
  }, [creating]);

  const create = async (body: { idea?: Idea; prompt?: string }, label: string) => {
    setCreating(label);
    setCreateError(null);
    try {
      const { app } = await postJson<{ app: CreatedApp }>(`/api/organizations/${organizationSlug}/apps`, {
        connectionId: connection.id,
        ...body,
      });
      onCreated(app);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create the app");
      setCreating(null);
    }
  };

  if (creating) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          {PROGRESS[step]}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {creating}
        </Typography>
        <LinearProgress sx={{ maxWidth: 360, mx: "auto" }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Suggested apps
      </Typography>

      {ideasError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={loadIdeas}>Retry</Button>}>
          {ideasError}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {(ideas ?? [null, null, null]).map((idea, i) => (
          <Grid key={i} size={compact ? 12 : { xs: 12, md: 4 }}>
            {idea ? (
              <Card sx={{ height: "100%" }}>
                <CardActionArea
                  sx={{ height: "100%", alignItems: "stretch" }}
                  onClick={() => create({ idea }, idea.title)}
                >
                  <CardContent>
                    <Chip size="small" label={ARCHETYPE_LABEL[idea.archetype]} sx={{ mb: 1 }} />
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      {idea.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {idea.pitch}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ) : (
              <Skeleton variant="rounded" height={compact ? 110 : 160} />
            )}
          </Grid>
        ))}
      </Grid>

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (prompt.trim()) create({ prompt: prompt.trim() }, prompt.trim());
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Or describe the app you want
        </Typography>
        <Stack direction={compact ? "column" : { xs: "column", sm: "row" }} spacing={1}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="e.g. Each owner fills in their own budget line and explains big changes"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (prompt.trim()) create({ prompt: prompt.trim() }, prompt.trim());
              }
            }}
          />
          <Button type="submit" variant="contained" disabled={!prompt.trim()} sx={{ flexShrink: 0 }}>
            Build it
          </Button>
        </Stack>
      </Box>

      {createError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {createError}
        </Alert>
      )}
    </Box>
  );
}
