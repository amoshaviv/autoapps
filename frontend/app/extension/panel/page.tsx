import * as React from "react";
import type { Metadata } from "next";
import ExtensionPanel from "@/app/components/builder/ExtensionPanel";

export const metadata: Metadata = { title: "Side panel" };

export default async function ExtensionPanelPage(props: {
  searchParams: Promise<{ spreadsheetId?: string; gid?: string }>;
}) {
  const { spreadsheetId, gid } = await props.searchParams;
  return (
    <ExtensionPanel
      spreadsheetId={spreadsheetId && /^[a-zA-Z0-9-_]+$/.test(spreadsheetId) ? spreadsheetId : undefined}
      gid={gid && /^\d+$/.test(gid) ? Number(gid) : undefined}
    />
  );
}
