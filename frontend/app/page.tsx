import * as React from "react";
import type { Metadata } from "next";
import { redirect, RedirectType } from "next/navigation";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import LandingPage from "@/app/components/landing/LandingPage";
import { DEMO_VIDEO_ID } from "@/app/components/landing/video";

const description =
  "Open your data and AutoApps suggests the internal app your team needs, no prompt required. Tweak it in chat and share a link; each colleague sees and updates only their part. Google Sheets today, more business tools soon.";

export const metadata: Metadata = {
  title: { absolute: "AutoApps · Open your data, get the app suggested" },
  description,
  openGraph: {
    title: "AutoApps · Open your data, get the app suggested",
    description,
    type: "website",
    images: [{ url: `https://i.ytimg.com/vi/${DEMO_VIDEO_ID}/maxresdefault.jpg`, width: 1280, height: 720 }],
  },
  twitter: { card: "summary_large_image" },
};

export default async function Home() {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return <LandingPage />;

  const { User } = await getDBModels();
  const user = await User.findByEmail(email);
  if (!user) return <LandingPage />;

  const organizations = await user.getOrganizations();
  if (!organizations || organizations.length === 0) {
    redirect("/organizations/new", RedirectType.push);
  }

  redirect(`/${organizations[0].slug}`, RedirectType.push);
}
