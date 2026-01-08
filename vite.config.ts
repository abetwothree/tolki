import path from "node:path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { configDefaults } from "vitest/config";

export default defineConfig({
    plugins: [
        dts({
            outDir: "dist",
            entryRoot: "src",
            staticImport: true,
            tsconfigPath: path.resolve(__dirname, "tsconfig.json"),
            exclude: ["**/*.spec.ts", "**/__tests__/**"],
        }),
    ],
    build: {
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            formats: ["es"],
        },
        emptyOutDir: true,
        outDir: "dist",
        rollupOptions: {
            external: [
                "@zinaid/all",
                "@zinaid/arr",
                "@zinaid/collection",
                "@zinaid/data",
                "@zinaid/num",
                "@zinaid/obj",
                "@zinaid/path",
                "@zinaid/str",
                "@zinaid/types",
                "@zinaid/utils",
                "@types/pluralize",
                "any-ascii",
                "markdown-it",
                "markdown-it-anchor",
                "markdown-it-task-lists",
                "pluralize",
                "transliteration",
                "ulid",
                "uuid",
                "to-words",
            ],
        },
    },
    test: {
        environment: "jsdom",
        globals: true,
        coverage: {
            provider: "istanbul",
            reporter: [
                "text",
                "text-summary",
                ...(process.env.CI ? ["json-summary", "json"] : ["lcov"]),
                ...(process.argv.includes("--ui") ? ["html"] : []),
            ],
            reportOnFailure: true,
            exclude: [...configDefaults.exclude, "./scripts/**", "./docs/**"],
            thresholds: {
                autoUpdate: true,
                statements: 97.54,
                branches: 91.74,
                functions: 99.69,
                lines: 97.74,
            },
        },
        projects: ["packages/*"],
    },
});