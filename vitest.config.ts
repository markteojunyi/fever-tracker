import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Native tsconfig path resolution — replaces vite-tsconfig-paths plugin
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    globals: true,
    testTimeout: 20000, // allow time for MongoMemoryServer to start
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts", "app/api/**/*.ts"],
      exclude: ["lib/models/**", "**/*.d.ts"],
    },
  },
});
