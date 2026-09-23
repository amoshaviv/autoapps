import * as React from "react";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";

export default async function OrganizationAppsPage(props: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) redirect("/authentication/signin");

  const { organizationSlug } = await props.params;
  const { Organization } = await getDBModels();
  const organization = await Organization.findBySlugAndUserEmail(
    organizationSlug,
    email
  );
  if (!organization) redirect("/");

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1">
        Apps
      </Typography>
    </Container>
  );
}
