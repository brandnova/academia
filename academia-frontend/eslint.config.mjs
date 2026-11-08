import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      // Apostrophes and quotes inside JSX text render correctly in React.
      // The rule exists to catch stray > or } typos, and it fired about 40
      // times on ordinary copy like "Couldn't load".
      "react/no-unescaped-entities": "off",
      // The app's fetch-on-mount pattern (set loading, fetch, guard with a
      // cancelled flag) calls setState at the top of an effect on purpose.
      // The rule flags it as a possible performance cost, not a bug. Switch
      // it to "warn" if data fetching ever moves to Suspense or a query
      // library.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;