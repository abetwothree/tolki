import { svelteTesting } from "@testing-library/svelte/vite";
import { defineConfig, mergeConfig } from "vite";

import baseViteConfig from "../../vite.shared";
import { svelteFixtures } from "./__tests__/svelte-fixtures-plugin";

export default defineConfig(
    mergeConfig(baseViteConfig, {
        // Svelte's client runtime resolves only under the browser condition, which the SSR spec must not get.
        // Setting `conditions` drops Vite's defaults (module, browser, development), so all three are listed again.
        // Listing `module` changes nothing today; it keeps the defaults whole.
        plugins: [svelteFixtures(), svelteTesting()],
        resolve: { conditions: ["module", "browser", "development"] },
        test: {
            name: "@tolki/lang:svelte-client",
            environment: "jsdom",
            include: ["__tests__/svelte.spec.ts"],
            typecheck: { enabled: false },
        },
    }),
);
