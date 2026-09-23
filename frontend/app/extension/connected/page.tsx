import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";

export default function ExtensionConnectedPage() {
  return (
    <Box sx={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, textAlign: "center" }}>
      <CheckCircleOutline color="success" sx={{ fontSize: 56 }} />
      <Typography variant="h5">You&apos;re all set</Typography>
      <Typography color="text.secondary">You can close this tab and go back to the AutoApps side panel.</Typography>
    </Box>
  );
}
