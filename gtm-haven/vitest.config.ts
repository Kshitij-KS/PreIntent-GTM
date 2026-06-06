import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    // Avoid fork worker timeouts on Windows CI/dev machines
    pool: "threads",
    maxWorkers: 1,
    testTimeout: 30_000,
  },
});
