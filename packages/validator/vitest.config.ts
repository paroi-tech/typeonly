import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/src/**/*.spec.ts", "**/tests/**/*.spec.ts"],
    environment: "node",
  },
});
