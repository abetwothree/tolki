import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        globals: true,
        coverage: {
            provider: "istanbul",
            reporter: ["text", "json", "html", "lcov", "text-summary"],
            exclude: ["**/dist/**", "**/node_modules/**"],
        },
        projects: ["packages/*"],
    },
});
