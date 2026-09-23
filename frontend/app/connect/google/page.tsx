"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { SHEETS_SCOPE } from "@/lib/google/scopes";

export default function ConnectGooglePage() {
  React.useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("callbackUrl");
    const callbackUrl = requested?.startsWith("/") ? requested : "/";
    signIn(
      "google",
      { callbackUrl },
      {
        scope: `openid email profile ${SHEETS_SCOPE}`,
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
      }
    );
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography>Connecting Google Sheets…</Typography>
    </Box>
  );
}
