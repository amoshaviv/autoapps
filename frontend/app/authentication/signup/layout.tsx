import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create an AutoApps account.",
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
