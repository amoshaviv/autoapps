"use client";

import * as React from "react";

export type CookieConsent = {
  necessary: boolean; // Always true
  functional: boolean;
  analytics: boolean;
};

type CookieConsentContextType = {
  consent: CookieConsent | null;
  isEU: boolean;
  showBanner: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (preferences: Omit<CookieConsent, "necessary">) => void;
  openSettings: () => void;
};

const CookieConsentContext = React.createContext<CookieConsentContextType | undefined>(undefined);

const CONSENT_COOKIE_NAME = "ft_consent";
const EU_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE", // EU members
  "GB", "NO", "IS", "LI", "CH" // UK, EEA, and Switzerland
];

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  // SameSite=None so a choice made on the site also holds inside the
  // extension's side panel, where the app runs in a cross-site iframe
  const sameSite = window.location.protocol === "https:" ? "SameSite=None;Secure" : "SameSite=Lax";
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;${sameSite}`;
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = React.useState<CookieConsent | null>(null);
  const [isEU, setIsEU] = React.useState(false);
  const [showBanner, setShowBanner] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Initialize consent from cookie and detect EU
  React.useEffect(() => {
    const savedConsent = getCookie(CONSENT_COOKIE_NAME);

    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        setConsent({
          necessary: true,
          functional: parsed.functional ?? false,
          analytics: parsed.analytics ?? false,
        });
      } catch {
        // Invalid cookie, will show banner
      }
    }

    // Detect if user is in EU using timezone heuristic first (fast, no API call)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const europeanTimezones = timezone.startsWith("Europe/") ||
      timezone === "Atlantic/Reykjavik" || // Iceland
      timezone === "Atlantic/Canary" || // Spain
      timezone === "Atlantic/Madeira" || // Portugal
      timezone === "Atlantic/Azores"; // Portugal

    if (europeanTimezones) {
      setIsEU(true);
      if (!savedConsent) {
        setShowBanner(true);
      }
    } else {
      // For non-European timezones, try geolocation API as fallback
      fetch("https://ipapi.co/json/", { cache: "force-cache" })
        .then((res) => res.json())
        .then((data) => {
          if (data.country_code && EU_COUNTRIES.includes(data.country_code)) {
            setIsEU(true);
            if (!savedConsent) {
              setShowBanner(true);
            }
          } else {
            // Non-EU: auto-accept all cookies
            setIsEU(false);
            if (!savedConsent) {
              const autoConsent = { necessary: true, functional: true, analytics: true };
              setConsent(autoConsent);
              setCookie(CONSENT_COOKIE_NAME, JSON.stringify(autoConsent), 365);
            }
          }
        })
        .catch(() => {
          // On error, assume non-EU and auto-accept
          if (!savedConsent) {
            const autoConsent = { necessary: true, functional: true, analytics: true };
            setConsent(autoConsent);
            setCookie(CONSENT_COOKIE_NAME, JSON.stringify(autoConsent), 365);
          }
        });
    }

    setIsInitialized(true);
  }, []);

  const acceptAll = React.useCallback(() => {
    const newConsent = { necessary: true, functional: true, analytics: true };
    setConsent(newConsent);
    setCookie(CONSENT_COOKIE_NAME, JSON.stringify(newConsent), 365);
    setShowBanner(false);
  }, []);

  const rejectNonEssential = React.useCallback(() => {
    const newConsent = { necessary: true, functional: false, analytics: false };
    setConsent(newConsent);
    setCookie(CONSENT_COOKIE_NAME, JSON.stringify(newConsent), 365);
    setShowBanner(false);
  }, []);

  const savePreferences = React.useCallback((preferences: Omit<CookieConsent, "necessary">) => {
    const newConsent = { necessary: true, ...preferences };
    setConsent(newConsent);
    setCookie(CONSENT_COOKIE_NAME, JSON.stringify(newConsent), 365);
    setShowBanner(false);
  }, []);

  const openSettings = React.useCallback(() => {
    setShowBanner(true);
  }, []);

  // Listen for custom event to open settings (from CookieSettingsLink)
  React.useEffect(() => {
    const handleOpenSettings = () => {
      setShowBanner(true);
    };

    window.addEventListener("openCookieSettings", handleOpenSettings);
    return () => {
      window.removeEventListener("openCookieSettings", handleOpenSettings);
    };
  }, []);

  // Don't render children until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return <>{children}</>;
  }

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        isEU,
        showBanner,
        acceptAll,
        rejectNonEssential,
        savePreferences,
        openSettings,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = React.useContext(CookieConsentContext);
  if (context === undefined) {
    // Return a safe default instead of throwing
    // This can happen during SSR or if component is outside provider
    return {
      consent: null,
      isEU: false,
      showBanner: false,
      acceptAll: () => {},
      rejectNonEssential: () => {},
      savePreferences: () => {},
      openSettings: () => {},
    };
  }
  return context;
}
