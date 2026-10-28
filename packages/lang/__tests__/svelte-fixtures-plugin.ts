import { compile, compileModule } from "svelte/compiler";
import type { Plugin } from "vite";

/**
 * Compile Svelte components and `.svelte.js` runes modules for the tests.
 *
 * `@sveltejs/vite-plugin-svelte` depends on deepmerge, which carries an advisory with no patched release
 * (GHSA-gcqx-w48m-w2h4). The tests need no preprocessing, CSS or HMR, so the compiler alone is enough.
 *
 * @returns The Vite plugin
 */
export function svelteFixtures(): Plugin {
    return {
        name: "tolki:svelte-fixtures",
        transform(code, id, options) {
            const [file = id] = id.split("?", 1);
            const generate = options?.ssr === true ? "server" : "client";

            if (file.endsWith(".svelte")) {
                const { js } = compile(code, { filename: file, generate });

                return { code: js.code, map: js.map };
            }

            if (file.endsWith(".svelte.js")) {
                const { js } = compileModule(code, {
                    filename: file,
                    generate,
                });

                return { code: js.code, map: js.map };
            }

            return undefined;
        },
    };
}
