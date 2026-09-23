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

// Landing page color palette
const colors = {
  // Primary gradient colors
  primary: {
    main: "#3b82f6",
    light: "#60a5fa",
    dark: "#2563eb",
  },
  // Secondary (cyan accent)
  secondary: {
    main: "#06b6d4",
    light: "#22d3ee",
    dark: "#0891b2",
  },
  // Backgrounds
  background: {
    default: "#0a0a0f",
    paper: "#111118",
    elevated: "#1a1a24",
  },
  // Status colors
  success: {
    main: "#22c55e",
    light: "#4ade80",
    dark: "#16a34a",
  },
  error: {
    main: "#ef4444",
    light: "#f87171",
    dark: "#dc2626",
  },
  warning: {
    main: "#f59e0b",
    light: "#fbbf24",
    dark: "#d97706",
  },
  info: {
    main: "#3b82f6",
    light: "#60a5fa",
    dark: "#2563eb",
  },
  // Text colors
  text: {
    primary: "#ffffff",
    secondary: "#94a3b8",
    disabled: "#64748b",
  },
  // Dividers and borders
  divider: "rgba(255, 255, 255, 0.06)",
};

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },
  palette: {
    mode: "dark",
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    text: colors.text,
    divider: colors.divider,
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: LinkBehavior,
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background.default,
          color: colors.text.primary,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          textTransform: "none",
        },
        contained: {
          color: "#ffffff",
          background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`,
          "&:hover": {
            background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.secondary.dark} 100%)`,
          },
          "&.MuiButton-containedSuccess": {
            color: "#ffffff",
            background: colors.success.main,
            "&:hover": { background: colors.success.dark },
          },
          "&.MuiButton-containedError": {
            color: "#ffffff",
            background: colors.error.main,
            "&:hover": { background: colors.error.dark },
          },
          "&.MuiButton-containedWarning": {
            color: "#ffffff",
            background: colors.warning.main,
            "&:hover": { background: colors.warning.dark },
          },
          "&.MuiButton-containedInfo": {
            color: "#ffffff",
            background: colors.info.main,
            "&:hover": { background: colors.info.dark },
          },
          "&.MuiButton-containedSecondary": {
            color: "#ffffff",
            background: colors.secondary.main,
            "&:hover": { background: colors.secondary.dark },
          },
        },
        outlined: {
          borderColor: "rgba(255, 255, 255, 0.2)",
          "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.4)",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          backgroundImage: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(10, 10, 15, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.background.default,
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 255, 255, 0.06)",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 255, 255, 0.06)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          variants: [
            {
              props: { severity: "info" },
              style: {
                backgroundColor: colors.info.main,
              },
            },
          ],
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.1)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(255, 255, 255, 0.2)",
            },
            "&.Mui-focused fieldset": {
              borderColor: colors.primary.main,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.primary.main,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.1)",
        },
        bar: {
          background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: colors.primary.main,
        },
      },
    },
    MuiLink: {
      defaultProps: {
        component: LinkBehavior,
      },
      styleOverrides: {
        root: {
          color: colors.primary.light,
          textDecorationColor: colors.primary.light,
        },
      },
    },
  },
});

export default theme;
