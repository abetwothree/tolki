import { fileURLToPath } from "node:url";

import { aliasExportsPlugin } from "../../scripts/build/alias-exports";
import { definePackageConfig } from "../../vite.shared";

export default definePackageConfig(import.meta.url, {
    // Rolldown, webpack and Rspack keep calls through a `const` alias, so each `dataX` ships as its declaration.
    plugins: [
        aliasExportsPlugin(fileURLToPath(new URL("src", import.meta.url))),
    ],
});
