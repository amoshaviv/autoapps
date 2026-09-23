"use client";

import * as React from "react";
import type { AppSpec } from "@/lib/apps/spec";

export interface BuilderVersion {
  id: string;
  number: number;
  summary: string | null;
  createdAt: string;
  spec?: AppSpec;
}
export interface BuilderMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  versionId: string | null;
  createdAt: string;
}
export interface BuilderApp {
  app: {
    id: string;
    slug: string;
    shortId: string;
    name: string;
    icon: string | null;
    description: string | null;
    status: "draft" | "published";
    draftVersionId: string | null;
    publishedVersionId: string | null;
  };
  draft: BuilderVersion | null;
  published: BuilderVersion | null;
  messages: BuilderMessage[];
  versions: BuilderVersion[];
  canEdit: boolean;
}

export function useBuilderApp(organizationSlug: string, appSlug: string) {
  const url = `/api/organizations/${organizationSlug}/apps/${appSlug}`;
  const [data, setData] = React.useState<BuilderApp | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    try {
      const response = await fetch(url);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not load the app");
      setData(body);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the app");
    }
  }, [url]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, reload, setData, baseUrl: url };
}
