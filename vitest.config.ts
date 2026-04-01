import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Native tsconfig path resolution — replaces vite-tsconfig-paths plugin
    // @ts-expect-error -- vitest extends vite config which supports this option
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts", "app/api/**/*.ts"],
      exclude: ["lib/models/**", "**/*.d.ts"],
    },
  },
});
