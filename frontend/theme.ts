"use client";
import * as React from "react";
import NextLink, { LinkProps } from "next/link";
import { createTheme } from "@mui/material/styles";
import { Roboto } from "next/font/google";

// MUI components with an href render a Next <Link>, so navigation is always a
// real link (CLAUDE.md: never onClick + router.push for navigation)
const LinkBehavior = React.forwardRef<HTMLAnchorElement, Omit<LinkProps, "href"> & { href: LinkProps["href"] }>(
  function LinkBehavior(props, ref) {
    return React.createElement(NextLink, { ref, ...props });
  }
);

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

// Light theme: internal tools read better on white. One brand hue (blue),
// with the cyan accent only in the primary-button gradient.
const brand = {
  main: "#2563eb",
  light: "#3b82f6",
  dark: "#1d4ed8",
  accent: "#06b6d4",
};

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: brand.main, light: brand.light, dark: brand.dark, contrastText: "#ffffff" },
    secondary: { main: brand.accent, contrastText: "#ffffff" },
    background: { default: "#f7f8fa", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#475569", disabled: "#94a3b8" },
    divider: "#e2e8f0",
    success: { main: "#16a34a" },
    warning: { main: "#d97706" },
    error: { main: "#dc2626" },
    info: { main: brand.main },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: roboto.style.fontFamily,
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: LinkBehavior,
      },
    },
    MuiLink: {
      defaultProps: {
        component: LinkBehavior,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999 },
        contained: {
          boxShadow: "none",
          "&.MuiButton-containedPrimary": {
            background: `linear-gradient(135deg, ${brand.light} 0%, ${brand.accent} 100%)`,
            "&:hover": { background: `linear-gradient(135deg, ${brand.main} 0%, #0891b2 100%)`, boxShadow: "none" },
            "&.Mui-disabled": { background: "#e2e8f0", color: "#94a3b8" },
          },
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #e2e8f0",
        },
      },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, backgroundColor: "#f8fafc" },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${brand.light} 0%, ${brand.accent} 100%)`,
        },
      },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
  },
});

export default theme;
