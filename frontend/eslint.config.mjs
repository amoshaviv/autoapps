// ESLint 9 flat config.
//
// Next.js 16 removed the `next lint` command, and the installed
// eslint-config-next still ships an eslintrc-style config, so it's bridged
// through FlatCompat rather than imported directly. Run it with `npm run lint`.

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "next-env.d.ts",
      "public/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // The Sequelize models and external API payloads are dynamically typed
      // at the boundary; the codebase already casts deliberately at those
      // seams, so this would be noise rather than signal.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
