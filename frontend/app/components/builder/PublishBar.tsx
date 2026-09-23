"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import OpenInNew from "@mui/icons-material/OpenInNew";
import { CopyLinkButton } from "@/app/components/apps/AppCard";
import type { BuilderApp } from "./useBuilderApp";

export default function PublishBar({
  data,
  baseUrl,
  onChanged,
  compact = false,
}: {
  data: BuilderApp;
  baseUrl: string;
  onChanged: () => void;
  compact?: boolean;
}) {
  const { app, canEdit } = data;
  const [name, setName] = React.useState(app.name);
  const [publishing, setPublishing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => setName(app.name), [app.name]);

  const upToDate = !!app.publishedVersionId && app.publishedVersionId === app.draftVersionId;

  const rename = async () => {
    const next = name.trim();
    if (!next || next === app.name) return setName(app.name);
    const response = await fetch(baseUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: next }),
    });
    if (!response.ok) setName(app.name);
    onChanged();
  };

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/publish`, { method: "POST" });
      if (!response.ok) throw new Error((await response.json()).error ?? "Could not publish");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <Stack
        direction={compact ? "column" : { xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={compact ? "stretch" : { md: "center" }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography fontSize={compact ? 24 : 32} lineHeight={1} aria-hidden>
            {app.icon ?? "🧩"}
          </Typography>
          {canEdit ? (
            <InputBase
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={rename}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              inputProps={{ "aria-label": "App name" }}
              sx={{ fontSize: compact ? 18 : 26, fontWeight: 700, flexGrow: 1, minWidth: 0 }}
            />
          ) : (
            <Typography variant="h5" fontWeight={700} noWrap>
              {app.name}
            </Typography>
          )}
          <Chip
            size="small"
            label={app.status === "published" ? (upToDate ? "Live" : "Live · unpublished changes") : "Draft"}
            color={app.status === "published" ? (upToDate ? "success" : "warning") : "default"}
          />
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {canEdit && (
            <Button variant="contained" onClick={publish} disabled={publishing || upToDate || !app.draftVersionId}>
              {publishing ? "Publishing…" : app.status === "published" ? "Publish changes" : "Publish"}
            </Button>
          )}
          {app.status === "published" && (
            <>
              <CopyLinkButton shortId={app.shortId} size="medium" />
              <Button href={`/a/${app.shortId}`} target="_blank" rel="noopener" endIcon={<OpenInNew fontSize="small" />}>
                Open live
              </Button>
            </>
          )}
        </Stack>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}
    </>
  );
}
