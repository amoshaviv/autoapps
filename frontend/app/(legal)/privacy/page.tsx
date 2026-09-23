import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>
        AutoApps is a prototype. This page will be written before the service is
        offered publicly.
      </p>
    </>
  );
}
