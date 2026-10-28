// @vitest-environment node
import type { LaravelLangExportOptions } from "@tolki/lang/vite-laravel";
import laravelLangExportDefault, {
    laravelLangExport,
} from "@tolki/lang/vite-laravel";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ExecCallback = (
    err: unknown,
    stdout: string | null,
    stderr: string | null,
) => void;

const { mockExec, mockReadFile, mockNormalizePath } = vi.hoisted(() => ({
    mockExec: vi.fn((_cmd: string, _opts: unknown, cb: ExecCallback) => {
        cb(null, "", "");
    }),
    mockReadFile: vi.fn((_path: string, _encoding: string): Promise<string> => {
        const err = new Error("ENOENT") as NodeJS.ErrnoException;
        err.code = "ENOENT";
        return Promise.reject(err);
    }),
    mockNormalizePath: vi.fn((p: string): string => p.replace(/\\/g, "/")),
}));

vi.mock("node:child_process", async (importOriginal) => {
    const actual = await importOriginal<typeof import("node:child_process")>();
    return {
        ...actual,
        default: { ...actual, exec: mockExec },
        exec: mockExec,
    };
});

vi.mock("node:fs/promises", async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        default: {
            ...(actual["default"] as Record<string, unknown>),
            readFile: mockReadFile,
        },
        readFile: mockReadFile,
    };
});

vi.mock("vite", () => ({
    normalizePath: mockNormalizePath,
}));

const MANIFEST = {
    version: 1,
    locales: ["en"],
    watch: ["lang"],
    fingerprint: "abc",
};

/**
 * Build a logger double.
 *
 * @returns The logger with spied methods
 */
function createLogger() {
    return {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        clearScreen: vi.fn(),
        hasErrorLogged: vi.fn(),
        hasWarned: false,
        warnOnce: vi.fn(),
    };
}

/**
 * Drive the plugin through configResolved, configureServer and buildStart.
 *
 * @param options - The plugin options
 * @param command - The Vite command
 * @returns The plugin with its logger and dev server double
 */
async function setupPlugin(
    options?: LaravelLangExportOptions,
    command: "serve" | "build" = "build",
) {
    const plugin = laravelLangExport(options);
    const logger = createLogger();
    const listeners: ((event: string, file: string) => void)[] = [];
    const server = {
        watcher: {
            add: vi.fn(),
            on: vi.fn((_event: string, cb: (e: string, f: string) => void) => {
                listeners.push(cb);
            }),
        },
        ws: { send: vi.fn() },
        emit: (event: string, file: string) => {
            for (const listener of listeners) {
                listener(event, file);
            }
        },
    };

    (plugin.configResolved as (config: unknown) => void)({
        root: "/project",
        logger,
        command,
    });

    if (command === "serve") {
        (plugin.configureServer as (server: unknown) => void)(server);
    }

    await (plugin.buildStart as () => Promise<void>).call({});

    return { plugin, logger, server };
}

