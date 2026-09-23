import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import NewAppFlow from "@/app/components/builder/NewAppFlow";
import type { ConnectionView } from "@/app/components/builder/types";

export const metadata: Metadata = { title: "New app" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewAppPage(props: {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<{ connectionId?: string; spreadsheetId?: string; gid?: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  const { organizationSlug } = await props.params;
  const query = await props.searchParams;
  if (!email) {
    const back = `/${organizationSlug}/new?${new URLSearchParams(query as Record<string, string>).toString()}`;
    redirect(`/authentication/signin?callbackUrl=${encodeURIComponent(back)}`);
  }

  const { Organization, Connection } = await getDBModels();
  const organization = await Organization.findBySlugAndUserEmail(organizationSlug, email);
  if (!organization) redirect("/");

  let initialConnection: ConnectionView | null = null;
  if (query.connectionId && UUID.test(query.connectionId)) {
    const connection = await Connection.findOne({
      where: { id: query.connectionId, organizationId: organization.id },
    });
    if (connection) {
      initialConnection = {
        id: connection.id,
        title: connection.title,
        sheets: connection.sheets,
        schema: connection.schema,
        schemaFetchedAt: connection.schemaFetchedAt?.toISOString() ?? null,
      };
    }
  }

  const spreadsheetId = query.spreadsheetId && /^[a-zA-Z0-9-_]+$/.test(query.spreadsheetId) ? query.spreadsheetId : undefined;
  const gid = query.gid && /^\d+$/.test(query.gid) ? Number(query.gid) : undefined;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 3 }}>
        New app
      </Typography>
      {initialConnection || spreadsheetId ? (
        <NewAppFlow
          organizationSlug={organizationSlug}
          initialConnection={initialConnection}
          spreadsheetId={spreadsheetId}
          gid={gid}
        />
      ) : (
        <Alert severity="info">Start from the Apps page: click “New app” and paste a Google Sheets link.</Alert>
      )}
    </Container>
  );
}
