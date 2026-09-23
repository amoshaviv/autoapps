"use client";

import * as React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import ChatOutlined from "@mui/icons-material/ChatOutlined";
import PersonPinOutlined from "@mui/icons-material/PersonPinOutlined";
import DashboardCustomizeOutlined from "@mui/icons-material/DashboardCustomizeOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import ExtensionOutlined from "@mui/icons-material/ExtensionOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import LockPersonOutlined from "@mui/icons-material/LockPersonOutlined";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import FactCheckOutlined from "@mui/icons-material/FactCheckOutlined";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import DemoVideo from "./DemoVideo";

const SIGN_IN = "/authentication/signin";
const gradientText = {
  background: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

function Logo() {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" component="a" href="/" sx={{ textDecoration: "none", color: "text.primary" }}>
      <Box component="img" src="/logo.png" alt="" sx={{ width: 30, height: 30, borderRadius: 1.5 }} />
      <Typography variant="h6" fontWeight={800} letterSpacing={-0.3}>
        AutoApps
      </Typography>
    </Stack>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: React.ReactNode; subtitle?: string }) {
  return (
    <Box sx={{ textAlign: "center", maxWidth: 720, mx: "auto", mb: { xs: 5, md: 7 } }}>
      <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 1.5 }}>
        {eyebrow}
      </Typography>
      <Typography variant="h3" component="h2" fontWeight={800} letterSpacing={-0.8} sx={{ mt: 1, fontSize: { xs: "2rem", md: "2.75rem" } }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" sx={{ mt: 2, fontSize: { md: "1.125rem" } }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

const NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#integrations", label: "Integrations" },
  { href: "#use-cases", label: "Use cases" },
  { href: "#faq", label: "FAQ" },
];

const TRUST = [
  "Apps suggested automatically, no prompt needed",
  "Your system of record stays the source of truth",
  "From your data to a shareable link in minutes",
  "No code, no migration",
];

const STEPS = [
  {
    title: "Connect your data",
    body: "Start from a Google Sheet: click the AutoApps badge, or paste its link. AutoApps reads the structure: who each record belongs to, what's still empty, which fields hold statuses and numbers.",
  },
  {
    title: "Get suggestions, automatically",
    body: "You don't have to ask. AutoApps proposes three apps that fit this data, like “each owner fills in their own line” or a status board. Pick one, or describe something else in your own words.",
  },
  {
    title: "Refine it in chat",
    body: "“Make Justification required.” “Hide the Notes column.” Every message updates the live preview, and every version is kept.",
  },
  {
    title: "Share the link",
    body: "Publish and copy the link. Colleagues sign in and see only their part; their changes land straight in the source.",
  },
];

const FEATURES = [
  {
    icon: AutoAwesomeOutlined,
    title: "Suggested in context, before you ask",
    body: "No blank page and no prompt to write. AutoApps works out which fields identify a person, which need filling in, and which hold statuses or numbers, and proposes the apps that make sense, right next to the data you're looking at.",
  },
  {
    icon: ChatOutlined,
    title: "Build and edit by chat",
    body: "Describe changes in plain words. No JSON, no formulas, no drag-and-drop editor to learn.",
  },
  {
    icon: PersonPinOutlined,
    title: "Everyone sees only their part",
    body: "Each person gets their own row, or only the rows filtered to them. The server enforces it on every read and write.",
  },
  {
    icon: DashboardCustomizeOutlined,
    title: "Four building blocks",
    body: "Personal row, form, filterable board with inline editing, and live totals: combined into tabs when an app needs more than one.",
  },
  {
    icon: HistoryOutlined,
    title: "Versions and activity",
    body: "Restore any earlier version of an app, and see who changed which cells through it, and when.",
  },
  {
    icon: ExtensionOutlined,
    title: "Right where you work",
    body: "The Chrome extension opens AutoApps in a side panel next to the Google Sheet you're looking at, and follows you as you switch. More tools will follow.",
  },
];