describe("laravelLangExport", () => {
    beforeEach(() => {
        mockExec.mockReset();
        mockExec.mockImplementation(
            (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                cb(null, "", "");
            },
        );
        mockReadFile.mockReset();
        mockReadFile.mockImplementation(() => {
            const err = new Error("ENOENT") as NodeJS.ErrnoException;
            err.code = "ENOENT";
            return Promise.reject(err);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("is also the default export", () => {
        expect(laravelLangExportDefault).toBe(laravelLangExport);
    });

    it("names the plugin and runs it first", () => {
        const plugin = laravelLangExport();

        expect(plugin.name).toBe("@tolki/vite-plugin-laravel-lang-export");
        expect(plugin.enforce).toBe("pre");
    });

    it("runs the export once before a build", async () => {
        await setupPlugin();

        expect(mockExec).toHaveBeenCalledTimes(1);
        expect(mockExec.mock.calls[0]?.[0]).toBe(
            "php artisan lang:export --quiet",
        );
        expect(mockExec.mock.calls[0]?.[1]).toEqual({ cwd: "/project" });
    });

    it("passes each set option as a flag", async () => {
        await setupPlugin({
            output: "resources/lang-out",
            locales: ["en", "es"],
            only: ["auth", "courier::*"],
            except: ["admin/*"],
        });

        expect(mockExec.mock.calls[0]?.[0]).toBe(
            "php artisan lang:export --output=resources/lang-out --locale=en --locale=es --only=auth --only='courier::*' --except='admin/*' --quiet",
        );
    });

    it("fails the build when the export fails", async () => {
        mockExec.mockImplementation(
            (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                cb(new Error("exit 1"), "", "");
            },
        );

        await expect(setupPlugin()).rejects.toThrow(/Command failed/);
    });

    it("does not fail the build when failOnError is false", async () => {
        mockExec.mockImplementation(
            (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                cb(new Error("exit 1"), "", "");
            },
        );

        const { logger } = await setupPlugin({ failOnError: false });

        expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it("skips the build run when runOnBuildStart is false", async () => {
        await setupPlugin({ runOnBuildStart: false });

        expect(mockExec).not.toHaveBeenCalled();
    });

    it("runs on dev start by default", async () => {
        await setupPlugin(undefined, "serve");

        expect(mockExec).toHaveBeenCalledTimes(1);
        expect(mockExec.mock.calls[0]?.[0]).toBe(
            "php artisan lang:export --quiet",
        );
    });

    it("logs a dev start failure instead of throwing", async () => {
        mockExec.mockImplementation(
            (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                cb(new Error("exit 1"), "", "");
            },
        );

        const { logger } = await setupPlugin(undefined, "serve");

        expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it("fails the dev start when failOnError is true", async () => {
        mockExec.mockImplementation(
            (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                cb(new Error("exit 1"), "", "");
            },
        );

        await expect(
            setupPlugin({ failOnError: true }, "serve"),
        ).rejects.toThrow(/Command failed/);
    });

    it("skips the dev start run when runOnDevStart is false", async () => {
        await setupPlugin({ runOnDevStart: false }, "serve");

        expect(mockExec).not.toHaveBeenCalled();
    });

    it("reloads the browser after a successful dev run", async () => {
        const { server } = await setupPlugin(undefined, "serve");

        expect(server.ws.send).toHaveBeenCalledWith({ type: "full-reload" });
    });

    it("does not reload when reload is false", async () => {
        const { server } = await setupPlugin({ reload: false }, "serve");

        expect(server.ws.send).not.toHaveBeenCalled();
    });

    it("adds --quiet once, and never when quiet is false", async () => {
        await setupPlugin({ command: "php artisan lang:export --quiet" });
        await setupPlugin({ quiet: false });

        expect(mockExec.mock.calls[0]?.[0]).toBe(
            "php artisan lang:export --quiet",
        );
        expect(mockExec.mock.calls[1]?.[0]).toBe("php artisan lang:export");
    });

    it("runs a custom command", async () => {
        await setupPlugin({ command: "./vendor/bin/sail artisan lang:export" });

        expect(mockExec.mock.calls[0]?.[0]).toBe(
            "./vendor/bin/sail artisan lang:export --quiet",
        );
    });

    it("reads the manifest from the output directory", async () => {
        mockReadFile.mockResolvedValue(JSON.stringify(MANIFEST));

        await setupPlugin({ output: "resources/lang-out" }, "serve");

        expect(mockReadFile).toHaveBeenCalledWith(
            "/project/resources/lang-out/manifest.json",
            "utf-8",
        );
    });

    it("reads the manifest from the default output directory", async () => {
        mockReadFile.mockResolvedValue(JSON.stringify(MANIFEST));

        await setupPlugin(undefined, "serve");

        expect(mockReadFile).toHaveBeenCalledWith(
            "/project/resources/js/lang/manifest.json",
            "utf-8",
        );
    });

    it("does not read the manifest during a build", async () => {
        await setupPlugin();

        expect(mockReadFile).not.toHaveBeenCalled();
    });

    it("warns when the manifest is missing", async () => {
        const { logger } = await setupPlugin(undefined, "serve");

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining("Manifest not found"),
        );
    });

    it("warns when the manifest is not version 1", async () => {
        mockReadFile.mockResolvedValue(
            JSON.stringify({ ...MANIFEST, version: 2 }),
        );

        const { logger } = await setupPlugin(undefined, "serve");

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining("version 1"),
        );
    });

    it("warns when reading the manifest rejects with a non-error", async () => {
        mockReadFile.mockRejectedValue("boom");

        const { logger } = await setupPlugin(undefined, "serve");

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining("Failed to read manifest: boom"),
        );
    });

    it("warns when the manifest is not valid JSON", async () => {
        mockReadFile.mockResolvedValue("{nope");

        const { logger } = await setupPlugin(undefined, "serve");

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining("Failed to read manifest"),
        );
    });

    it("warns when the manifest holds a non-string locale", async () => {
        mockReadFile.mockResolvedValue(
            JSON.stringify({ ...MANIFEST, locales: ["en", 1] }),
        );

        const { logger } = await setupPlugin(undefined, "serve");

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining("locales"),
        );
    });

    it("warns when the manifest holds a non-string watch entry", async () => {
        mockReadFile.mockResolvedValue(
            JSON.stringify({ ...MANIFEST, watch: [null] }),
        );

        const { logger } = await setupPlugin(undefined, "serve");

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining("watch"),
        );
    });

    it("warns when the manifest is not an object", async () => {
        mockReadFile.mockResolvedValue("[]");

        const { logger } = await setupPlugin(undefined, "serve");

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining("version 1"),
        );
    });

    it("warns when the manifest has no fingerprint", async () => {
        mockReadFile.mockResolvedValue(
            JSON.stringify({ ...MANIFEST, fingerprint: 5 }),
        );

        const { logger } = await setupPlugin(undefined, "serve");

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining("fingerprint"),
        );
    });

    describe("dev watcher", () => {
        /**
         * Start the plugin in dev with a manifest, then forget the start-up run.
         *
         * @param options - The plugin options
         * @param manifest - Fields to override in the manifest
         * @returns The plugin setup
         */
        async function setupWatcher(
            options?: LaravelLangExportOptions,
            manifest: Record<string, unknown> = {},
        ) {
            mockReadFile.mockResolvedValue(
                JSON.stringify({ ...MANIFEST, ...manifest }),
            );

            const setup = await setupPlugin(options, "serve");

            mockExec.mockClear();
            setup.server.ws.send.mockClear();

            return setup;
        }

        /**
         * Let queued microtasks and timers run.
         */
        async function settle() {
            await new Promise((resolve) => setTimeout(resolve, 0));
        }

        /**
         * Read the commands that ran so far.
         *
         * @returns The command strings
         */
        function commands() {
            return mockExec.mock.calls.map((call) => call[0]);
        }

        it("watches the manifest's directories", async () => {
            const { server } = await setupWatcher(undefined, {
                watch: ["lang", "/pkgs/courier/lang"],
            });

            expect(server.watcher.add).toHaveBeenCalledWith([
                "/project/lang",
                "/pkgs/courier/lang",
            ]);
        });

        it("re-exports one changed file by its root-relative path", async () => {
            const { server } = await setupWatcher();

            server.emit("change", "/project/lang/en/auth.php");
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=lang/en/auth.php --quiet",
            ]);
        });

        it("re-exports a new json file", async () => {
            const { server } = await setupWatcher();

            server.emit("add", "/project/lang/fr.json");
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=lang/fr.json --quiet",
            ]);
        });

        it("passes the same flags to a source run", async () => {
            const { server } = await setupWatcher({ locales: ["en"] });

            server.emit("change", "/project/lang/en/auth.php");
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=lang/en/auth.php --locale=en --quiet",
            ]);
        });

        it("runs a full export for a file outside the root", async () => {
            const { server } = await setupWatcher(undefined, {
                watch: ["lang", "/pkgs/courier/lang"],
            });

            server.emit("change", "/pkgs/courier/lang/en/mail.php");
            await settle();

            expect(commands()).toEqual(["php artisan lang:export --quiet"]);
        });

        it("runs a full export when a file is deleted", async () => {
            const { server } = await setupWatcher();

            server.emit("unlink", "/project/lang/en/auth.php");
            await settle();

            expect(commands()).toEqual(["php artisan lang:export --quiet"]);
        });

        it("runs a full export when a directory is deleted", async () => {
            const { server } = await setupWatcher();

            server.emit("unlinkDir", "/project/lang/fr");
            await settle();

            expect(commands()).toEqual(["php artisan lang:export --quiet"]);
        });

        it("ignores files that are not .php or .json", async () => {
            const { server } = await setupWatcher();

            server.emit("change", "/project/lang/en/.auth.php.swp");
            server.emit("unlink", "/project/lang/en/.auth.php.swp");
            await settle();

            expect(mockExec).not.toHaveBeenCalled();
        });

        it("ignores directory additions", async () => {
            const { server } = await setupWatcher();

            server.emit("addDir", "/project/lang/fr");
            await settle();

            expect(mockExec).not.toHaveBeenCalled();
        });

        it("ignores the output directory and paths outside every watch dir", async () => {
            const { server } = await setupWatcher();

            server.emit("change", "/project/resources/js/lang/en/auth.json");
            server.emit("change", "/project/lang-extra/en/auth.php");
            server.emit("change", "/elsewhere/lang/en/auth.php");
            await settle();

            expect(mockExec).not.toHaveBeenCalled();
        });

        it("collapses a burst of changes into one full export", async () => {
            const { server } = await setupWatcher();
            const callbacks: ExecCallback[] = [];

            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    callbacks.push(cb);
                },
            );

            server.emit("change", "/project/lang/en/a.php");
            await settle();
            server.emit("change", "/project/lang/en/b.php");
            server.emit("change", "/project/lang/en/c.php");
            server.emit("change", "/project/lang/en/d.php");
            await settle();

            expect(mockExec).toHaveBeenCalledTimes(1);

            callbacks[0]?.(null, "", "");
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=lang/en/a.php --quiet",
                "php artisan lang:export --quiet",
            ]);

            callbacks[1]?.(null, "", "");
            await settle();
        });

        it("reloads the page after a successful run", async () => {
            const { server } = await setupWatcher();

            server.emit("change", "/project/lang/en/auth.php");
            await settle();

            expect(server.ws.send).toHaveBeenCalledWith({
                type: "full-reload",
            });
        });

        it("does not reload when reload is false, or when the run fails", async () => {
            const quiet = await setupWatcher({ reload: false });

            quiet.server.emit("change", "/project/lang/en/auth.php");
            await settle();

            expect(quiet.server.ws.send).not.toHaveBeenCalled();

            const failing = await setupWatcher();

            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb(new Error("exit 1"), "", "");
                },
            );
            failing.server.emit("change", "/project/lang/en/auth.php");
            await settle();

            expect(failing.server.ws.send).not.toHaveBeenCalled();
        });

        it("logs a failed run instead of leaving it unhandled when failOnError is true", async () => {
            const { server, logger } = await setupWatcher({
                failOnError: true,
            });

            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb(new Error("exit 1"), "", "");
                },
            );
            server.emit("change", "/project/lang/en/auth.php");
            await settle();

            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining("Command failed"),
            );
        });

        it("refreshes the watched directories when the manifest changes", async () => {
            const { server } = await setupWatcher();

            mockReadFile.mockResolvedValue(
                JSON.stringify({
                    ...MANIFEST,
                    watch: ["lang", "modules/lang"],
                }),
            );
            server.watcher.add.mockClear();
            server.emit("change", "/project/resources/js/lang/manifest.json");
            await settle();

            expect(server.watcher.add).toHaveBeenCalledWith([
                "/project/modules/lang",
            ]);
            expect(mockExec).not.toHaveBeenCalled();

            server.emit("change", "/project/modules/lang/en/auth.php");
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=modules/lang/en/auth.php --quiet",
            ]);
        });

        it("keeps the watched directories when the manifest becomes unreadable", async () => {
            const { server } = await setupWatcher();

            mockReadFile.mockResolvedValue("{nope");
            server.watcher.add.mockClear();
            server.emit("change", "/project/resources/js/lang/manifest.json");
            await settle();

            expect(server.watcher.add).not.toHaveBeenCalled();

            server.emit("change", "/project/lang/en/auth.php");
            await settle();

            expect(mockExec).toHaveBeenCalledTimes(1);
        });

        it("does not re-add directories that are already watched", async () => {
            const { server } = await setupWatcher();

            server.watcher.add.mockClear();
            server.emit("change", "/project/resources/js/lang/manifest.json");
            await settle();

            expect(server.watcher.add).not.toHaveBeenCalled();
        });

        it("uses a custom sourceCommand with the file escaped", async () => {
            const { server } = await setupWatcher({
                sourceCommand: "sail artisan lang:export --source={file}",
            });

            server.emit("change", "/project/lang/en/it's.php");
            await settle();

            expect(commands()).toEqual([
                "sail artisan lang:export --source='lang/en/it'\\''s.php' --quiet",
            ]);
        });

        it("runs the full command when sourceCommand is false", async () => {
            const { server } = await setupWatcher({ sourceCommand: false });

            server.emit("change", "/project/lang/en/auth.php");
            await settle();

            expect(commands()).toEqual(["php artisan lang:export --quiet"]);
        });

        it("starts without a dev server", async () => {
            mockReadFile.mockResolvedValue(JSON.stringify(MANIFEST));

            const plugin = laravelLangExport();

            (plugin.configResolved as (config: unknown) => void)({
                root: "/project",
                logger: createLogger(),
                command: "serve",
            });

            await expect(
                (plugin.buildStart as () => Promise<void>).call({}),
            ).resolves.toBeUndefined();
        });
    });
});
