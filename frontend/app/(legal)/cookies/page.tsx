import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  alternates: {
    canonical: "/cookies",
  },
};

export default function CookiesPage() {
  return (
    <>
      <h1>Cookie Policy</h1>
      <p>
        AutoApps is a prototype. This page will be written before the service is
        offered publicly.
      </p>
    </>
  );
}
