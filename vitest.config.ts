import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/domain/**", "src/shared/**", "src/app/use-cases/**", "src/popup/use-cases/**", "src/popup/components/**"],
      exclude: ["src/infra/**", "src/app/features/**", "src/app/stores/**", "src/popup/components/**", "**/svg.ts"],
    },
  },
});
