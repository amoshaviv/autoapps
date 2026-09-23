import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import BuilderShell from "@/app/components/builder/BuilderShell";

export const metadata: Metadata = { title: "App builder" };

export default async function BuilderPage(props: {
  params: Promise<{ organizationSlug: string; appSlug: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  const { organizationSlug, appSlug } = await props.params;
  if (!email) {
    redirect(`/authentication/signin?callbackUrl=${encodeURIComponent(`/${organizationSlug}/apps/${appSlug}`)}`);
  }

  const { Organization, App } = await getDBModels();
  const organization = await Organization.findBySlugAndUserEmail(organizationSlug, email);
  if (!organization) redirect("/");
  const app = await App.findBySlugInOrg(organizationSlug, appSlug);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {app ? (
        <BuilderShell organizationSlug={organizationSlug} appSlug={appSlug} />
      ) : (
        <Alert severity="warning">This app doesn&apos;t exist, or it was deleted.</Alert>
      )}
    </Container>
  );
}
