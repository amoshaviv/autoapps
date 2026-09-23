import * as React from "react";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import AppsGrid from "@/app/components/apps/AppsGrid";
import type { AppSummary } from "@/app/components/apps/AppCard";

export default async function OrganizationAppsPage(props: {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<{ newApp?: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) redirect("/authentication/signin");

  const { organizationSlug } = await props.params;
  const { newApp } = await props.searchParams;
  const { Organization, App } = await getDBModels();
  const organization = await Organization.findBySlugAndUserEmail(organizationSlug, email);
  if (!organization) redirect("/");

  const apps = await App.findAll({
    where: { organizationId: organization.id },
    include: [
      { association: "connection", attributes: ["title"] },
      { association: "createdBy", attributes: ["email", "displayName", "profileImageURL"] },
    ],
    order: [["updatedAt", "DESC"]],
  });

  const summaries: AppSummary[] = apps.map((app) => {
    const creator = (app as unknown as { createdBy: AppSummary["creator"] }).createdBy;
    return {
      slug: app.slug,
      shortId: app.shortId,
      name: app.name,
      icon: app.icon,
      description: app.description,
      status: app.status,
      sheetTitle: app.connection?.title ?? null,
      creator: {
        email: creator.email,
        displayName: creator.displayName,
        profileImageURL: creator.profileImageURL,
      },
    };
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <AppsGrid apps={summaries} organizationSlug={organizationSlug} openNewApp={newApp === "1"} />
    </Container>
  );
}
