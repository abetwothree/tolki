import path from "node:path";

import { isUndefined } from "@tolki/utils";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { normalizePath } from "vite";

import type { ExportFlags } from "./command";
import { exportCommand, sourceExportCommand } from "./command";
import { readManifest } from "./manifest";
import type { ExportRunner } from "./runner";
import { createExportRunner } from "./runner";

export interface LaravelLangExportOptions extends ExportFlags {
    /**
     * The command that exports the lang files.
     *
     * It runs through Node's `exec()` from the Vite root, so shell aliases such as `sail` are not available.
     *
     * @default "php artisan lang:export"
     */
    command?: string;
    /**
     * The command template for exporting one changed file; `{file}` becomes the shell-escaped path.
     *
     * Set to `false` to always run the full command.
     *
     * @default `${command} --source={file}`
     */
    sourceCommand?: string | false;
    /**
     * Whether to export once when `vite dev` starts.
     *
     * @default true
     */
    runOnDevStart?: boolean;
    /**
     * Whether to export once before bundling during `vite build`.
     *
     * @default true
     */
    runOnBuildStart?: boolean;
    /**
     * Whether to reload the browser after a successful export during `vite dev`.
     *
     * @default true
     */
    reload?: boolean;
    /**
     * Whether a failed export throws.
     *
     * @default true in `vite build`, false in `vite dev`
     */
    failOnError?: boolean;
    /**
     * Whether to append `--quiet` to every command.
     *
     * @default true
     */
    quiet?: boolean;
}

const DEFAULT_OUTPUT = "resources/js/lang";

/**
 * Vite plugin that runs `lang:export` before a build and when the dev server starts.
 *
 * @param options - Configuration options for the plugin.
 * @returns A Vite plugin object.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from "vite";
 * import laravelLangExport from "@tolki/lang/vite-laravel";
 *
 * export default defineConfig({
 *     plugins: [laravelLangExport()],
 * });
 * ```
 */
export function laravelLangExport(
    options: LaravelLangExportOptions = {},
): Plugin {
    const {
        command = "php artisan lang:export",
        sourceCommand,
        runOnDevStart = true,
        runOnBuildStart = true,
        reload = true,
        failOnError,
        quiet = true,
        ...flags
    } = options;

    const sourceTemplate =
        sourceCommand === false
            ? null
            : (sourceCommand ?? `${command} --source={file}`);

    let config: ResolvedConfig;
    let server: ViteDevServer | undefined;
    let runner: ExportRunner;

    return {
        name: "@tolki/vite-plugin-laravel-lang-export",
        enforce: "pre",

        configResolved(resolvedConfig) {
            config = resolvedConfig;
            runner = createExportRunner({
                fullCommand: exportCommand(command, flags, quiet),
                sourceCommand:
                    sourceTemplate === null
                        ? null
                        : (file) =>
                              sourceExportCommand(
                                  sourceTemplate,
                                  file,
                                  flags,
                                  quiet,
                              ),
                cwd: config.root,
                logger: config.logger,
                shouldThrow: () =>
                    isUndefined(failOnError)
                        ? config.command === "build"
                        : failOnError,
                onSuccess: () => {
                    if (reload && server) {
                        server.ws.send({ type: "full-reload" });
                    }
                },
            });
        },

        configureServer(devServer) {
            server = devServer;
        },

        async buildStart() {
            if (config.command === "build") {
                if (runOnBuildStart) {
                    await runner.full();
                }

                return;
            }

            if (runOnDevStart) {
                await runner.full();
            }

            // Warns early when the export left no usable manifest to watch.
            await readManifest(
                normalizePath(
                    path.resolve(
                        config.root,
                        flags.output ?? DEFAULT_OUTPUT,
                        "manifest.json",
                    ),
                ),
                config.logger,
            );
        },
    };
}

export default laravelLangExport;
