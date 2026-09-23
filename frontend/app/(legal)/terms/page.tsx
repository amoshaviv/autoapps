import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Use</h1>
      <p>
        AutoApps is a prototype. This page will be written before the service is
        offered publicly.
      </p>
    </>
  );
}
