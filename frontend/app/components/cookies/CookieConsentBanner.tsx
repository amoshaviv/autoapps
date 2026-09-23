"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Collapse,
  FormControlLabel,
  Switch,
  Link as MuiLink,
} from "@mui/material";
import Link from "next/link";
import { useCookieConsent } from "./CookieConsentContext";

export default function CookieConsentBanner() {
  const { showBanner, acceptAll, rejectNonEssential, savePreferences } = useCookieConsent();
  const pathname = usePathname();
  const [showSettings, setShowSettings] = React.useState(false);
  const [functionalEnabled, setFunctionalEnabled] = React.useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(true);

  // Never in the extension's side panel: it is part of the product, loads no
  // analytics, and a banner there would cover the builder
  if (!showBanner || pathname?.startsWith("/extension/")) {
    return null;
  }

  const handleSavePreferences = () => {
    savePreferences({
      functional: functionalEnabled,
      analytics: analyticsEnabled,
    });
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        p: { xs: 2, md: 3 },
        pointerEvents: "none",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          maxWidth: 600,
          mx: "auto",
          p: 3,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          backdropFilter: "blur(10px)",
          borderRadius: 2,
          pointerEvents: "auto",
        }}
      >
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
          Cookie Preferences
        </Typography>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, lineHeight: 1.6 }}>
          We use cookies to enhance your experience. Essential cookies are required for the site to function.
          Analytics cookies help us improve our service.{" "}
          <MuiLink component={Link} href="/cookies" sx={{ color: "primary.light" }}>
            Learn more
          </MuiLink>
        </Typography>

        <Collapse in={showSettings}>
          <Box sx={{ mb: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Stack spacing={2}>
              <Box>
                <FormControlLabel
                  control={<Switch checked disabled />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Strictly Necessary
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Required for authentication, security, and core functionality
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: "flex-start", m: 0 }}
                />
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={functionalEnabled}
                      onChange={(e) => setFunctionalEnabled(e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Functional
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Remembers your preferences like language and display settings
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: "flex-start", m: 0 }}
                />
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Analytics
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Helps us understand how you use the site to improve it
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: "flex-start", m: 0 }}
                />
              </Box>
            </Stack>
          </Box>
        </Collapse>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          {showSettings ? (
            <>
              <Button
                variant="contained"
                onClick={handleSavePreferences}
                sx={{
                  flex: 1,
                  background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
                  },
                }}
              >
                Save Preferences
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowSettings(false)}
                sx={{
                  flex: 1,
                  borderColor: "divider",
                  color: "text.primary",
                  "&:hover": {
                    borderColor: "text.secondary",
                    bgcolor: "action.hover",
                  },
                }}
              >
                Back
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                onClick={acceptAll}
                sx={{
                  flex: 1,
                  background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
                  },
                }}
              >
                Accept All
              </Button>
              <Button
                variant="outlined"
                onClick={rejectNonEssential}
                sx={{
                  flex: 1,
                  borderColor: "divider",
                  color: "text.primary",
                  "&:hover": {
                    borderColor: "text.secondary",
                    bgcolor: "action.hover",
                  },
                }}
              >
                Reject Non-Essential
              </Button>
              <Button
                variant="text"
                onClick={() => setShowSettings(true)}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "text.primary",
                    bgcolor: "action.hover",
                  },
                }}
              >
                Customize
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
