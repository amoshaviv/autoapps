"use client";

import * as React from "react";
import type { AppSpec } from "@/lib/apps/spec";

export interface RuntimeRow {
  rowNumber: number;
  values: Record<string, string>;
  key?: string;
}

export interface RuntimeApp {
  app: { name: string; icon: string | null; description: string | null };
  spec: AppSpec;
  viewer: { email: string; name: string; canEdit: boolean };
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, body.error ?? `Request failed (${response.status})`, body.code);
  }
  return body as T;
}

export function runtimeUrl(shortId: string, path = "", params: Record<string, string | number | undefined> = {}, draft = false) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) search.set(k, String(v));
  if (draft) search.set("draft", "1");
  const query = search.toString();
  return `/api/apps/${encodeURIComponent(shortId)}${path}${query ? `?${query}` : ""}`;
}

// Loads JSON from url; reload() refetches. url === null skips loading.
export function useJson<T>(url: string | null) {
  const [state, setState] = React.useState<{ data: T | null; error: ApiError | null; loading: boolean }>({
    data: null,
    error: null,
    loading: url !== null,
  });
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    if (url === null) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    apiFetch<T>(url)
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((error: ApiError) => !cancelled && setState({ data: null, error, loading: false }));
    return () => {
      cancelled = true;
    };
  }, [url, nonce]);

  const reload = React.useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload, setData: (data: T) => setState((s) => ({ ...s, data })) };
}
