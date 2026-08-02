import { defineConfig } from "vitest/config"
import path from "path"

// Tests cover the pure logic (units, geometry, sanitizing, the stores), so this
// config deliberately skips the React/Babel plugins that vite.config.ts needs.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
