import { defineConfig, mergeConfig } from "vite";

import { buildPackageEntries } from "../../scripts/entries";
import baseViteConfig from "../../vite.shared";

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
