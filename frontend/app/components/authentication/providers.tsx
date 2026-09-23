"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { CookieProvider } from "@/app/components/cookies";

export default function Providers({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider session={session}>
      <CookieProvider>
        {children}
      </CookieProvider>
    </SessionProvider>
  );
}
