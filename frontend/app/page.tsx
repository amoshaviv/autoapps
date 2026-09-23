import * as React from "react";
import { redirect, RedirectType } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";

function Landing() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <Typography variant="h3" component="h1" fontWeight={700}>
          Turn any Google Sheet into an app your team can use.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Open a sheet, describe what you need in plain words, and share a link.
          Your colleagues sign in with their company account and see only their
          part. The sheet stays the source of truth.
        </Typography>
        <Box>
          <Button variant="contained" size="large" href="/authentication/signin">
            Sign in with Google
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default async function Home() {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return <Landing />;

  const { User } = await getDBModels();
  const user = await User.findByEmail(email);
  if (!user) return <Landing />;

  const organizations = await user.getOrganizations();
  if (!organizations || organizations.length === 0) {
    redirect("/organizations/new", RedirectType.push);
  }

  redirect(`/${organizations[0].slug}`, RedirectType.push);
}
