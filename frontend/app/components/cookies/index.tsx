"use client";

import * as React from "react";
import { CookieConsentProvider } from "./CookieConsentContext";
import CookieConsentBanner from "./CookieConsentBanner";
import GoogleAnalytics from "./GoogleAnalytics";

export { CookieConsentProvider, useCookieConsent } from "./CookieConsentContext";
export { default as CookieConsentBanner } from "./CookieConsentBanner";
export { default as GoogleAnalytics } from "./GoogleAnalytics";
export { default as CookieSettingsLink } from "./CookieSettingsLink";

// Combined provider that includes everything
export function CookieProvider({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider>
      <React.Suspense fallback={null}>
        <GoogleAnalytics />
      </React.Suspense>
      {children}
      <CookieConsentBanner />
    </CookieConsentProvider>
  );
}
