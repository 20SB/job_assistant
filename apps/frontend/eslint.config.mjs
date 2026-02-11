import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Module boundary enforcement rules
  {
    rules: {
      // Prevent cross-module imports
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/modules/*/!(index)'],
              message: 'Import from module public API only (index.ts). Use: @/modules/[name]',
            },
            {
              group: ['../**/modules/*'],
              message: 'Do not use relative imports for modules. Use: @/modules/[name]',
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
