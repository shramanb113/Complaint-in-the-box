import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Components import with the same "@/..." alias as tsconfig.json, so tests need it too.
  resolve: {
    alias: [
      { find: /^@\//, replacement: fileURLToPath(new URL("./src/", import.meta.url)) },
      // server-only@0.0.1 unconditionally throws unless a bundler sets the "react-server" resolve
      // condition (Next's build does; Vitest does not). Adding that condition here would also redirect
      // react-dom's own export map to its RSC-only build (no client renderer), breaking every
      // @testing-library/react test — so alias just this one specifier to the package's own no-op file
      // instead of touching resolve.conditions.
      { find: "server-only", replacement: fileURLToPath(new URL("../../node_modules/server-only/empty.js", import.meta.url)) },
    ],
  },
  // Tests run in Node. A .test.tsx file that needs a DOM starts with `// @vitest-environment jsdom`.
  // globals is on only so Testing Library cleans up between tests; tests still import from "vitest".
  test: {
    environment: "node",
    globals: true,
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
  },
});
