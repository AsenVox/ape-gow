import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // For submissions, only lint what you actually submit.
  // (Template/shared files may intentionally violate some strict rules.)
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Desktop reference components (not shipped / not part of submission)
    "components/pai-gow/_desktop/**",
    "components/pai-gow/_desktop_App.tsx",

    // Platform-managed/template code (generally not part of the submission payload)
    "components/shared/**",
    "components/ui/**",
    "app/layout.tsx",
    "app/globals.css",
  ]),
]);

export default eslintConfig;
