import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import {
    normalizePath,
    type Plugin,
    type ResolvedConfig,
    type ViteDevServer,
} from "vite";

const execAsync = promisify(exec);

export interface LaravelTsPublishOptions {
    /**
     * The command to run when a watched PHP file changes.
     *
     * The command is executed with Node's `exec()` using the Vite project root
     * as the current working directory. Because it runs in a non-interactive
     * shell, shell aliases such as `sail` are usually not available.
     *
     * Common setups:
     * - Run Vite on the host machine with Laravel Sail: `./vendor/bin/sail artisan ts:publish`
     * - Run Vite inside the container: `php artisan ts:publish`
     *
     * The command is executed with Node's `exec()` using the Vite project root
     * as the current working directory. Because it runs in a non-interactive
     * shell, shell aliases such as `sail` are usually not available.
     *
     * Common setups:
     * - Run Vite on the host machine with Laravel Sail: `./vendor/bin/sail artisan ts:publish`
     * - Run Vite inside the container: `php artisan ts:publish`
     *
     * @default "php artisan ts:publish"
     */
    command?: string;
    /**
     * The filename of the JSON manifest listing collected PHP files.
     *
     * @default "laravel-ts-collected-files.json"
     */
    filename?: string;
    /**
     * The directory where the JSON manifest file exists, relative to the Vite root.
     *
     * @default "resources/js/types/"
     */
    directory?: string;
    /**
     * Whether to run the publish command once when `vite dev` starts.
     *
     * Has no effect during `vite build`.
     *
     * @default false
     */
    runOnDevStart?: boolean;
    /**
     * Whether to run the publish command once before bundling during
     * `vite build`.
     *
     * Has no effect during `vite dev`.
     *
     * @default true
     */
    runOnBuildStart?: boolean;
    /**
     * Whether to trigger a full browser reload after the command runs
     * successfully during `vite dev`.
     *
     * Has no effect during `vite build`.
     *
     * @default true
     */
    reload?: boolean;
    /**
     * Whether to throw an error (aborting the build) when the command fails.
     *
     * When not specified, defaults to `true` during `vite build` and `false`
     * during `vite dev`.
     */
    failOnError?: boolean;
    /**
     * The command template for single-file republishing during `vite dev`.
     *
     * When a watched PHP file changes, this command is used instead of the
     * full `command` to republish only the changed file. The `{file}`
     * placeholder is replaced with the relative file path from the manifest.
     *
     * When not specified, it is auto-derived by appending
     * ` --source="{file}"` to `command`.
     *
     * Set to `false` to disable single-file republishing and always run
     * the full command.
     *
     * @default `${command} --source="{file}"`
     */
    sourceCommand?: string | false;
}

/**
 * Vite plugin that watches PHP source files listed in the Laravel TypeScript
 * Publisher manifest and re-runs the publish command when any of them change.
 *
 * - **Build mode** (`vite build`): runs the command once before bundling so
 *   TypeScript definitions are always up-to-date (disable with
 *   `runOnBuildStart: false`). Fails the build by default if the command errors.
 * - **Dev mode** (`vite dev`): loads the manifest, explicitly adds the listed
 *   PHP files to the dev-server file watcher, and re-runs the command when any
 *   of them change via HMR. Optionally runs the command once at startup when
 *   `runOnDevStart` is `true`. Sends a full browser reload after every
 *   successful run (disable with `reload: false`). Manifest updates only
 *   refresh the watched-file list and do not trigger the command again.
 * - **Command execution**: the configured command runs through Node's
 *   `child_process.exec()` from the Vite project root. Shell aliases are not
 *   resolved, so use a real executable path such as `./vendor/bin/sail` when
 *   running Vite on the host with Laravel Sail.
 *
 * @param options - Configuration options for the plugin.
 * @returns A Vite plugin object.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from "vite";
 * import { laravelTsPublish } from "@tolki/enum";
 *
 * export default defineConfig({
 *     plugins: [
 *         laravelTsPublish(),
 *     ],
 * });
 * ```
 *
 * @example
 * ```ts
 * // With Laravel Sail
 * laravelTsPublish({
 *     command: "./vendor/bin/sail artisan ts:publish",
 * });
 * ```
 * @example
 * ```ts
 * // When Vite is already running inside the PHP container
 * laravelTsPublish({
 *     command: "php artisan ts:publish",
 * });
 * ```
 *
 * @example
 * ```ts
 * // Also run the command when the dev server starts
 * laravelTsPublish({
 *     runOnDevStart: true,
 * });
 * ```
 */
