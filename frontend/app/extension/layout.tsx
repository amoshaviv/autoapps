import * as React from "react";
import Box from "@mui/material/Box";

export default function ExtensionLayout({ children }: { children: React.ReactNode }) {
  return <Box sx={{ p: 1.5, minHeight: "100vh" }}>{children}</Box>;
}
