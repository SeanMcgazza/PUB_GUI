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
  {
    rules: {
      // TODO: this was elevated to error in a recent eslint-plugin-react-hooks bump.
      // The codebase has many `useEffect(() => { fetchX(); }, [fetchX])` patterns
      // that legitimately fetch on mount. Refactor case-by-case before re-enabling.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
