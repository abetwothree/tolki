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

const WATCHED_EVENTS = ["add", "change", "unlink", "unlinkDir"];

const EXPORTED_EXTENSIONS = [".php", ".json"];

/**
 * Check whether a path is a translation file the exporter reads.
 *
 * @param file - The path to check.
 * @returns Whether it ends in `.php` or `.json`.
 */
function isTranslationFile(file: string): boolean {
    return EXPORTED_EXTENSIONS.some((extension) => file.endsWith(extension));
}

/**
 * Check whether a path sits under a directory, so `lang` never matches `lang-extra`.
 *
 * @param file - The normalized path.
 * @param dir - The normalized directory.
 * @returns Whether the path is inside the directory.
 */
function isInside(file: string, dir: string): boolean {
    return file.startsWith(`${dir}/`);
}

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
    let manifestFile = "";
    let watchDirs: string[] = [];

    /**
     * Run an export from the watcher, logging a failure that would otherwise go unhandled.
     *
     * @param run - Starts the export.
     */
    async function runFromWatcher(run: () => Promise<void>): Promise<void> {
        try {
            await run();
        } catch (error) {
            // The runner only ever rejects with the Error it builds.
            config.logger.error((error as Error).message);
        }
    }

    /**
     * Re-read the manifest and watch the directories it lists.
     */
    async function refreshWatchDirs(): Promise<void> {
        const manifest = await readManifest(manifestFile, config.logger);

        if (manifest === null) {
            return;
        }

        const root = normalizePath(config.root);
        const dirs = manifest.watch.map((entry) =>
            normalizePath(path.resolve(root, entry)),
        );
        const added = dirs.filter((dir) => !watchDirs.includes(dir));

        watchDirs = dirs;

        if (added.length > 0) {
            server?.watcher.add(added);
        }
    }

    /**
     * Turn one watcher event into the export it needs, if any.
     *
     * @param event - The watcher event name.
     * @param file - The path the event is about.
     */
    async function handleWatcherEvent(
        event: string,
        file: string,
    ): Promise<void> {
        const changed = normalizePath(file);

        if (changed === manifestFile) {
            await refreshWatchDirs();

            return;
        }

        if (!watchDirs.some((dir) => isInside(changed, dir))) {
            return;
        }

        if (!WATCHED_EVENTS.includes(event)) {
            return;
        }

        if (event === "unlinkDir") {
            await runFromWatcher(() => runner.full());

            return;
        }

        if (!isTranslationFile(changed)) {
            return;
        }

        const root = normalizePath(config.root);

        await runFromWatcher(() =>
            event === "unlink" || !isInside(changed, root)
                ? runner.full()
                : runner.source(
                      normalizePath(path.relative(config.root, changed)),
                  ),
        );
    }

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

            devServer.watcher.on("all", (event, file) => {
                void handleWatcherEvent(event, file);
            });
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

            manifestFile = normalizePath(
                path.resolve(
                    config.root,
                    flags.output ?? DEFAULT_OUTPUT,
                    "manifest.json",
                ),
            );

            await refreshWatchDirs();
        },
    };
}

export default laravelLangExport;
