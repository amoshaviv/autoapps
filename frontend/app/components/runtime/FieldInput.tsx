"use client";

import * as React from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import type { ColumnDef } from "@/lib/apps/spec";
import { parseDate } from "@/lib/google/schema";

// Sheets shows dates in many formats; <input type="date"> needs yyyy-mm-dd
export function toDateInput(value: string): string {
  const time = parseDate(value);
  return time === null ? "" : new Date(time).toISOString().slice(0, 10);
}

const CURRENCY = /^[\s(]*([$€£])/;

// What to send to the sheet. Currency keeps its symbol so Sheets (USER_ENTERED)
// stores a formatted money value, not a bare number.
export function toSheetValue(column: ColumnDef, value: string, previous = ""): string {
  const v = value.trim();
  if (column.type === "currency" && v !== "" && !CURRENCY.test(v) && /^-?[\d.,]+$/.test(v)) {
    return `${previous.match(CURRENCY)?.[1] ?? "$"}${v}`;
  }
  return value;
}

export function isChecked(value: string) {
  return /^(true|yes|1|x|✓)$/i.test(value.trim());
}

export default function FieldInput({
  column,
  value,
  onChange,
  disabled,
  autoFocus,
  size = "medium",
  hideLabel,
  onCommit,
}: {
  column: ColumnDef;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  size?: "small" | "medium";
  hideLabel?: boolean;
  onCommit?: (value: string) => void; // inline editing: Enter / blur, or a pick in select/checkbox
}) {
  const label = hideLabel ? undefined : (column.label ?? column.header);
  const common = {
    fullWidth: true,
    size,
    disabled,
    autoFocus,
    label,
    required: column.required,
    helperText: hideLabel ? undefined : column.help,
    onBlur: onCommit && column.type !== "select" ? () => onCommit(value) : undefined,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && column.type !== "longtext" && column.type !== "select" && onCommit) onCommit(value);
    },
  };

  switch (column.type) {
    case "checkbox":
      return (
        <FormControlLabel
          disabled={disabled}
          label={label ?? ""}
          control={
            <Checkbox
              autoFocus={autoFocus}
              checked={isChecked(value)}
              onChange={(e) => {
                const next = e.target.checked ? "TRUE" : "FALSE";
                onChange(next);
                onCommit?.(next);
              }}
            />
          }
        />
      );
    case "select": {
      const options = column.options ?? [];
      const all = value && !options.includes(value) ? [value, ...options] : options;
      return (
        <TextField
          {...common}
          select
          value={value}
          // Inline editing: closing the menu without a pick ends editing too
          slotProps={onCommit ? { select: { onClose: () => onCommit(value) } } : undefined}
          onChange={(e) => {
            onChange(e.target.value);
            onCommit?.(e.target.value);
          }}
        >
          <MenuItem value="">
            <em>—</em>
          </MenuItem>
          {all.map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </TextField>
      );
    }
    case "date":
      return (
        <TextField
          {...common}
          type="date"
          value={toDateInput(value) || (value && parseDate(value) === null ? "" : value)}
          onChange={(e) => onChange(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      );
    case "longtext":
      return <TextField {...common} multiline minRows={3} value={value} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return (
        <TextField {...common} value={value} onChange={(e) => onChange(e.target.value)} slotProps={{ htmlInput: { inputMode: "decimal" } }} />
      );
    case "currency": {
      const symbol = value.match(CURRENCY)?.[1] ?? "$";
      const plain = value.replace(/[$€£]/g, "").trim();
      return (
        <TextField
          {...common}
          value={plain}
          onChange={(e) => onChange(e.target.value)}
          slotProps={{
            htmlInput: { inputMode: "decimal" },
            input: { startAdornment: <InputAdornment position="start">{symbol}</InputAdornment> },
          }}
        />
      );
    }
    case "email":
      return <TextField {...common} type="email" value={value} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <TextField {...common} value={value} onChange={(e) => onChange(e.target.value)} />;
  }
}
