"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SendIcon from "@mui/icons-material/Send";
import type { BuilderMessage } from "./useBuilderApp";

export default function ChatPanel({
  messages,
  baseUrl,
  onChanged,
  height = "60vh",
}: {
  messages: BuilderMessage[];
  baseUrl: string;
  onChanged: () => Promise<void> | void;
  height?: string | number;
}) {
  const [text, setText] = React.useState("");
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  const send = async () => {
    const content = text.trim();
    if (!content || pending) return;
    setPending(content);
    setText("");
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "Could not send");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
      setText(content);
    } finally {
      setPending(null);
    }
  };

  const bubble = (role: "user" | "assistant", content: React.ReactNode, key: string) => (
    <Box key={key} sx={{ display: "flex", justifyContent: role === "user" ? "flex-end" : "flex-start" }}>
      <Paper
        elevation={0}
        sx={{
          px: 1.75,
          py: 1.25,
          maxWidth: "85%",
          whiteSpace: "pre-wrap",
          bgcolor: role === "user" ? "primary.dark" : "action.hover",
          color: role === "user" ? "#fff" : "text.primary",
          borderRadius: 2,
        }}
      >
        <Typography variant="body2">{content}</Typography>
      </Paper>
    </Box>
  );

  return (
    <Paper variant="outlined" sx={{ display: "flex", flexDirection: "column", height }}>
      <Stack spacing={1.25} sx={{ p: 2, overflowY: "auto", flexGrow: 1 }}>
        {messages.length === 0 && !pending && (
          <Typography variant="body2" color="text.secondary">
            Tell AutoApps what to change, e.g. “Make Justification required”.
          </Typography>
        )}
        {messages.map((m) => bubble(m.role, m.content, m.id))}
        {pending && bubble("user", pending, "pending")}
        {pending &&
          bubble(
            "assistant",
            <Stack direction="row" spacing={1} alignItems="center" component="span">
              <CircularProgress size={14} />
              <span>Updating your app…</span>
            </Stack>,
            "thinking"
          )}
        <div ref={endRef} />
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
          {error}
        </Alert>
      )}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        sx={{ p: 1.5, borderTop: 1, borderColor: "divider", display: "flex", gap: 1 }}
      >
        <TextField
          fullWidth
          size="small"
          multiline
          maxRows={4}
          placeholder="Ask for a change…"
          value={text}
          disabled={!!pending}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <IconButton type="submit" color="primary" disabled={!text.trim() || !!pending} aria-label="Send">
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}
