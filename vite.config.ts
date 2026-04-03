import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    exclude: ["tests/**", "node_modules/**"],
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  fmt: {
    printWidth: 80,
    sortPackageJson: false,
    ignorePatterns: ["dist", "1", "3", "4", "test-results", "pnpm-lock.yaml"],
  },
});
