"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { signOut } from "next-auth/react";

export default function RuntimeTopBar({
  user,
}: {
  user: { email: string; displayName?: string | null; profileImageURL?: string | null };
}) {
  return (
    <AppBar position="static" elevation={0}>
      <Toolbar variant="dense" sx={{ gap: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
          AutoApps
        </Typography>
        <Tooltip title={user.email}>
          <Avatar src={user.profileImageURL ?? undefined} alt={user.displayName ?? user.email} sx={{ width: 28, height: 28 }}>
            {(user.displayName ?? user.email)[0]?.toUpperCase()}
          </Avatar>
        </Tooltip>
        <Box>
          <Button size="small" color="inherit" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
