// @ts-check
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

/**
 * FE ESLint config — Vite + React project.
 *
 * Rules are intentionally lenient here:
 * - no-unused-vars: warn (not error) — dead icon imports accumulate
 * - no-explicit-any: warn — codebase has `any` in event handlers / store slices
 * - no-console: off — console.log is acceptable in dev code
 *
 * Enforcement is at --max-warnings=50 (warn-only gate, not zero).
 * New code must not add unused imports or `any` types without justification.
 */
export default [
  {
    ignores: ["node_modules/**", "dist/**", ".git/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      // Warn on unused — avoids silent dead code
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Warn on `any` — acceptable in DOM event handlers and store slices
      "@typescript-eslint/no-explicit-any": "warn",
      // Dev logging is fine
      "no-console": "off",
      // Allow unused JSX vars like `_` for extensibility
      "react/no-unused-prop-types": "off",
    },
  },
];
