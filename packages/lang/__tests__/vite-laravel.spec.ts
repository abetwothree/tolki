// @vitest-environment node
import path from "node:path";

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

const platform = Object.getOwnPropertyDescriptor(
    process,
    "platform",
) as PropertyDescriptor;

/**
 * Make the code under test see another platform.
 *
 * @param value - The platform `process.platform` reports.
 */
function stubPlatform(value: NodeJS.Platform): void {
    Object.defineProperty(process, "platform", { ...platform, value });
}

/**
 * Resolve a test path the way Vite reports one on this platform: absolute, with forward slashes.
 *
 * @param file - A POSIX absolute path
 * @returns The path, drive-prefixed on Windows
 */
function absolute(file: string): string {
    return path.resolve(file).replace(/\\/g, "/");
}

const ROOT = absolute("/project");

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
    const closers: (() => void)[] = [];
    const server = {
        watcher: {
            add: vi.fn(),
            on: vi.fn((_event: string, cb: (e: string, f: string) => void) => {
                listeners.push(cb);
            }),
        },
        ws: { send: vi.fn() },
        httpServer: {
            once: vi.fn((_event: string, cb: () => void) => {
                closers.push(cb);
            }),
        },
        close: () => {
            for (const closer of closers) {
                closer();
            }
        },
        emit: (event: string, file: string) => {
            for (const listener of listeners) {
                listener(event, file);
            }
        },
    };

    (plugin.configResolved as (config: unknown) => void)({
        root: ROOT,
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
        Object.defineProperty(process, "platform", platform);
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
        expect(mockExec.mock.calls[0]?.[1]).toEqual({ cwd: ROOT });
    });

    it("passes each set option as a flag", async () => {
        stubPlatform("linux");

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
            `${ROOT}/resources/lang-out/manifest.json`,
            "utf-8",
        );
    });

    it("reads the manifest from the default output directory", async () => {
        mockReadFile.mockResolvedValue(JSON.stringify(MANIFEST));

        await setupPlugin(undefined, "serve");

        expect(mockReadFile).toHaveBeenCalledWith(
            `${ROOT}/resources/js/lang/manifest.json`,
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

    describe("virtual module", () => {
        /**
         * Call the plugin's load hook for the virtual module.
         *
         * @param plugin - The plugin
         * @param options - The load options
         * @returns The generated code and the watch spy
         */
        async function loadVirtual(
            plugin: ReturnType<typeof laravelLangExport>,
            options?: { ssr?: boolean },
        ) {
            const addWatchFile = vi.fn();
            const code = await (
                plugin.load as (
                    id: string,
                    options?: { ssr?: boolean },
                ) => Promise<string | undefined>
            ).call({ addWatchFile }, "\0virtual:tolki-lang", options);

            return { code, addWatchFile };
        }

        it("resolves only its own id", () => {
            const plugin = laravelLangExport();
            const resolveId = plugin.resolveId as (id: string) => unknown;

            expect(resolveId("virtual:tolki-lang")).toBe(
                "\0virtual:tolki-lang",
            );
            expect(resolveId("x")).toBeUndefined();
        });

        it("loads only its own id", async () => {
            const { plugin } = await setupPlugin();
            const load = plugin.load as (id: string) => Promise<unknown>;

            expect(
                await load.call({ addWatchFile: vi.fn() }, "x"),
            ).toBeUndefined();
        });

        it("imports each locale lazily for the client", async () => {
            mockReadFile.mockResolvedValue(
                JSON.stringify({ ...MANIFEST, locales: ["en", "es"] }),
            );

            const { plugin } = await setupPlugin();
            const { code } = await loadVirtual(plugin);

            expect(code).toContain(
                `import("${ROOT}/resources/js/lang/en.json")`,
            );
            expect(code).toContain(
                `import("${ROOT}/resources/js/lang/es.json")`,
            );
            expect(code).not.toContain("import l0");
        });

        it("imports every locale eagerly for SSR", async () => {
            mockReadFile.mockResolvedValue(
                JSON.stringify({ ...MANIFEST, locales: ["en", "es"] }),
            );

            const { plugin } = await setupPlugin();
            const { code } = await loadVirtual(plugin, { ssr: true });

            expect(code).toContain(
                `import l0 from "${ROOT}/resources/js/lang/en.json";`,
            );
            expect(code).not.toContain("import(");
        });

        it("leaves out a manifest locale holding a path character", async () => {
            mockReadFile.mockResolvedValue(
                JSON.stringify({ ...MANIFEST, locales: ["en", "../etc"] }),
            );

            const { plugin } = await setupPlugin();
            const { code } = await loadVirtual(plugin);

            expect(code).toContain('export const locales = ["en"];');
            expect(code).not.toContain("../etc");
        });

        it("watches the manifest", async () => {
            const { plugin } = await setupPlugin();
            const { addWatchFile } = await loadVirtual(plugin);

            expect(addWatchFile).toHaveBeenCalledWith(
                `${ROOT}/resources/js/lang/manifest.json`,
            );
        });

        it("exports no locales when the manifest is missing", async () => {
            const { plugin } = await setupPlugin();
            const { code } = await loadVirtual(plugin);

            expect(code).toContain("export const locales = [];");
        });
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
                watch: ["lang", absolute("/pkgs/courier/lang")],
            });

            expect(server.watcher.add).toHaveBeenCalledWith([
                `${ROOT}/lang`,
                absolute("/pkgs/courier/lang"),
            ]);
        });

        it("re-exports one changed file by its root-relative path", async () => {
            const { server } = await setupWatcher();

            server.emit("change", `${ROOT}/lang/en/auth.php`);
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=lang/en/auth.php --quiet",
            ]);
        });

        it("re-exports a new json file", async () => {
            const { server } = await setupWatcher();

            server.emit("add", `${ROOT}/lang/fr.json`);
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=lang/fr.json --quiet",
            ]);
        });

        it("passes the same flags to a source run", async () => {
            const { server } = await setupWatcher({ locales: ["en"] });

            server.emit("change", `${ROOT}/lang/en/auth.php`);
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=lang/en/auth.php --locale=en --quiet",
            ]);
        });

        it("runs a full export for a file outside the root", async () => {
            const { server } = await setupWatcher(undefined, {
                watch: ["lang", absolute("/pkgs/courier/lang")],
            });

            server.emit("change", absolute("/pkgs/courier/lang/en/mail.php"));
            await settle();

            expect(commands()).toEqual(["php artisan lang:export --quiet"]);
        });

        it("runs a full export when a file is deleted", async () => {
            const { server } = await setupWatcher();

            server.emit("unlink", `${ROOT}/lang/en/auth.php`);
            await settle();

            expect(commands()).toEqual(["php artisan lang:export --quiet"]);
        });

        it("runs a full export when a directory is deleted", async () => {
            const { server } = await setupWatcher();

            server.emit("unlinkDir", `${ROOT}/lang/fr`);
            await settle();

            expect(commands()).toEqual(["php artisan lang:export --quiet"]);
        });

        it("ignores files that are not .php or .json", async () => {
            const { server } = await setupWatcher();

            server.emit("change", `${ROOT}/lang/en/.auth.php.swp`);
            server.emit("unlink", `${ROOT}/lang/en/.auth.php.swp`);
            await settle();

            expect(mockExec).not.toHaveBeenCalled();
        });

        it("ignores directory additions, even for a directory named like a lang file", async () => {
            const { server } = await setupWatcher();

            server.emit("addDir", `${ROOT}/lang/en.json`);
            await settle();

            expect(mockExec).not.toHaveBeenCalled();
        });

        it("ignores the output directory and paths outside every watch dir", async () => {
            const { server } = await setupWatcher();

            server.emit("change", `${ROOT}/resources/js/lang/en/auth.json`);
            server.emit("change", `${ROOT}/lang-extra/en/auth.php`);
            server.emit("change", absolute("/elsewhere/lang/en/auth.php"));
            await settle();

            expect(mockExec).not.toHaveBeenCalled();
        });

        it("runs a full export when a watched directory itself is deleted", async () => {
            const { server } = await setupWatcher();

            server.emit("unlinkDir", `${ROOT}/lang`);
            await settle();

            expect(commands()).toEqual(["php artisan lang:export --quiet"]);
        });

        it("normalizes a Windows-style path before matching it", async () => {
            const { server } = await setupWatcher();

            server.emit("change", `${ROOT}/lang/en/a.php`.replace(/\//g, "\\"));
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=lang/en/a.php --quiet",
            ]);
        });

        it("ignores a sibling directory that shares the root's prefix", async () => {
            const { server } = await setupWatcher(undefined, {
                watch: ["."],
            });

            server.emit("change", `${ROOT}2/lang/x.php`);
            await settle();

            expect(mockExec).not.toHaveBeenCalled();
        });

        it("never exports for events inside the output directory, even under a watched directory", async () => {
            const { server } = await setupWatcher(undefined, {
                watch: ["."],
            });

            server.emit("change", `${ROOT}/resources/js/lang/en.json`);
            server.emit("add", `${ROOT}/resources/js/lang/fr.json`);
            server.emit("unlink", `${ROOT}/resources/js/lang/es.json`);
            server.emit("unlinkDir", `${ROOT}/resources/js/lang`);
            await settle();

            expect(mockExec).not.toHaveBeenCalled();

            server.emit("change", `${ROOT}/lang/en/auth.php`);
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=lang/en/auth.php --quiet",
            ]);
        });

        it("collapses a burst of changes into one full export", async () => {
            const { server } = await setupWatcher();
            const callbacks: ExecCallback[] = [];

            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    callbacks.push(cb);
                },
            );

            server.emit("change", `${ROOT}/lang/en/a.php`);
            await settle();
            server.emit("change", `${ROOT}/lang/en/b.php`);
            server.emit("change", `${ROOT}/lang/en/c.php`);
            server.emit("change", `${ROOT}/lang/en/d.php`);
            await settle();

            expect(mockExec).toHaveBeenCalledTimes(1);

            callbacks[0]?.(null, "", "");
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=lang/en/a.php --quiet",
                "php artisan lang:export --quiet",
            ]);
            expect(server.ws.send).toHaveBeenCalledTimes(1);

            callbacks[1]?.(null, "", "");
            await settle();

            // Each run reloads: the collapsed run exports files the first one never saw.
            expect(server.ws.send).toHaveBeenCalledTimes(2);
        });

        it("reloads the page after a successful run", async () => {
            const { server } = await setupWatcher();

            server.emit("change", `${ROOT}/lang/en/auth.php`);
            await settle();

            expect(server.ws.send).toHaveBeenCalledWith({
                type: "full-reload",
            });
        });

        it("does not reload when reload is false, or when the run fails", async () => {
            const quiet = await setupWatcher({ reload: false });

            quiet.server.emit("change", `${ROOT}/lang/en/auth.php`);
            await settle();

            expect(quiet.server.ws.send).not.toHaveBeenCalled();

            const failing = await setupWatcher();

            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb(new Error("exit 1"), "", "");
                },
            );
            failing.server.emit("change", `${ROOT}/lang/en/auth.php`);
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
            server.emit("change", `${ROOT}/lang/en/auth.php`);
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
            server.emit("change", `${ROOT}/resources/js/lang/manifest.json`);
            await settle();

            expect(server.watcher.add).toHaveBeenCalledWith([
                `${ROOT}/modules/lang`,
            ]);
            expect(mockExec).not.toHaveBeenCalled();

            server.emit("change", `${ROOT}/modules/lang/en/auth.php`);
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=modules/lang/en/auth.php --quiet",
            ]);
        });

        it("lets the newest manifest read win when reads resolve out of order", async () => {
            const { server } = await setupWatcher();
            const resolvers: ((text: string) => void)[] = [];

            mockReadFile.mockImplementation(
                () =>
                    new Promise<string>((resolve) => {
                        resolvers.push(resolve);
                    }),
            );
            server.watcher.add.mockClear();
            server.emit("change", `${ROOT}/resources/js/lang/manifest.json`);
            server.emit("change", `${ROOT}/resources/js/lang/manifest.json`);
            await settle();
            resolvers[1]?.(JSON.stringify({ ...MANIFEST, watch: ["new"] }));
            await settle();
            resolvers[0]?.(JSON.stringify({ ...MANIFEST, watch: ["old"] }));
            await settle();

            expect(server.watcher.add.mock.calls).toEqual([[[`${ROOT}/new`]]]);

            server.emit("change", `${ROOT}/old/en/auth.php`);
            await settle();

            expect(mockExec).not.toHaveBeenCalled();

            server.emit("change", `${ROOT}/new/en/auth.php`);
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=new/en/auth.php --quiet",
            ]);
        });

        it("only re-reads the manifest for add and change events", async () => {
            const { server } = await setupWatcher();

            mockReadFile.mockClear();
            server.emit("unlink", `${ROOT}/resources/js/lang/manifest.json`);
            server.emit("addDir", `${ROOT}/resources/js/lang/manifest.json`);
            server.emit("unlinkDir", `${ROOT}/resources/js/lang/manifest.json`);
            await settle();

            expect(mockReadFile).not.toHaveBeenCalled();
            expect(mockExec).not.toHaveBeenCalled();

            server.emit("add", `${ROOT}/resources/js/lang/manifest.json`);
            await settle();

            expect(mockReadFile).toHaveBeenCalledTimes(1);
        });

        it("logs a watcher failure instead of leaving it unhandled", async () => {
            const { server, logger } = await setupWatcher();

            mockReadFile.mockResolvedValue(
                JSON.stringify({ ...MANIFEST, watch: ["lang", "more"] }),
            );
            server.watcher.add.mockImplementation(() => {
                throw new Error("watch broke");
            });
            server.emit("change", `${ROOT}/resources/js/lang/manifest.json`);
            await settle();

            expect(logger.error).toHaveBeenCalledWith("watch broke");
        });

        it("logs a watcher failure that is not an Error", async () => {
            const { server, logger } = await setupWatcher();

            mockReadFile.mockResolvedValue(
                JSON.stringify({ ...MANIFEST, watch: ["lang", "more"] }),
            );
            server.watcher.add.mockImplementation(() => {
                throw "odd";
            });
            server.emit("change", `${ROOT}/resources/js/lang/manifest.json`);
            await settle();

            expect(logger.error).toHaveBeenCalledWith("odd");
        });

        it("sends no reload to a server that closed during an export", async () => {
            const { server } = await setupWatcher();
            const callbacks: ExecCallback[] = [];

            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    callbacks.push(cb);
                },
            );
            server.emit("change", `${ROOT}/lang/en/a.php`);
            await settle();
            server.close();
            callbacks[0]?.(null, "", "");
            await settle();

            expect(server.httpServer.once).toHaveBeenCalledWith(
                "close",
                expect.any(Function),
            );
            expect(server.ws.send).not.toHaveBeenCalled();
        });

        it("keeps reloading a new server after an old one closes", async () => {
            const { plugin, server: first } = await setupWatcher();
            const second = {
                watcher: { add: vi.fn(), on: vi.fn() },
                ws: { send: vi.fn() },
                httpServer: { once: vi.fn() },
            };

            (plugin.configureServer as (server: unknown) => void)(second);
            first.close();

            const on = second.watcher.on.mock.calls[0]?.[1] as (
                event: string,
                file: string,
            ) => void;

            on("change", `${ROOT}/lang/en/a.php`);
            await settle();

            expect(second.ws.send).toHaveBeenCalledWith({
                type: "full-reload",
            });
        });

        it("keeps the old watch dirs when a newer read fails while an older one succeeds", async () => {
            const { server } = await setupWatcher();
            const resolvers: ((text: string) => void)[] = [];

            mockReadFile.mockImplementationOnce(
                () =>
                    new Promise<string>((resolve) => {
                        resolvers.push(resolve);
                    }),
            );
            mockReadFile.mockImplementationOnce(() => {
                const err = new Error("ENOENT") as NodeJS.ErrnoException;
                err.code = "ENOENT";
                return Promise.reject(err);
            });
            server.watcher.add.mockClear();
            mockReadFile.mockClear();
            server.emit("change", `${ROOT}/resources/js/lang/manifest.json`);
            server.emit("change", `${ROOT}/resources/js/lang/manifest.json`);
            await settle();
            resolvers[0]?.(JSON.stringify({ ...MANIFEST, watch: ["old"] }));
            await settle();

            expect(mockReadFile).toHaveBeenCalledTimes(2);
            expect(server.watcher.add).not.toHaveBeenCalled();

            server.emit("change", `${ROOT}/lang/en/auth.php`);
            server.emit("change", `${ROOT}/old/en/auth.php`);
            await settle();

            expect(commands()).toEqual([
                "php artisan lang:export --source=lang/en/auth.php --quiet",
            ]);
        });

        it("keeps the watched directories when the manifest becomes unreadable", async () => {
            const { server } = await setupWatcher();

            mockReadFile.mockResolvedValue("{nope");
            server.watcher.add.mockClear();
            server.emit("change", `${ROOT}/resources/js/lang/manifest.json`);
            await settle();

            expect(server.watcher.add).not.toHaveBeenCalled();

            server.emit("change", `${ROOT}/lang/en/auth.php`);
            await settle();

            expect(mockExec).toHaveBeenCalledTimes(1);
        });

        it("does not re-add directories that are already watched", async () => {
            const { server } = await setupWatcher();

            server.watcher.add.mockClear();
            server.emit("change", `${ROOT}/resources/js/lang/manifest.json`);
            await settle();

            expect(server.watcher.add).not.toHaveBeenCalled();
        });

        it("uses a custom sourceCommand with the file escaped", async () => {
            stubPlatform("linux");

            const { server } = await setupWatcher({
                sourceCommand: "sail artisan lang:export --source={file}",
            });

            server.emit("change", `${ROOT}/lang/en/it's.php`);
            await settle();

            expect(commands()).toEqual([
                "sail artisan lang:export --source='lang/en/it'\\''s.php' --quiet",
            ]);
        });

        it("runs the full command when sourceCommand is false", async () => {
            const { server } = await setupWatcher({ sourceCommand: false });

            server.emit("change", `${ROOT}/lang/en/auth.php`);
            await settle();

            expect(commands()).toEqual(["php artisan lang:export --quiet"]);
        });

        it("starts without a dev server", async () => {
            mockReadFile.mockResolvedValue(JSON.stringify(MANIFEST));

            const plugin = laravelLangExport();

            (plugin.configResolved as (config: unknown) => void)({
                root: ROOT,
                logger: createLogger(),
                command: "serve",
            });

            await expect(
                (plugin.buildStart as () => Promise<void>).call({}),
            ).resolves.toBeUndefined();
        });
    });
});
