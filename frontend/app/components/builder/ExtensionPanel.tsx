"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBack from "@mui/icons-material/ArrowBack";
import OpenInNew from "@mui/icons-material/OpenInNew";
import { CopyLinkButton } from "@/app/components/apps/AppCard";
import { PreviewFrame } from "./BuilderShell";
import ChatPanel from "./ChatPanel";
import PublishBar from "./PublishBar";
import SheetSummary from "./SheetSummary";
import SuggestionsPanel from "./SuggestionsPanel";
import { ConnectionView, postJson } from "./types";
import { useBuilderApp } from "./useBuilderApp";

interface Me {
  user: { email: string; displayName: string };
  organizations: { slug: string; name: string; role: string }[];
  sheetsConnected: boolean;
}
interface SheetApp {
  slug: string;
  shortId: string;
  name: string;
  icon: string | null;
  status: "draft" | "published";
}

const POLL_MS = 3000;

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: "70vh", textAlign: "center", px: 1 }}>
      {children}
    </Stack>
  );
}

// Signed in? Sheets connected? Polls while the answer is "not yet", because
// sign-in and the Google grant happen in another tab.
function useMe() {
  const [me, setMe] = React.useState<Me | null | "signed-out">(null);
  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const next: Me | "signed-out" = response.status === 401 ? "signed-out" : await response.json();
        if (cancelled) return;
        setMe(next);
        if (next === "signed-out" || !next.sheetsConnected) timer = setTimeout(check, POLL_MS);
      } catch {
        if (!cancelled) timer = setTimeout(check, POLL_MS);
      }
    };
    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);
  return me;
}

function PanelBuilder({ organizationSlug, appSlug, onBack }: { organizationSlug: string; appSlug: string; onBack: () => void }) {
  const { data, error, reload, baseUrl } = useBuilderApp(organizationSlug, appSlug);
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button size="small" startIcon={<ArrowBack />} onClick={onBack}>
          This sheet&apos;s apps
        </Button>
        <Button
          size="small"
          href={`/${organizationSlug}/apps/${appSlug}`}
          target="_blank"
          rel="noopener"
          endIcon={<OpenInNew fontSize="small" />}
        >
          Open in AutoApps
        </Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {!data ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <PublishBar data={data} baseUrl={baseUrl} onChanged={reload} compact />
          {data.canEdit && <ChatPanel messages={data.messages} baseUrl={baseUrl} onChanged={reload} height={300} />}
          <PreviewFrame
            shortId={data.app.shortId}
            versionKey={data.canEdit ? data.app.draftVersionId : data.app.publishedVersionId}
            draft={data.canEdit}
          />
        </>
      )}
    </Stack>
  );
}

export default function ExtensionPanel({ spreadsheetId, gid }: { spreadsheetId?: string; gid?: number }) {
  const me = useMe();
  const [connection, setConnection] = React.useState<ConnectionView | null>(null);
  const [apps, setApps] = React.useState<SheetApp[]>([]);
  const [sheetError, setSheetError] = React.useState<{ message: string; code?: string } | null>(null);
  const [openApp, setOpenApp] = React.useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const organization = me && me !== "signed-out" ? me.organizations[0] : undefined;
  const ready = !!organization && me !== "signed-out" && !!me?.sheetsConnected;

  React.useEffect(() => {
    if (!ready || !spreadsheetId || !organization) return;
    setConnection(null);
    setSheetError(null);
    setOpenApp(null);
    postJson<{ connection: ConnectionView; apps: SheetApp[] }>(`/api/organizations/${organization.slug}/connections`, {
      spreadsheetId,
      gid,
    })
      .then(({ connection, apps }) => {
        setConnection(connection);
        setApps(apps);
        setShowSuggestions(apps.length === 0);
      })
      .catch((err: Error & { code?: string }) => setSheetError({ message: err.message, code: err.code }));
  }, [ready, spreadsheetId, gid, organization]);

  if (me === null) {
    return (
      <Centered>
        <CircularProgress />
      </Centered>
    );
  }

  if (me === "signed-out") {
    return (
      <Centered>
        <Typography variant="h6">Build apps from your sheets</Typography>
        <Typography color="text.secondary">Sign in to AutoApps to turn this sheet into an app your team can use.</Typography>
        <Button variant="contained" href="/authentication/signin?callbackUrl=/extension/connected" target="_blank" rel="noopener">
          Sign in to AutoApps
        </Button>
        <Typography variant="caption" color="text.secondary">
          This panel updates by itself once you&apos;re signed in.
        </Typography>
      </Centered>
    );
  }

  if (!organization) {
    return (
      <Centered>
        <Alert severity="warning">Your account isn&apos;t part of an organization yet. Open AutoApps in a tab to set one up.</Alert>
      </Centered>
    );
  }

  if (!me.sheetsConnected) {
    return (
      <Centered>
        <Typography variant="h6">Connect Google Sheets</Typography>
        <Typography color="text.secondary">AutoApps reads and updates your sheets on your behalf. Your colleagues never need access to them.</Typography>
        <Button variant="contained" href="/connect/google?callbackUrl=/extension/connected" target="_blank" rel="noopener">
          Connect Google Sheets
        </Button>
        <Typography variant="caption" color="text.secondary">
          This panel updates by itself once you&apos;re connected.
        </Typography>
      </Centered>
    );
  }

  if (!spreadsheetId) {
    return (
      <Centered>
        <Typography variant="h6">Open a Google Sheet to get started</Typography>
        <Typography color="text.secondary">AutoApps suggests apps for whichever sheet you&apos;re looking at.</Typography>
      </Centered>
    );
  }

  if (sheetError) {
    return <Alert severity="error">{sheetError.message}</Alert>;
  }

  if (!connection) {
    return (
      <Centered>
        <CircularProgress />
        <Typography color="text.secondary">Reading your sheet…</Typography>
      </Centered>
    );
  }

  if (openApp) {
    return <PanelBuilder organizationSlug={organization.slug} appSlug={openApp} onBack={() => setOpenApp(null)} />;
  }

  return (
    <Stack spacing={2}>
      <SheetSummary organizationSlug={organization.slug} connection={connection} onChange={setConnection} compact />

      {apps.length > 0 && (
        <>
          <Divider />
          <Typography variant="subtitle1" fontWeight={700}>
            Apps on this sheet
          </Typography>
          {apps.map((app) => (
            <Card key={app.slug}>
              <CardContent sx={{ pb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography aria-hidden>{app.icon ?? "🧩"}</Typography>
                  <Typography fontWeight={600} sx={{ flexGrow: 1 }} noWrap>
                    {app.name}
                  </Typography>
                  <Chip size="small" label={app.status === "published" ? "Live" : "Draft"} color={app.status === "published" ? "success" : "default"} />
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 1.5 }}>
                <Button size="small" variant="outlined" onClick={() => setOpenApp(app.slug)}>
                  Open
                </Button>
                {app.status === "published" && <CopyLinkButton shortId={app.shortId} />}
              </CardActions>
            </Card>
          ))}
          {!showSuggestions && (
            <Button variant="outlined" onClick={() => setShowSuggestions(true)}>
              Build another app
            </Button>
          )}
        </>
      )}

      {showSuggestions && (
        <>
          <Divider />
          <SuggestionsPanel
            organizationSlug={organization.slug}
            connection={connection}
            compact
            onCreated={(app) => {
              setApps((list) => [{ ...app, icon: null, status: "draft" }, ...list]);
              setOpenApp(app.slug);
            }}
          />
        </>
      )}
    </Stack>
  );
}
