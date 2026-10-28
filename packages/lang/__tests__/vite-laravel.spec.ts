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
    const server = { watcher: { add: vi.fn() }, ws: { send: vi.fn() } };

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
});
