// @ts-check
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "FE/**",
      "FE-ARCHIVE/**",
      "CHECKING FE/**",
      // Generated Prisma types — auto-generated, do not edit
      "src/generated/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@next/next": nextPlugin,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "varsIgnorePattern": "^_|^persist$|^createJSONStorage$", "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off",
      "no-undef": "off",
      "@next/next/no-img-element": "off",
    },
  },
];
