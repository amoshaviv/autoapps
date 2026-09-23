"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { timeAgo } from "@/utils/date";
import type { BuilderApp } from "./useBuilderApp";

export default function VersionsList({
  data,
  baseUrl,
  onChanged,
}: {
  data: BuilderApp;
  baseUrl: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const restore = async (versionId: string) => {
    setBusy(versionId);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/versions/${versionId}/restore`, { method: "POST" });
      if (!response.ok) throw new Error((await response.json()).error ?? "Could not restore");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Paper variant="outlined">
      {error && <Alert severity="error">{error}</Alert>}
      <List disablePadding>
        {data.versions.map((v, i) => {
          const isDraft = v.id === data.app.draftVersionId;
          const isLive = v.id === data.app.publishedVersionId;
          return (
            <ListItem
              key={v.id}
              divider={i < data.versions.length - 1}
              secondaryAction={
                !isDraft && (
                  <Button size="small" onClick={() => restore(v.id)} disabled={busy !== null}>
                    {busy === v.id ? "Restoring…" : "Restore"}
                  </Button>
                )
              }
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>Version {v.number}</span>
                    {isDraft && <Chip size="small" label="Draft" />}
                    {isLive && <Chip size="small" color="success" label="Live" />}
                  </Stack>
                }
                secondary={`${v.summary ?? ""}${v.summary ? " · " : ""}${timeAgo(v.createdAt)}`}
                sx={{ pr: 10 }}
              />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
}
