import { defineConfig } from "vitest/config";

export default defineConfig({
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
