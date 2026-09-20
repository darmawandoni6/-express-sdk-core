import prettierConfig from "eslint-config-prettier";
import tseslint from "typescript-eslint";

import js from "@eslint/js";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "example/prisma/dev.db*", "logs/**", "*.log"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
    },
  }
);
