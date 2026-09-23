"use client";

import * as React from "react";
import { Box, Container, AppBar, Toolbar, Button, Stack } from "@mui/material";
import Link from "next/link";
import { CookieSettingsLink } from "@/app/components/cookies";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0a0a0f",
        color: "#fff",
      }}
    >
      {/* Navigation */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "rgba(10, 10, 15, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1 }}>
            <Box
              component={Link}
              href="/"
              sx={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              <Box sx={{ color: "#fff", fontWeight: 700, fontSize: "1.25rem" }}>
                AutoApps
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={2}>
              <Button
                component={Link}
                href="/authentication/signin"
                variant="text"
                sx={{ color: "white" }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                href="/authentication/signup"
                variant="contained"
                sx={{
                  background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
                  },
                }}
              >
                Get Started
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Content */}
      <Container
        maxWidth="md"
        sx={{
          pt: { xs: 12, md: 14 },
          pb: { xs: 8, md: 12 },
        }}
      >
        <Box
          sx={{
            "& h1, & h2, & h3, & h4, & h5, & h6": {
              color: "#fff",
              fontWeight: 700,
              mt: 4,
              mb: 2,
            },
            "& h1": { fontSize: "2.5rem", mt: 0 },
            "& h2": { fontSize: "1.5rem" },
            "& h3": { fontSize: "1.25rem" },
            "& p": {
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.8,
              mb: 2,
            },
            "& ul, & ol": {
              color: "rgba(255,255,255,0.7)",
              pl: 3,
              mb: 2,
            },
            "& li": {
              mb: 1,
              lineHeight: 1.7,
            },
            "& a": {
              color: "#60a5fa",
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            },
            "& table": {
              width: "100%",
              borderCollapse: "collapse",
              mb: 3,
              "& th, & td": {
                border: "1px solid rgba(255,255,255,0.1)",
                p: 1.5,
                textAlign: "left",
                color: "rgba(255,255,255,0.7)",
              },
              "& th": {
                bgcolor: "rgba(255,255,255,0.05)",
                fontWeight: 600,
                color: "#fff",
              },
            },
          }}
        >
          {children}
        </Box>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
                © 2026 AutoApps. All rights reserved.
              </Box>
            </Stack>
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
              <Box
                component={Link}
                href="/privacy"
                sx={{ color: "text.secondary", fontSize: "0.875rem", "&:hover": { color: "white" } }}
              >
                Privacy
              </Box>
              <Box
                component={Link}
                href="/terms"
                sx={{ color: "text.secondary", fontSize: "0.875rem", "&:hover": { color: "white" } }}
              >
                Terms
              </Box>
              <Box
                component={Link}
                href="/cookies"
                sx={{ color: "text.secondary", fontSize: "0.875rem", "&:hover": { color: "white" } }}
              >
                Cookies
              </Box>
              <CookieSettingsLink />
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
