import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Components import with the same "@/..." alias as tsconfig.json, so tests need it too.
  resolve: { alias: [{ find: /^@\//, replacement: fileURLToPath(new URL("./src/", import.meta.url)) }] },
  // Tests run in Node. A .test.tsx file that needs a DOM starts with `// @vitest-environment jsdom`.
  // globals is on only so Testing Library cleans up between tests; tests still import from "vitest".
  test: {
    environment: "node",
    globals: true,
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
  },
});
