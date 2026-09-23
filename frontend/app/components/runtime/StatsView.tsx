"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { runtimeUrl, useJson } from "./useAppData";
import type { AppSpec } from "@/lib/apps/spec";

type StatsView = Extract<AppSpec["views"][number], { type: "stats" }>;

export default function StatsView({
  shortId,
  draft,
  viewIndex,
  view,
  spec,
}: {
  shortId: string;
  draft: boolean;
  viewIndex: number;
  view: StatsView;
  spec: AppSpec;
}) {
  const { data, error, loading } = useJson<{ metrics: { label: string; value: number }[] }>(
    runtimeUrl(shortId, "/rows", { view: viewIndex }, draft)
  );

  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <Grid container spacing={2}>
      {view.metrics.map((metric, i) => {
        const value = data?.metrics[i]?.value;
        const column = spec.columns.find((c) => c.header === metric.column);
        const money = column?.type === "currency" && (metric.agg === "sum" || metric.agg === "avg");
        return (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {metric.label}
                </Typography>
                {loading || value === undefined ? (
                  <Skeleton width={80} height={40} />
                ) : (
                  <Typography variant="h4" component="p" fontWeight={600}>
                    {money ? "$" : ""}
                    {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
