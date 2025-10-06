import { defineConfig, mergeConfig } from "vite";

import { buildPackageEntries } from "../../scripts/entries";
import baseViteConfig from "../../vite.config";

const entries = buildPackageEntries("src/**/*.ts", import.meta.url);

export default defineConfig(
    mergeConfig(baseViteConfig, {
        build: {
            lib: {
                entry: entries,
                name: "All",
            },
        },
    }),
);
