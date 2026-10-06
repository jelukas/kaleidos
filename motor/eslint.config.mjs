import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  {
    // Scripts de Node (ESM): globals de Node y sin reglas de React.
    files: ["scripts/**/*.mjs", "fixtures/**/*.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        URL: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        AbortController: "readonly",
        Buffer: "readonly",
        performance: "readonly",
      },
    },
  },
];
