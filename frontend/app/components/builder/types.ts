import type { ConnectionSchema } from "@/lib/google/schema";

export interface ConnectionView {
  id: string;
  title: string | null;
  sheets: { sheetId: number; title: string }[];
  schema: ConnectionSchema | null;
  schemaFetchedAt: string | null;
}

export interface Idea {
  title: string;
  pitch: string;
  archetype: "my-row" | "form" | "table" | "stats" | "mixed";
  identityColumn?: string;
}

export async function postJson<T>(url: string, body: unknown = {}): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error ?? `Request failed (${response.status})`) as Error & { code?: string; status?: number };
    error.code = data.code;
    error.status = response.status;
    throw error;
  }
  return data as T;
}
