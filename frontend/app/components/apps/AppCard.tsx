"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import TableChartOutlined from "@mui/icons-material/TableChartOutlined";

export interface AppSummary {
  slug: string;
  shortId: string;
  name: string;
  icon: string | null;
  description: string | null;
  status: "draft" | "published";
  sheetTitle: string | null;
  creator: { email: string; displayName: string; profileImageURL: string | null };
}

// Clipboard API first; inside an iframe without clipboard permission, fall
// back to a hidden textarea and execCommand("copy")
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

export function CopyLinkButton({ shortId, size = "small" }: { shortId: string; size?: "small" | "medium" }) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle");
  const url = `/a/${shortId}`;
  return (
    <Tooltip title={state === "failed" ? `Copy failed. The link is ${typeof window === "undefined" ? url : window.location.origin + url}` : ""}>
      <Button
        size={size}
        color={state === "failed" ? "error" : "primary"}
        onClick={async () => {
          const ok = await copyText(`${window.location.origin}${url}`);
          setState(ok ? "copied" : "failed");
          setTimeout(() => setState("idle"), ok ? 2000 : 6000);
        }}
      >
        {state === "copied" ? "Copied!" : state === "failed" ? "Copy failed" : "Copy link"}
      </Button>
    </Tooltip>
  );
}

export default function AppCard({ app, organizationSlug }: { app: AppSummary; organizationSlug: string }) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Typography fontSize={32} lineHeight={1} aria-hidden>
            {app.icon ?? "🧩"}
          </Typography>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" component="h2" noWrap title={app.name}>
              {app.name}
            </Typography>
            <Chip
              size="small"
              label={app.status === "published" ? "Published" : "Draft"}
              color={app.status === "published" ? "success" : "default"}
              variant={app.status === "published" ? "filled" : "outlined"}
            />
          </Box>
          <Tooltip title={`Created by ${app.creator.displayName}`}>
            <Avatar src={app.creator.profileImageURL ?? undefined} sx={{ width: 28, height: 28 }}>
              {app.creator.displayName[0]?.toUpperCase()}
            </Avatar>
          </Tooltip>
        </Stack>
        {app.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {app.description}
          </Typography>
        )}
        {app.sheetTitle && (
          <Stack direction="row" spacing={0.75} alignItems="center" color="text.secondary">
            <TableChartOutlined fontSize="small" />
            <Typography variant="caption" noWrap>
              {app.sheetTitle}
            </Typography>
          </Stack>
        )}
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button variant="outlined" size="small" href={`/${organizationSlug}/apps/${app.slug}`}>
          Open
        </Button>
        {app.status === "published" && <CopyLinkButton shortId={app.shortId} />}
      </CardActions>
    </Card>
  );
}
