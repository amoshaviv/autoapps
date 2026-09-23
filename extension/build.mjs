// node build.mjs [--watch]   (APP_ORIGIN overrides the web app origin)
import { context } from "esbuild";
import { cpSync, mkdirSync } from "node:fs";

const APP_ORIGIN = process.env.APP_ORIGIN ?? "https://www.autoapps.win";
const watch = process.argv.includes("--watch");

mkdirSync("dist", { recursive: true });
const copyStatic = () => {
  cpSync("manifest.json", "dist/manifest.json");
  cpSync("sidepanel.html", "dist/sidepanel.html");
  cpSync("icons", "dist/icons", { recursive: true });
};

const ctx = await context({
  entryPoints: ["src/background.ts", "src/content.ts", "src/sidepanel.ts"],
  outdir: "dist",
  bundle: true,
  format: "iife",
  target: "chrome120",
  define: { APP_ORIGIN: JSON.stringify(APP_ORIGIN) },
  plugins: [{ name: "copy-static", setup: (b) => b.onEnd(copyStatic) }],
});

if (watch) {
  await ctx.watch();
  console.log(`Watching; building for ${APP_ORIGIN}`);
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log(`Built extension/dist for ${APP_ORIGIN}`);
}
