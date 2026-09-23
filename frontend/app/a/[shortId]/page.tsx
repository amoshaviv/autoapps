import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import AppRenderer from "@/app/components/runtime/AppRenderer";
import RuntimeTopBar from "../RuntimeTopBar";

export const metadata: Metadata = { title: "App" };

export default async function RuntimeAppPage(props: { params: Promise<{ shortId: string }> }) {
  const { shortId } = await props.params;
  const session = await getSession();
  const email = session?.user?.email;
  // The proxy redirects signed-out visitors too; this is the backstop
  if (!email) redirect(`/authentication/signin?callbackUrl=${encodeURIComponent(`/a/${shortId}`)}`);

  const { User, App, Organization } = await getDBModels();
  const user = await User.findByEmail(email);
  if (!user) redirect(`/authentication/signin?callbackUrl=${encodeURIComponent(`/a/${shortId}`)}`);

  const app = /^[A-Za-z0-9]{10}$/.test(shortId) ? await App.findByShortId(shortId) : null;
  const membership = app?.organization
    ? await Organization.findBySlugAndUserEmailWithRole(app.organization.slug, email)
    : null;

  let body: React.ReactNode;
  if (!app) {
    body = <Alert severity="warning">This link doesn&apos;t point to an app. Check that you copied all of it.</Alert>;
  } else if (!membership) {
    body = (
      <Alert severity="info">
        This app belongs to {app.organization?.name}. Ask an admin to invite you.
      </Alert>
    );
  } else {
    body = <AppRenderer shortId={shortId} />;
  }

  return (
    <>
      <RuntimeTopBar
        user={{ email, displayName: user.displayName, profileImageURL: user.profileImageURL }}
      />
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        {body}
      </Container>
    </>
  );
}