export function laravelTsPublish(
    options: LaravelTsPublishOptions = {},
): Plugin {
    const {
        command = "php artisan ts:publish",
        filename = "laravel-ts-collected-files.json",
        directory = "resources/js/types/",
        runOnDevStart = false,
        runOnBuildStart = true,
        reload = true,
        failOnError,
        sourceCommand: sourceCommandOption,
    } = options;

    const resolvedSourceCommand =
        sourceCommandOption === false
            ? false
            : (sourceCommandOption ?? `${command} --source="{file}"`);

    let config: ResolvedConfig;
    let server: ViteDevServer | undefined;

    /** Maps absolute file path → relative manifest path. */
    const watchedFiles = new Map<string, string>();
    let manifestPath = "";
    let isRunning = false;
    let pendingRun = false;
    let pendingSourceFile: string | null = null;
    const pluginLabel = "[laravel-ts-publish]";

    /**
     * Read the JSON manifest asynchronously and populate the watched file map.
     */
    const loadWatchedFiles = async (): Promise<void> => {
        watchedFiles.clear();

        try {
            const raw = await readFile(manifestPath, "utf-8");
            const parsed: string[] = JSON.parse(raw);

            for (const file of parsed) {
                const absolute = normalizePath(path.resolve(config.root, file));
                watchedFiles.set(absolute, file);
            }
        } catch (error) {
            if (
                error instanceof Error &&
                (error as NodeJS.ErrnoException).code === "ENOENT"
            ) {
                config.logger.warn(
                    `${pluginLabel} Manifest not found: ${manifestPath}`,
                );
                return;
            }

            config.logger.error(
                `${pluginLabel} Failed to read manifest: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        }
    };

    /**
     * Explicitly add all watched files to the dev-server's chokidar instance
     * so that changes to non-module files (e.g. `.php`) are detected.
     */
    const addFilesToWatcher = (): void => {
        if (server) {
            for (const file of watchedFiles.keys()) {
                server.watcher.add(file);
            }
        }
    };

    /**
     * Resolve whether errors should throw based on the explicit option and
     * the current Vite command.
     */
    const shouldThrowOnError = (): boolean => {
        if (failOnError !== undefined) {
            return failOnError;
        }

        return config.command === "build";
    };

    /**
     * Execute a command with debounce protection.
     *
     * If a command is already running, it queues a single re-run for after
     * the current execution completes. When a source file is provided, the
     * targeted source command is used instead of the full publish command.
     */
    const runCommand = async (
        sourceFile: string | null = null,
    ): Promise<void> => {
        if (isRunning) {
            pendingRun = true;
            pendingSourceFile = sourceFile;
            return;
        }

        isRunning = true;

        const effectiveCommand =
            sourceFile && resolvedSourceCommand
                ? resolvedSourceCommand.replace("{file}", sourceFile)
                : command;

        try {
            config.logger.info(`${pluginLabel} Running: ${effectiveCommand}`, {
                timestamp: true,
            });

            await execAsync(effectiveCommand, { cwd: config.root });

            config.logger.info(`${pluginLabel} Types published successfully`, {
                timestamp: true,
            });

            if (reload && server) {
                server.ws.send({ type: "full-reload" });
            }
        } catch (error) {
            const message = `${pluginLabel} Command failed: ${
                error instanceof Error ? error.message : String(error)
            }`;

            if (shouldThrowOnError()) {
                throw new Error(message, { cause: error });
            }

            config.logger.error(message);
        } finally {
            isRunning = false;

            if (pendingRun) {
                pendingRun = false;
                const file = pendingSourceFile;
                pendingSourceFile = null;
                await runCommand(file);
            }
        }
    };

    return {
        name: "@tolki/vite-plugin-laravel-ts-publish",
        enforce: "pre",

        configResolved(resolvedConfig) {
            config = resolvedConfig;
            manifestPath = normalizePath(
                path.resolve(config.root, directory, filename),
            );
        },

        configureServer(devServer) {
            server = devServer;
        },

        async buildStart() {
            if (config.command === "build") {
                if (runOnBuildStart) {
                    await runCommand();
                }

                return;
            }

            await loadWatchedFiles();
            addFilesToWatcher();

            if (watchedFiles.size > 0) {
                config.logger.info(
                    `${pluginLabel} Watching ${watchedFiles.size} PHP file${watchedFiles.size === 1 ? "" : "s"} for changes`,
                    { timestamp: true },
                );
            }

            if (runOnDevStart) {
                await runCommand();
            }
        },

        async handleHotUpdate({ file }) {
            const normalizedFile = normalizePath(file);

            if (normalizedFile === manifestPath) {
                config.logger.info(
                    `${pluginLabel} Manifest changed, reloading watched files`,
                    { timestamp: true },
                );

                await loadWatchedFiles();
                addFilesToWatcher();

                return [];
            }

            if (watchedFiles.has(normalizedFile)) {
                const sourceFile = watchedFiles.get(normalizedFile) ?? null;
                await runCommand(sourceFile);

                return [];
            }

            return undefined;
        },
    };
}
