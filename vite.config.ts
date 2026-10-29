import { defineConfig, mergeConfig } from "vite";
import { configDefaults } from "vitest/config";

import sharedConfig from "./vite.shared";

export default mergeConfig(
    sharedConfig,
    defineConfig({
        test: {
            coverage: {
                provider: "istanbul",
                reporter: [
                    "text",
                    "text-summary",
                    ...(process.env.CI ? ["json-summary", "json"] : ["lcov"]),
                    ...(process.argv.includes("--ui") ? ["html"] : []),
                ],
                reportOnFailure: true,
                exclude: [
                    ...configDefaults.exclude,
                    "./scripts/**",
                    "./docs/**",
                    "./packages/**/__tests__/**",
                ],
                thresholds: {
                    autoUpdate: true,
                    statements: 100,
                    branches: 100,
                    functions: 100,
                    lines: 100,
                },
            },
            projects: [
                "packages/*",
                // Svelte's client runtime needs the browser condition, so its jsdom spec runs apart from the lang project.
                "packages/lang/vitest.svelte-client.config.ts",
                // scripts/ sits outside packages/*; without this project entry `pnpm test` never collects it.
                {
                    extends: true,
                    test: {
                        name: "scripts",
                        root: "./scripts",
                        environment: "node",
                    },
                },
                // The VitePress theme sits outside packages/*; its helpers need their own project to be collected.
                {
                    extends: true,
                    test: {
                        name: "docs",
                        root: "./docs/vitepress/.vitepress/theme",
                        environment: "jsdom",
                    },
                },
            ],
        },
    }),
);
