"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import FieldInput, { isChecked, toSheetValue } from "./FieldInput";
import { apiFetch, runtimeUrl, RuntimeRow, useJson } from "./useAppData";
import { compareCells } from "@/lib/apps/compare";
import type { AppSpec } from "@/lib/apps/spec";

type TableView = Extract<AppSpec["views"][number], { type: "table" }>;
type Editing = { rowNumber: number; column: string; value: string };

export default function TableView({
  shortId,
  draft,
  viewIndex,
  view,
  spec,
}: {
  shortId: string;
  draft: boolean;
  viewIndex: number;
  view: TableView;
  spec: AppSpec;
}) {
  const { data, error, loading, reload, setData } = useJson<{ rows: RuntimeRow[]; total: number }>(
    runtimeUrl(shortId, "/rows", { view: viewIndex }, draft)
  );
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<{ column: string; direction: "asc" | "desc" } | null>(null);
  const [editing, setEditing] = React.useState<Editing | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const editable = new Set(view.editable ?? []);
  const columnOf = (h: string) => spec.columns.find((c) => c.header === h);

  const rows = React.useMemo(() => {
    let list = data?.rows ?? [];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => view.columns.some((c) => (r.values[c] ?? "").toLowerCase().includes(q)));
    if (sort) {
      const factor = sort.direction === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => {
        const va = a.values[sort.column] ?? "";
        const vb = b.values[sort.column] ?? "";
        if (va === "" || vb === "") return va === vb ? 0 : va === "" ? 1 : -1;
        return compareCells(va, vb) * factor;
      });
    }
    return list;
  }, [data, search, sort, view.columns]);

  const commit = async (row: RuntimeRow, column: string, raw: string) => {
    setEditing(null);
    const def = columnOf(column);
    const value = def ? toSheetValue(def, raw, row.values[column] ?? "") : raw;
    if ((row.values[column] ?? "") === value) return;
    // Optimistic: show the new value right away, reload on failure
    if (data) {
      setData({
        ...data,
        rows: data.rows.map((r) =>
          r.rowNumber === row.rowNumber ? { ...r, values: { ...r.values, [column]: value } } : r
        ),
      });
    }
    try {
      await apiFetch(runtimeUrl(shortId, `/rows/${row.rowNumber}`, {}, draft), {
        method: "PATCH",
        body: JSON.stringify({ view: viewIndex, values: { [column]: value }, expectedKey: row.key }),
      });
      setMessage("Saved");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save");
      reload();
    }
  };

  const toggleSort = (column: string) =>
    setSort((s) =>
      s?.column === column ? { column, direction: s.direction === "asc" ? "desc" : "asc" } : { column, direction: "asc" }
    );

  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <Box>
      {view.search && (
        <TextField
          size="small"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2, width: { xs: "100%", sm: 320 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: "70vh" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {view.columns.map((c) => (
                <TableCell key={c} sortDirection={sort?.column === c ? sort.direction : false}>
                  <TableSortLabel
                    active={sort?.column === c}
                    direction={sort?.column === c ? sort.direction : "asc"}
                    onClick={() => toggleSort(c)}
                  >
                    {columnOf(c)?.label ?? c}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !data
              ? Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i}>
                    {view.columns.map((c) => (
                      <TableCell key={c}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.map((row) => (
                  <TableRow key={row.rowNumber} hover>
                    {view.columns.map((c) => {
                      const column = columnOf(c);
                      const value = row.values[c] ?? "";
                      const canEdit = editable.has(c) && column && !column.readOnly;

                      if (column?.type === "checkbox") {
                        return (
                          <TableCell key={c} padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={isChecked(value)}
                              disabled={!canEdit}
                              onChange={(e) => commit(row, c, e.target.checked ? "TRUE" : "FALSE")}
                            />
                          </TableCell>
                        );
                      }

                      if (canEdit && editing?.rowNumber === row.rowNumber && editing.column === c) {
                        return (
                          <TableCell key={c} sx={{ minWidth: 160 }}>
                            <FieldInput
                              column={column}
                              value={editing.value}
                              size="small"
                              hideLabel
                              autoFocus
                              onChange={(v) => setEditing({ ...editing, value: v })}
                              onCommit={(v) => commit(row, c, v)}
                            />
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell
                          key={c}
                          onClick={canEdit ? () => setEditing({ rowNumber: row.rowNumber, column: c, value }) : undefined}
                          sx={
                            canEdit
                              ? { cursor: "pointer", "&:hover": { outline: "1px dashed", outlineColor: "divider" } }
                              : undefined
                          }
                          title={canEdit ? "Click to edit" : undefined}
                        >
                          {value || (canEdit ? <Typography component="span" color="text.disabled">—</Typography> : "")}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
            {data && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={view.columns.length}>
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                    {search ? "No rows match your search." : "Nothing to show yet."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {data && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {rows.length === data.total ? `${data.total} rows` : `${rows.length} of ${data.total} rows`}
        </Typography>
      )}
      <Snackbar open={message !== null} autoHideDuration={3000} onClose={() => setMessage(null)} message={message} />
    </Box>
  );
}
