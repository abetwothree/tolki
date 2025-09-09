import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        globals: true,
        coverage: {
            provider: "istanbul",
            reporter: ["text", "html", "lcov", "text-summary"],
            exclude: [...configDefaults.exclude],
        },
        projects: ["packages/*"],
        typecheck: {
            enabled: true,
        },
    },
});
