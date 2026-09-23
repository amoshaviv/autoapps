"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { timeAgo } from "@/utils/date";

interface Activity {
  id: string;
  action: "row_updated" | "row_appended";
  rowNumber: number;
  changes: Record<string, { from: string; to: string }>;
  createdAt: string;
  user: { email: string; displayName: string; profileImageURL: string | null };
}

export default function ActivityList({ baseUrl }: { baseUrl: string }) {
  const [activities, setActivities] = React.useState<Activity[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`${baseUrl}/activity`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Could not load activity");
        setActivities(body.activities);
      })
      .catch((err: Error) => setError(err.message));
  }, [baseUrl]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!activities) return <Skeleton variant="rounded" height={120} />;
  if (activities.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        Nothing yet. Changes people make through the app show up here.
      </Typography>
    );
  }

  return (
    <Paper variant="outlined">
      <List disablePadding>
        {activities.map((a, i) => {
          const columns = Object.keys(a.changes);
          const what =
            a.action === "row_appended"
              ? "added a row"
              : `updated ${columns.join(", ") || `row ${a.rowNumber}`}`;
          return (
            <ListItem key={a.id} divider={i < activities.length - 1}>
              <ListItemAvatar>
                <Avatar src={a.user.profileImageURL ?? undefined}>{a.user.displayName[0]?.toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={`${a.user.email} ${what}`} secondary={`Row ${a.rowNumber} · ${timeAgo(a.createdAt)}`} />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
}
