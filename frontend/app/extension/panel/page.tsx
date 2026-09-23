// P0-6 spike: shows whether the side-panel iframe carries the session.
// Replaced by the real panel in P4-4.
import { getSession } from "@/lib/next-auth";

export default async function ExtensionPanelSpikePage() {
  const session = await getSession();
  const email = session?.user?.email;
  return (
    <main style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 18 }}>AutoApps panel</h1>
      <p data-testid="session-state">{email ? `Signed in as ${email}` : "signed out"}</p>
    </main>
  );
}
