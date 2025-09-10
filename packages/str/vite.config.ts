import { defineConfig, mergeConfig } from "vite";

import baseViteConfig from "../../vite.config";
import { buildPackageEntries } from "../../scripts/entries";

const entries = buildPackageEntries("src/**/*.ts", import.meta.url);

export default defineConfig(
    mergeConfig(baseViteConfig, {
        build: {
            lib: {
                entry: entries,
                name: "Str",
            },
        },
    }),
);
