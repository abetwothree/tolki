import { defineConfig, mergeConfig } from "vite";

import { aliasExportsPlugin } from "../../scripts/build/alias-exports";
import { buildPackageEntries } from "../../scripts/entries";
import baseViteConfig from "../../vite.shared";

const entries = buildPackageEntries("src/**/*.ts", import.meta.url);

export default defineConfig(
    mergeConfig(baseViteConfig, {
        // webpack and Rspack lose an annotation through a `const` alias, so each `dataX` ships as its declaration.
        plugins: [aliasExportsPlugin()],
        build: {
            lib: {
                entry: entries,
                name: "Data",
            },
        },
    }),
);
