import { describe, expect, it } from "vitest";
import { parseSpreadsheetUrl } from "@/lib/google/sheets";

describe("parseSpreadsheetUrl", () => {
  it("reads the spreadsheet id and gid from common URL shapes", () => {
    expect(parseSpreadsheetUrl("https://docs.google.com/spreadsheets/d/1AbC-_x9/edit#gid=123")).toEqual({
      spreadsheetId: "1AbC-_x9",
      gid: 123,
    });
    expect(parseSpreadsheetUrl("https://docs.google.com/spreadsheets/d/1AbC/edit?usp=sharing&gid=0")).toEqual({
      spreadsheetId: "1AbC",
      gid: 0,
    });
    expect(parseSpreadsheetUrl("https://docs.google.com/spreadsheets/d/1AbC/edit")).toEqual({ spreadsheetId: "1AbC" });
  });

  it("returns null for other URLs", () => {
    expect(parseSpreadsheetUrl("https://docs.google.com/document/d/1AbC/edit")).toBeNull();
    expect(parseSpreadsheetUrl("not a url")).toBeNull();
  });
});
