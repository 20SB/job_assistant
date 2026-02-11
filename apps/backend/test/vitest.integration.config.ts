import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["test/integration/**/*.test.ts"],
    setupFiles: ["test/integration/setup.ts"],
  },
});
