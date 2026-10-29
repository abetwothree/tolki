/// <reference types="vitest/config" />
import path from "node:path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    plugins: [
        dts({
            outDirs: "dist",
            entryRoot: "src",
            // The plugin regex-escapes the root tsconfig's relative `include`, which then matches nothing in a package.
            include: ["src"],
            staticImport: true,
            tsconfigPath: path.resolve(__dirname, "tsconfig.json"),
            exclude: ["**/*.spec.ts", "**/__tests__/**"],
            aliasesExclude: [/^@tolki\//],
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
                "@tolki/all",
                "@tolki/arr",
                "@tolki/collection",
                "@tolki/data",
                "@tolki/enum",
                "@tolki/lang",
                "@tolki/num",
                "@tolki/obj",
                "@tolki/path",
                "@tolki/str",
                "@tolki/ts",
                "@tolki/types",
                "@tolki/utils",
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
                /^to-words\//,
            ],
        },
    },
    test: {
        environment: "jsdom",
        globals: true,
        typecheck: {
            enabled: true,
            checker: "tsc",
            include: ["**/*.test-d.ts"],
        },
    },
});