const USE_CASES = [
  { emoji: "💰", title: "Budget planning", body: "Each cost-center owner fills in their own quarterly numbers and a justification, while Finance watches the totals." },
  { emoji: "✅", title: "Team task boards", body: "A shared board where each assignee updates the status of their own tasks, sorted by priority." },
  { emoji: "📦", title: "Inventory", body: "A searchable stock list with low-stock totals, and a form to log new counts." },
  { emoji: "🎟️", title: "Event sign-ups", body: "An RSVP form that fills in each person's email automatically, plus a headcount dashboard." },
  { emoji: "🧑‍💼", title: "Onboarding", body: "Managers see only their new hires and tick off onboarding as it's done." },
  { emoji: "📋", title: "Any business process", body: "Trackers, directories, approvals, request logs: if your team keeps chasing updates to it, it can become an app." },
];

const SECURITY = [
  { icon: LockPersonOutlined, title: "Colleagues never touch the source", body: "People use the app, not the spreadsheet or system behind it. They need no access to it, and the app never exposes where the data lives." },
  { icon: ShieldOutlined, title: "Permissions enforced on the server", body: "Which rows and columns each person may read or change is decided on the server from the app's definition, never by the browser." },
  { icon: ApartmentOutlined, title: "Scoped to your organization", body: "People sign in with Google and join the organization that matches their company email domain." },
  { icon: FactCheckOutlined, title: "Every change is recorded", body: "Each edit made through an app is logged with who made it and what changed." },
];

// What AutoApps actually suggested for the budget fixture sheet in testing
const HERO_SUGGESTIONS = [
  { kind: "Each person fills their own", title: "Fill in your budget line", pitch: "Each cost-center owner sees only their line and completes Q1–Q4 and a justification." },
  { kind: "Board / tracker", title: "Budget review board", pitch: "Every cost center with its status, filterable, with statuses editable inline." },
  { kind: "Dashboard + list", title: "Budget progress", pitch: "Totals per quarter and how many lines are submitted or approved." },
];

// Planned connectors, shown as "coming soon" only. None of these work yet.
const COMING_SOON = [
  { category: "HR and people", tools: ["Workday", "BambooHR", "SAP SuccessFactors"] },
  { category: "ERP and finance", tools: ["SAP", "Oracle NetSuite", "Microsoft Dynamics 365"] },
  { category: "CRM and sales", tools: ["Salesforce", "HubSpot"] },
  { category: "Spreadsheets and work management", tools: ["Microsoft Excel", "Airtable", "Smartsheet"] },
  { category: "IT and service", tools: ["ServiceNow", "Jira"] },
  { category: "Databases and warehouses", tools: ["PostgreSQL", "Snowflake"] },
];

const FAQ = [
  {
    q: "Which tools does AutoApps work with?",
    a: "Google Sheets today: any sheet with a header row, from budgets and trackers to inventories, form responses and rosters. AutoApps doesn't expect particular column names; it reads the data and adapts. Integrations with Microsoft Excel, Salesforce, Workday, SAP and more are on the way (see Integrations above).",
  },
  {
    q: "Do my colleagues need access to the underlying system?",
    a: "No. The app reads and writes the data with the builder's permission. Colleagues only sign in to AutoApps with their company account, and only see what the app shows them.",
  },
  {
    q: "Where does my data live?",
    a: "In your own system: today, your Google Sheet. AutoApps stores the app definitions, their versions and chat history, an activity log, and a short summary of each connected source (field names, types and a few sample values) used to design apps.",
  },
  {
    q: "What if the app isn't quite right?",
    a: "Tell it what to change in the chat. Every change is a new version, and you can restore any earlier version. Nothing reaches your colleagues until you publish.",
  },
  {
    q: "Do I need the Chrome extension?",
    a: "No. The extension is a shortcut that opens AutoApps next to your Google Sheet. You can do everything in the web app by pasting the sheet's link.",
  },
  {
    q: "Who can use a published app?",
    a: "Anyone in your organization with the link. Each person sees only what the app allows them to: their own row, rows filtered to them, a form, or totals.",
  },
];

