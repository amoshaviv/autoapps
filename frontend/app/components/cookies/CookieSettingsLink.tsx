"use client";

import * as React from "react";
import { Link as MuiLink } from "@mui/material";

interface CookieSettingsLinkProps {
  sx?: object;
  children?: React.ReactNode;
}

// Create a local context reference to check availability
const CookieConsentContext = React.createContext<unknown>(undefined);

function useCookieConsentSafe() {
  const [context, setContext] = React.useState<{
    openSettings: () => void;
    isEU: boolean;
  } | null>(null);

  React.useEffect(() => {
    // Dynamically import and use the hook inside useEffect
    import("./CookieConsentContext").then((module) => {
      // We need to access the context value through a component
      // This is handled by the parent component wrapping
    });
  }, []);

  return context;
}

export default function CookieSettingsLink({ sx, children }: CookieSettingsLinkProps) {
  const [state, setState] = React.useState<{
    isEU: boolean;
    openSettings: (() => void) | null;
    ready: boolean;
  }>({
    isEU: false,
    openSettings: null,
    ready: false,
  });

  React.useEffect(() => {
    // Access the cookie consent from the window/document cookie directly
    // to determine if user is in EU and has the banner available
    const checkEU = async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isEuropeanTimezone = timezone.startsWith("Europe/") ||
        timezone === "Atlantic/Reykjavik" ||
        timezone === "Atlantic/Canary" ||
        timezone === "Atlantic/Madeira" ||
        timezone === "Atlantic/Azores";

      if (isEuropeanTimezone) {
        setState({ isEU: true, openSettings: null, ready: true });
      } else {
        // Check via API for non-European timezones
        try {
          const res = await fetch("https://ipapi.co/json/", { cache: "force-cache" });
          const data = await res.json();
          const EU_COUNTRIES = [
            "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
            "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
            "PL", "PT", "RO", "SK", "SI", "ES", "SE",
            "GB", "NO", "IS", "LI", "CH"
          ];
          setState({
            isEU: EU_COUNTRIES.includes(data.country_code),
            openSettings: null,
            ready: true,
          });
        } catch {
          setState({ isEU: false, openSettings: null, ready: true });
        }
      }
    };

    checkEU();
  }, []);

  // Don't render until we know if user is in EU
  if (!state.ready || !state.isEU) {
    return null;
  }

  const handleClick = () => {
    // Dispatch a custom event that the CookieConsentProvider listens for
    window.dispatchEvent(new CustomEvent("openCookieSettings"));
  };

  return (
    <MuiLink
      component="button"
      onClick={handleClick}
      sx={{
        color: "text.secondary",
        fontSize: "0.875rem",
        background: "none",
        border: "none",
        cursor: "pointer",
        textDecoration: "none",
        "&:hover": { color: "white", textDecoration: "underline" },
        ...sx,
      }}
    >
      {children || "Cookie Settings"}
    </MuiLink>
  );
}
