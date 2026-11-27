import { fileURLToPath } from "node:url";

import { aliasExportsPlugin } from "../../scripts/build/alias-exports.ts";
import { definePackageConfig } from "../../vite.shared.ts";

export default definePackageConfig(import.meta.url, {
    // Rolldown, webpack and Rspack keep calls through a `const` alias, so each `dataX` ships as its declaration.
    plugins: [
        aliasExportsPlugin(fileURLToPath(new URL("src", import.meta.url))),
    ],
});