export default function LandingPage() {
  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      {/* Navigation */}
      <AppBar position="sticky">
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 3, minHeight: { xs: 60, md: 68 } }}>
            <Logo />
            <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" }, ml: 3, flexGrow: 1 }}>
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} underline="none" color="text.secondary" sx={{ fontWeight: 500, "&:hover": { color: "text.primary" } }}>
                  {item.label}
                </Link>
              ))}
            </Stack>
            <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />
            <Button href={SIGN_IN} color="inherit" sx={{ display: { xs: "none", sm: "inline-flex" } }}>
              Sign in
            </Button>
            <Button href={SIGN_IN} variant="contained">
              Get started
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero */}
      <Box
        component="section"
        sx={{
          pt: { xs: 7, md: 11 },
          pb: { xs: 8, md: 12 },
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(59,130,246,0.14) 0%, rgba(6,182,212,0.06) 45%, rgba(255,255,255,0) 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", maxWidth: 860, mx: "auto" }}>
            <Chip
              icon={<AutoAwesomeOutlined sx={{ fontSize: 18 }} />}
              label="Open your data, get the app suggested · Google Sheets now, Workday, SAP and more soon"
              sx={{
                mb: 3,
                fontWeight: 600,
                bgcolor: "rgba(37,99,235,0.08)",
                color: "primary.dark",
                height: "auto",
                maxWidth: "100%",
                "& .MuiChip-label": { whiteSpace: "normal", py: 0.75 },
              }}
            />
            <Typography
              component="h1"
              fontWeight={800}
              letterSpacing={-1.5}
              sx={{ fontSize: { xs: "2.5rem", sm: "3.25rem", md: "4rem" }, lineHeight: 1.05 }}
            >
              <Box component="span" sx={gradientText}>
                Auto-generated apps
              </Box>{" "}
              on top of your existing tools and workflows
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 3, fontSize: { xs: "1.1rem", md: "1.3rem" }, maxWidth: 680, mx: "auto" }}>
              AutoApps turns the spreadsheets and business systems your team already runs on into ready-to-use internal
              apps. Open your data and the right app is suggested automatically, in context: no prompt, no code. Tweak
              it in chat, share a link, and everyone updates only their part, straight back to the source.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center" sx={{ mt: 4 }}>
              <Button href={SIGN_IN} variant="contained" size="large" sx={{ px: 4, py: 1.4, fontSize: "1.05rem" }}>
                Get started with Google
              </Button>
              <Button href="#demo" variant="outlined" size="large" sx={{ px: 4, py: 1.4, fontSize: "1.05rem" }}>
                Watch the demo
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              mt: { xs: 6, md: 8 },
              mx: "auto",
              maxWidth: 860,
              p: { xs: 2, md: 2.5 },
              borderRadius: 4,
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              boxShadow: "0 20px 50px -25px rgba(15, 23, 42, 0.25)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, px: 0.5 }}>
              <AutoAwesomeOutlined sx={{ fontSize: 18, color: "primary.main" }} />
              <Typography variant="body2" fontWeight={700}>
                Suggested automatically for “FY2027 Budget”
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "inline" } }}>
                · you didn&apos;t ask for anything yet
              </Typography>
            </Stack>
            <Grid container spacing={1.5}>
              {HERO_SUGGESTIONS.map((idea) => (
                <Grid key={idea.title} size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ height: "100%", p: 1.75, borderRadius: 2.5, bgcolor: "background.default", border: 1, borderColor: "divider", textAlign: "left" }}>
                    <Chip label={idea.kind} size="small" sx={{ mb: 1, fontWeight: 600, bgcolor: "rgba(37,99,235,0.08)", color: "primary.dark" }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      {idea.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.5 }}>
                      {idea.pitch}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box id="demo" sx={{ mt: { xs: 5, md: 7 }, maxWidth: 1000, mx: "auto", scrollMarginTop: 96 }}>
            <DemoVideo />
          </Box>

          <Grid container spacing={2} sx={{ mt: { xs: 5, md: 7 }, maxWidth: 1000, mx: "auto" }}>
            {TRUST.map((item) => (
              <Grid key={item} size={{ xs: 12, sm: 6, md: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ md: "center" }}>
                  <CheckCircleRounded sx={{ color: "success.main", fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    {item}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How it works */}
      <Box component="section" id="how-it-works" sx={{ py: { xs: 9, md: 13 }, bgcolor: "background.default", scrollMarginTop: 64 }}>
        <Container maxWidth="lg">
          <SectionHeading
            eyebrow="How it works"
            title="From your data to a shared app in four steps"
            subtitle="No code, no new database, no migration. Your data stays where it is and keeps working exactly as before."
          />
          <Grid container spacing={3}>
            {STEPS.map((step, i) => (
              <Grid key={step.title} size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ height: "100%", p: 3, bgcolor: "background.paper", borderRadius: 3, border: 1, borderColor: "divider" }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      color: "#fff",
                      fontWeight: 800,
                      background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                      mb: 2,
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                    {step.body}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Box component="section" id="features" sx={{ py: { xs: 9, md: 13 }, scrollMarginTop: 64 }}>
        <Container maxWidth="lg">
          <SectionHeading
            eyebrow="Features"
            title={
              <>
                Everything you need, <Box component="span" sx={gradientText}>nothing you have to learn</Box>
              </>
            }
          />
          <Grid container spacing={{ xs: 4, md: 6 }}>
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <Grid key={title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.5,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "rgba(37,99,235,0.08)",
                    color: "primary.main",
                    mb: 2,
                  }}
                >
                  <Icon />
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {title}
                </Typography>
                <Typography color="text.secondary" lineHeight={1.7}>
                  {body}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Integrations */}
      <Box component="section" id="integrations" sx={{ py: { xs: 9, md: 13 }, scrollMarginTop: 64 }}>
        <Container maxWidth="lg">
          <SectionHeading
            eyebrow="Integrations"
            title={
              <>
                Starts with Google Sheets. <Box component="span" sx={gradientText}>Grows with your stack.</Box>
              </>
            }
            subtitle="AutoApps is built to sit on top of any system of record. Google Sheets is live today; connectors for the business tools below are coming soon."
          />
          <Grid container spacing={3} alignItems="stretch">
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  height: "100%",
                  p: 3.5,
                  borderRadius: 3,
                  border: 2,
                  borderColor: "primary.main",
                  bgcolor: "rgba(37,99,235,0.04)",
                }}
              >
                <Chip label="Available now" size="small" color="success" sx={{ mb: 2 }} />
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  Google Sheets
                </Typography>
                <Typography color="text.secondary" lineHeight={1.7}>
                  Build apps on any sheet: per-person rows, forms, boards and dashboards, with every change written back
                  to the sheet. Includes the Chrome extension for Sheets.
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ height: "100%", p: 3.5, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "background.default" }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Coming soon
                  </Typography>
                  <Chip label="On the roadmap" size="small" variant="outlined" />
                </Stack>
                <Grid container spacing={1.5}>
                  {COMING_SOON.map((group) => (
                    <Grid key={group.category} size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                        {group.category}
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ mt: 0.75, mb: 1 }}>
                        {group.tools.map((tool) => (
                          <Chip key={tool} label={tool} sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", fontWeight: 600 }} />
                        ))}
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Use cases */}
      <Box component="section" id="use-cases" sx={{ py: { xs: 9, md: 13 }, bgcolor: "background.default", scrollMarginTop: 64 }}>
        <Container maxWidth="lg">
          <SectionHeading
            eyebrow="Use cases"
            title="Built for the processes your company already runs on"
            subtitle="Finance, operations, HR, events: wherever people keep asking “can you update your line?”"
          />
          <Grid container spacing={3}>
            {USE_CASES.map((u) => (
              <Grid key={u.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ height: "100%", p: 3, bgcolor: "background.paper", borderRadius: 3, border: 1, borderColor: "divider" }}>
                  <Typography fontSize={32} lineHeight={1} aria-hidden sx={{ mb: 1.5 }}>
                    {u.emoji}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {u.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                    {u.body}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Security */}
      <Box component="section" id="security" sx={{ py: { xs: 9, md: 13 }, bgcolor: "#0f172a", color: "#f8fafc" }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="overline" sx={{ color: "#67e8f9", fontWeight: 700, letterSpacing: 1.5 }}>
                Security and control
              </Typography>
              <Typography variant="h3" component="h2" fontWeight={800} letterSpacing={-0.8} sx={{ mt: 1, fontSize: { xs: "2rem", md: "2.75rem" } }}>
                Share the app, not the system
              </Typography>
              <Typography sx={{ mt: 2, color: "#cbd5e1", fontSize: { md: "1.125rem" } }}>
                The people who own the data stay in control. Everyone else gets exactly the view you designed for them,
                and nothing more.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Grid container spacing={3}>
                {SECURITY.map(({ icon: Icon, title, body }) => (
                  <Grid key={title} size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ height: "100%", p: 3, borderRadius: 3, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Icon sx={{ color: "#67e8f9", mb: 1.5 }} />
                      <Typography fontWeight={700} gutterBottom>
                        {title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#cbd5e1", lineHeight: 1.7 }}>
                        {body}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FAQ */}
      <Box component="section" id="faq" sx={{ py: { xs: 9, md: 13 }, scrollMarginTop: 64 }}>
        <Container maxWidth="md">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" />
          {FAQ.map((item) => (
            <Accordion
              key={item.q}
              disableGutters
              elevation={0}
              sx={{ border: 1, borderColor: "divider", borderRadius: "12px !important", mb: 1.5, "&::before": { display: "none" } }}
            >
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3, py: 0.5 }}>
                <Typography fontWeight={700}>{item.q}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                <Typography color="text.secondary" lineHeight={1.7}>
                  {item.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      {/* Final call to action */}
      <Box component="section" sx={{ pb: { xs: 9, md: 13 } }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              textAlign: "center",
              px: { xs: 3, md: 8 },
              py: { xs: 7, md: 10 },
              borderRadius: 5,
              color: "#fff",
              background: "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
              boxShadow: "0 30px 80px -30px rgba(37, 99, 235, 0.6)",
            }}
          >
            <Typography variant="h3" component="h2" fontWeight={800} letterSpacing={-0.8} sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
              Let your tools generate their own apps
            </Typography>
            <Typography sx={{ mt: 2, opacity: 0.9, fontSize: { md: "1.125rem" }, maxWidth: 620, mx: "auto" }}>
              Sign in with Google and open a sheet: AutoApps suggests the app before you ask. Share a link with your team today. More sources are on the way.
            </Typography>
            <Button
              href={SIGN_IN}
              size="large"
              sx={{ mt: 4, px: 4, py: 1.4, fontSize: "1.05rem", bgcolor: "#fff", color: "primary.dark", "&:hover": { bgcolor: "#f1f5f9" } }}
            >
              Get started with Google
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ borderTop: 1, borderColor: "divider", py: 5 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between" alignItems={{ md: "center" }}>
            <Stack spacing={1}>
              <Logo />
              <Typography variant="body2" color="text.secondary">
                Auto-generated apps on top of your existing tools and workflows.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} underline="hover" color="text.secondary" variant="body2">
                  {item.label}
                </Link>
              ))}
              <Link href="/privacy" underline="hover" color="text.secondary" variant="body2">
                Privacy
              </Link>
              <Link href="/terms" underline="hover" color="text.secondary" variant="body2">
                Terms
              </Link>
            </Stack>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 4 }}>
            © 2026 AutoApps
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
