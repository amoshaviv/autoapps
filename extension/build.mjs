import { build } from "esbuild";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const APP_ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:3000";

mkdirSync("dist", { recursive: true });

await build({
  entryPoints: ["src/background.ts"],
  outdir: "dist",
  bundle: true,
  format: "iife",
  target: "chrome120",
  define: { APP_ORIGIN: JSON.stringify(APP_ORIGIN) },
});

cpSync("manifest.json", "dist/manifest.json");
writeFileSync(
  "dist/sidepanel.html",
  readFileSync("sidepanel.html", "utf8").replaceAll("__APP_ORIGIN__", APP_ORIGIN)
);

console.log(`Built extension/dist for ${APP_ORIGIN}`);
