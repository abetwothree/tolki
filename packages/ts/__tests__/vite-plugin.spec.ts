import path from "node:path";

import { laravelTsPublish, type LaravelTsPublishOptions } from "@tolki/ts/vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ExecCallback = (
    err: unknown,
    stdout: string | null,
    stderr: string | null,
) => void;
type HotUpdateHook = (ctx: { file: string }) => Promise<unknown>;
type BuildStartHook = () => Promise<void>;
type ConfigureServerHook = (server: unknown) => void;

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

const MOCK_ROOT = "/project";
const MOCK_DIRECTORY = "resources/js/types/data/";
const MOCK_FILENAME = "laravel-ts-collected-files.json";
const MOCK_MANIFEST_PATH = mockNormalizePath(
    path.resolve(MOCK_ROOT, MOCK_DIRECTORY, MOCK_FILENAME),
);

const MANIFEST_FILES = [
    "app/Enums/Status.php",
    "app/Enums/Priority.php",
    "app/Models/User.php",
];

/**
 * Create a mock ENOENT filesystem error.
 */
function createEnoentError(
    filePath = MOCK_MANIFEST_PATH,
): NodeJS.ErrnoException {
    const err = new Error(
        `ENOENT: no such file or directory, open '${filePath}'`,
    ) as NodeJS.ErrnoException;
    err.code = "ENOENT";
    return err;
}

/**
 * Create a mock logger for testing.
 */
function createMockLogger() {
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
 * Create a mock resolved config object.
 */
function createMockConfig(
    logger = createMockLogger(),
    command: "serve" | "build" = "serve",
) {
    return {
        root: MOCK_ROOT,
        logger,
        command,
    };
}

/**
 * Create a mock dev server with watcher and WebSocket stubs.
 */
function createMockServer() {
    return {
        watcher: { add: vi.fn() },
        ws: { send: vi.fn() },
    };
}

/**
 * Helper to simulate the Vite plugin lifecycle.
 *
 * Calls configResolved → configureServer (serve only) → buildStart in order
 * and returns the plugin along with the mock config and server for assertions.
 */
async function setupPlugin(
    options?: LaravelTsPublishOptions,
    command: "serve" | "build" = "serve",
) {
    const plugin = laravelTsPublish(options);
    const mockConfig = createMockConfig(undefined, command);
    const mockServer = createMockServer();

    // Simulate lifecycle
    if (typeof plugin.configResolved === "function") {
        (plugin.configResolved as (config: unknown) => void)(mockConfig);
    }

    if (command === "serve" && typeof plugin.configureServer === "function") {
        (plugin.configureServer as ConfigureServerHook)(mockServer);
    }

    if (typeof plugin.buildStart === "function") {
        await (plugin.buildStart as BuildStartHook).call({});
    }

    return { plugin, mockConfig, mockServer };
}

/**
 * Mock the filesystem to return the manifest file with given content.
 */
function mockManifestExists(files: string[] = MANIFEST_FILES) {
    mockReadFile.mockResolvedValue(JSON.stringify(files));
}

/**
 * Mock the filesystem to indicate the manifest does not exist.
 */
function mockManifestMissing() {
    mockReadFile.mockRejectedValue(createEnoentError());
}

describe("laravelTsPublish", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Re-seat the default exec implementation after any test overrides
        mockExec.mockImplementation(
            (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                cb(null, "", "");
            },
        );

        // Re-seat the default fs implementation (reject with ENOENT = manifest missing)
        mockReadFile.mockRejectedValue(createEnoentError());

        // Re-seat normalizePath to simple forward-slash replacement
        mockNormalizePath.mockImplementation((p: string) =>
            p.replace(/\\/g, "/"),
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("plugin metadata", () => {
        it("should have the correct plugin name", () => {
            const plugin = laravelTsPublish();
            expect(plugin.name).toBe("@tolki/vite-plugin-laravel-ts-publish");
        });

        it("should apply to both serve and build modes", () => {
            const plugin = laravelTsPublish();
            expect(plugin.apply).toBeUndefined();
        });

        it("should enforce pre ordering", () => {
            const plugin = laravelTsPublish();
            expect(plugin.enforce).toBe("pre");
        });
    });

    describe("configResolved", () => {
        it("should resolve the manifest path from config root", async () => {
            mockManifestExists();
            await setupPlugin();

            // buildStart will attempt to read the manifest at the resolved path
            expect(mockReadFile).toHaveBeenCalledWith(
                MOCK_MANIFEST_PATH,
                "utf-8",
            );
        });

        it("should use custom directory and filename", async () => {
            mockManifestExists();
            await setupPlugin({
                directory: "custom/dir/",
                filename: "custom-manifest.json",
            });

            const expectedPath = mockNormalizePath(
                path.resolve(MOCK_ROOT, "custom/dir/", "custom-manifest.json"),
            );
            expect(mockReadFile).toHaveBeenCalledWith(expectedPath, "utf-8");
        });
    });

    describe("buildStart", () => {
        it("should load watched files from the manifest", async () => {
            mockManifestExists();
            const { mockConfig } = await setupPlugin();

            expect(mockReadFile).toHaveBeenCalledWith(
                MOCK_MANIFEST_PATH,
                "utf-8",
            );
            expect(mockConfig.logger.info).toHaveBeenCalledWith(
                expect.stringContaining("Watching 3 PHP files"),
                expect.any(Object),
            );
        });

        it("should warn when the manifest file does not exist", async () => {
            mockManifestMissing();
            const { mockConfig } = await setupPlugin();

            expect(mockConfig.logger.warn).toHaveBeenCalledWith(
                expect.stringContaining("Manifest not found"),
            );
        });

        it("should handle a malformed manifest gracefully", async () => {
            mockReadFile.mockResolvedValue("not valid json {{{");

            const { mockConfig } = await setupPlugin();

            expect(mockConfig.logger.error).toHaveBeenCalledWith(
                expect.stringContaining("Failed to read manifest"),
            );
        });

        it("should stringify non-Error throws when reading manifest", async () => {
            mockReadFile.mockRejectedValue("string error");

            const { mockConfig } = await setupPlugin();

            expect(mockConfig.logger.error).toHaveBeenCalledWith(
                expect.stringContaining("string error"),
            );
        });

        it("should handle an empty manifest array", async () => {
            mockManifestExists([]);
            const { mockConfig } = await setupPlugin();

            // Should not log "Watching N files" when there are 0 files
            expect(mockConfig.logger.info).not.toHaveBeenCalledWith(
                expect.stringContaining("Watching"),
                expect.any(Object),
            );
        });

        it("should use singular grammar for 1 file", async () => {
            mockManifestExists(["app/Enums/Status.php"]);
            const { mockConfig } = await setupPlugin();

            expect(mockConfig.logger.info).toHaveBeenCalledWith(
                expect.stringContaining("Watching 1 PHP file for"),
                expect.any(Object),
            );
        });
    });

    describe("handleHotUpdate", () => {
        it("should fall back to null when Map.get returns undefined for a watched file", async () => {
            mockManifestExists();
            const { plugin } = await setupPlugin({
                sourceCommand: false,
            });

            const absoluteFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Status.php",
            );
            const normalizedFile = mockNormalizePath(absoluteFile);

            const originalGet = Map.prototype.get;
            const getSpy = vi
                .spyOn(Map.prototype, "get")
                .mockImplementation(function (
                    this: Map<unknown, unknown>,
                    key: unknown,
                ) {
                    if (key === normalizedFile) {
                        return undefined;
                    }

                    return originalGet.call(this, key);
                });

            await (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });

            // With null sourceFile, falls back to the full command
            expect(mockExec).toHaveBeenCalledWith(
                "php artisan ts:publish --quiet",
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );

            getSpy.mockRestore();
        });

        it("should run the command when a watched file changes", async () => {
            mockManifestExists();
            const { plugin, mockConfig } = await setupPlugin();

            const absoluteFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Status.php",
            );
            const result = await (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });

            expect(result).toEqual([]);
            expect(mockExec).toHaveBeenCalledWith(
                'php artisan ts:publish --source="app/Enums/Status.php" --quiet',
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
            expect(mockConfig.logger.info).toHaveBeenCalledWith(
                expect.stringContaining(
                    'Running: php artisan ts:publish --source="app/Enums/Status.php" --quiet',
                ),
                expect.any(Object),
            );
        });

        it("should use a custom command when configured", async () => {
            mockManifestExists();
            const { plugin } = await setupPlugin({
                command: "sail artisan ts:publish",
            });

            const absoluteFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Status.php",
            );
            await (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });

            expect(mockExec).toHaveBeenCalledWith(
                'sail artisan ts:publish --source="app/Enums/Status.php" --quiet',
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
        });

        it("should return undefined for non-watched files", async () => {
            mockManifestExists();
            const { plugin } = await setupPlugin();

            const result = await (plugin.handleHotUpdate as HotUpdateHook)({
                file: "/project/resources/js/app.ts",
            });

            expect(result).toBeUndefined();
        });

        it("should reload watched files when the manifest changes", async () => {
            mockManifestExists();
            const { plugin, mockConfig } = await setupPlugin();

            // Reset to track new calls
            mockReadFile.mockClear();
            mockExec.mockClear();

            // Update manifest with a new file
            mockManifestExists([...MANIFEST_FILES, "app/Enums/NewEnum.php"]);

            const result = await (plugin.handleHotUpdate as HotUpdateHook)({
                file: MOCK_MANIFEST_PATH,
            });

            expect(result).toEqual([]);
            expect(mockConfig.logger.info).toHaveBeenCalledWith(
                expect.stringContaining("Manifest changed"),
                expect.any(Object),
            );
            // Should have re-read the manifest
            expect(mockReadFile).toHaveBeenCalledWith(
                MOCK_MANIFEST_PATH,
                "utf-8",
            );
            expect(mockExec).not.toHaveBeenCalled();
        });

        it("should log an error when the command fails", async () => {
            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb(new Error("Command not found: php"), null, null);
                },
            );

            mockManifestExists();
            const { plugin, mockConfig } = await setupPlugin();

            const absoluteFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Status.php",
            );
            await (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });

            expect(mockConfig.logger.error).toHaveBeenCalledWith(
                expect.stringContaining("Command failed"),
            );
        });

        it("should stringify non-Error throws from command execution", async () => {
            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb("raw string error", null, null);
                },
            );

            mockManifestExists();
            const { plugin, mockConfig } = await setupPlugin();

            const absoluteFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Status.php",
            );
            await (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });

            expect(mockConfig.logger.error).toHaveBeenCalledWith(
                expect.stringContaining("raw string error"),
            );
        });

        it("should log success message when command succeeds", async () => {
            mockManifestExists();
            const { plugin, mockConfig } = await setupPlugin();

            const absoluteFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Status.php",
            );
            await (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });

            expect(mockConfig.logger.info).toHaveBeenCalledWith(
                expect.stringContaining("Types published successfully"),
                expect.any(Object),
            );
        });
    });

    describe("path normalization", () => {
        it("should normalize backslashes in manifest file paths", async () => {
            mockReadFile.mockResolvedValue(
                JSON.stringify(["app\\Enums\\Status.php"]),
            );

            const { mockConfig } = await setupPlugin();

            expect(mockConfig.logger.info).toHaveBeenCalledWith(
                expect.stringContaining("Watching 1 PHP file for"),
                expect.any(Object),
            );
        });

        it("should match watched files reported with backslash paths", async () => {
            mockManifestExists(["app/Enums/Status.php"]);
            const { plugin } = await setupPlugin();

            // Build a backslash version of the resolved path so the drive
            // letter (if any, on Windows) is included and the normalised
            // result matches the stored watched-file entry.
            const resolved = mockNormalizePath(
                path.resolve(MOCK_ROOT, "app/Enums/Status.php"),
            );
            const backslashFile = resolved.replace(/\//g, "\\");
            const result = await (plugin.handleHotUpdate as HotUpdateHook)({
                file: backslashFile,
            });

            expect(result).toEqual([]);
            expect(mockExec).toHaveBeenCalled();
        });
    });

    describe("debounce", () => {
        it("should queue a re-run if command is already running", async () => {
            let callCount = 0;
            const resolvers: Array<(v: unknown) => void> = [];

            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    callCount++;
                    const p = new Promise((resolve) => {
                        resolvers.push(resolve);
                    });
                    p.then(() => cb(null, "", ""));
                },
            );

            mockManifestExists();
            const { plugin } = await setupPlugin();

            const absoluteFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Status.php",
            );

            // Fire two hot updates concurrently (don't await yet — would deadlock)
            const first = (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });
            const second = (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });

            // First command started, second should be queued (returns immediately)
            expect(callCount).toBe(1);

            // Resolve the first command — this triggers the recursive pending run
            resolvers[0]!(undefined);

            // Wait for the recursive call to start (microtask flush)
            await vi.waitFor(() => {
                expect(callCount).toBe(2);
            });

            // Resolve the second (recursive) command
            resolvers[1]!(undefined);

            // Now both promises can settle
            await first;
            await second;

            expect(callCount).toBe(2);
        });
    });

    describe("build mode", () => {
        it("should run the command with --only-enums by default during buildStart", async () => {
            const { mockConfig } = await setupPlugin(undefined, "build");

            expect(mockExec).toHaveBeenCalledWith(
                "php artisan ts:publish --only-enums --quiet",
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
            expect(mockConfig.logger.info).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Running: php artisan ts:publish --only-enums --quiet",
                ),
                expect.any(Object),
            );
            expect(mockConfig.logger.info).toHaveBeenCalledWith(
                expect.stringContaining("Types published successfully"),
                expect.any(Object),
            );
        });

        it("should not load the manifest in build mode", async () => {
            mockManifestExists();
            await setupPlugin(undefined, "build");

            expect(mockReadFile).not.toHaveBeenCalled();
        });

        it("should throw on command failure by default", async () => {
            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb(new Error("php not found"), null, null);
                },
            );

            await expect(setupPlugin(undefined, "build")).rejects.toThrowError(
                "Command failed",
            );
        });

        it("should not throw when failOnError is false", async () => {
            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb(new Error("php not found"), null, null);
                },
            );

            const { mockConfig } = await setupPlugin(
                { failOnError: false },
                "build",
            );

            expect(mockConfig.logger.error).toHaveBeenCalledWith(
                expect.stringContaining("Command failed"),
            );
        });

        it("should use a custom command in build mode with --only-enums", async () => {
            await setupPlugin({ command: "sail artisan ts:publish" }, "build");

            expect(mockExec).toHaveBeenCalledWith(
                "sail artisan ts:publish --only-enums --quiet",
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
        });

        it("should not append --only-enums when onBuildOnlyEnums is false", async () => {
            await setupPlugin({ onBuildOnlyEnums: false }, "build");

            expect(mockExec).toHaveBeenCalledWith(
                "php artisan ts:publish --quiet",
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
        });

        it("should use custom command without --only-enums when onBuildOnlyEnums is false", async () => {
            await setupPlugin(
                { command: "sail artisan ts:publish", onBuildOnlyEnums: false },
                "build",
            );

            expect(mockExec).toHaveBeenCalledWith(
                "sail artisan ts:publish --quiet",
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
        });

        it("should skip the command when runOnBuildStart is false", async () => {
            await setupPlugin({ runOnBuildStart: false }, "build");

            expect(mockExec).not.toHaveBeenCalled();
        });

        it("should still skip manifest loading when runOnBuildStart is false", async () => {
            mockManifestExists();
            await setupPlugin({ runOnBuildStart: false }, "build");

            expect(mockReadFile).not.toHaveBeenCalled();
        });

        it("should not append --quiet in build mode if quiet is false", async () => {
            await setupPlugin({ quiet: false }, "build");

            expect(mockExec).toHaveBeenCalledWith(
                "php artisan ts:publish --only-enums",
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
        });
    });

    describe("runOnDevStart", () => {
        it("should not run the command on dev start by default", async () => {
            mockManifestExists();
            await setupPlugin();

            // exec should not have been called — only manifest loading
            expect(mockExec).not.toHaveBeenCalled();
        });

        it("should run the command on dev start when enabled", async () => {
            mockManifestExists();
            const { mockConfig } = await setupPlugin({
                runOnDevStart: true,
            });

            expect(mockExec).toHaveBeenCalledWith(
                "php artisan ts:publish --quiet",
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
            expect(mockConfig.logger.info).toHaveBeenCalledWith(
                expect.stringContaining("Types published successfully"),
                expect.any(Object),
            );
        });

        it("should still load the manifest when runOnDevStart is true", async () => {
            mockManifestExists();
            const { mockConfig } = await setupPlugin({
                runOnDevStart: true,
            });

            expect(mockReadFile).toHaveBeenCalledWith(
                MOCK_MANIFEST_PATH,
                "utf-8",
            );
            expect(mockConfig.logger.info).toHaveBeenCalledWith(
                expect.stringContaining("Watching 3 PHP files"),
                expect.any(Object),
            );
        });

        it("should not append --only-enums in dev mode even when onBuildOnlyEnums is true", async () => {
            mockManifestExists();
            await setupPlugin({
                runOnDevStart: true,
                onBuildOnlyEnums: true,
            });

            expect(mockExec).toHaveBeenCalledWith(
                "php artisan ts:publish --quiet",
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
        });
    });

    describe("failOnError", () => {
        it("should default to logging errors in serve mode", async () => {
            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb(new Error("php not found"), null, null);
                },
            );

            mockManifestExists();
            const { plugin, mockConfig } = await setupPlugin({
                runOnDevStart: true,
            });

            // The error during buildStart (runOnDevStart) should be logged, not thrown
            expect(mockConfig.logger.error).toHaveBeenCalledWith(
                expect.stringContaining("Command failed"),
            );

            // Also verify HMR errors are logged
            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb(new Error("php crashed"), null, null);
                },
            );

            const absoluteFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Status.php",
            );
            await (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });

            expect(mockConfig.logger.error).toHaveBeenCalledWith(
                expect.stringContaining("php crashed"),
            );
        });

        it("should throw in serve mode when failOnError is true", async () => {
            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb(new Error("php not found"), null, null);
                },
            );

            mockManifestExists();

            await expect(
                setupPlugin({ runOnDevStart: true, failOnError: true }),
            ).rejects.toThrowError("Command failed");
        });

        it("should default to throwing in build mode", async () => {
            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb(new Error("php not found"), null, null);
                },
            );

            await expect(setupPlugin(undefined, "build")).rejects.toThrowError(
                "Command failed",
            );
        });

        it("should log instead of throwing in build mode when failOnError is false", async () => {
            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb(new Error("php not found"), null, null);
                },
            );

            const { mockConfig } = await setupPlugin(
                { failOnError: false },
                "build",
            );

            expect(mockConfig.logger.error).toHaveBeenCalledWith(
                expect.stringContaining("Command failed"),
            );
        });

        it("should stringify non-Error throws when failOnError is true", async () => {
            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb("raw string failure", null, null);
                },
            );

            await expect(setupPlugin(undefined, "build")).rejects.toThrowError(
                "raw string failure",
            );
        });
    });

    describe("configureServer", () => {
        it("should expose a configureServer hook", () => {
            const plugin = laravelTsPublish();
            expect(typeof plugin.configureServer).toBe("function");
        });
    });

    describe("file watcher", () => {
        it("should add watched files to the dev server watcher", async () => {
            mockManifestExists();
            const { mockServer } = await setupPlugin();

            expect(mockServer.watcher.add).toHaveBeenCalledTimes(3);
            for (const file of MANIFEST_FILES) {
                const absolute = mockNormalizePath(
                    path.resolve(MOCK_ROOT, file),
                );
                expect(mockServer.watcher.add).toHaveBeenCalledWith(absolute);
            }
        });

        it("should add new files to the watcher when manifest reloads", async () => {
            mockManifestExists();
            const { plugin, mockServer } = await setupPlugin();

            mockServer.watcher.add.mockClear();
            mockManifestExists([...MANIFEST_FILES, "app/Enums/NewEnum.php"]);

            await (plugin.handleHotUpdate as HotUpdateHook)({
                file: MOCK_MANIFEST_PATH,
            });

            expect(mockServer.watcher.add).toHaveBeenCalledTimes(4);
        });

        it("should not add files to watcher when manifest is empty", async () => {
            mockManifestExists([]);
            const { mockServer } = await setupPlugin();

            expect(mockServer.watcher.add).not.toHaveBeenCalled();
        });

        it("should gracefully skip watcher when server is unavailable", async () => {
            mockManifestExists();

            // Manually run lifecycle without configureServer
            const plugin = laravelTsPublish();
            const mockConfig = createMockConfig();

            (plugin.configResolved as (config: unknown) => void)(mockConfig);
            await (plugin.buildStart as BuildStartHook).call({});

            // No crash and manifest was still loaded
            expect(mockReadFile).toHaveBeenCalledWith(
                MOCK_MANIFEST_PATH,
                "utf-8",
            );
        });
    });

    describe("reload", () => {
        it("should send full-reload after successful command on dev start", async () => {
            mockManifestExists();
            const { mockServer } = await setupPlugin({
                runOnDevStart: true,
            });

            expect(mockServer.ws.send).toHaveBeenCalledWith({
                type: "full-reload",
            });
        });

        it("should send full-reload after successful HMR-triggered command", async () => {
            mockManifestExists();
            const { plugin, mockServer } = await setupPlugin();

            const absoluteFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Status.php",
            );
            await (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });

            expect(mockServer.ws.send).toHaveBeenCalledWith({
                type: "full-reload",
            });
        });

        it("should not send full-reload when reload is false", async () => {
            mockManifestExists();
            const { mockServer } = await setupPlugin({
                runOnDevStart: true,
                reload: false,
            });

            expect(mockServer.ws.send).not.toHaveBeenCalled();
        });

        it("should not send full-reload when command fails", async () => {
            mockExec.mockImplementation(
                (_cmd: string, _opts: unknown, cb: ExecCallback) => {
                    cb(new Error("php not found"), null, null);
                },
            );

            mockManifestExists();
            const { mockServer } = await setupPlugin({
                runOnDevStart: true,
            });

            expect(mockServer.ws.send).not.toHaveBeenCalled();
        });

        it("should not send full-reload during build mode", async () => {
            const { mockServer } = await setupPlugin(undefined, "build");

            expect(mockServer.ws.send).not.toHaveBeenCalled();
        });
    });

    describe("sourceCommand", () => {
        it("should use the source command with file path from manifest", async () => {
            mockManifestExists();
            const { plugin } = await setupPlugin();

            const absoluteFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Status.php",
            );
            await (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });

            expect(mockExec).toHaveBeenCalledWith(
                'php artisan ts:publish --source="app/Enums/Status.php" --quiet',
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
        });

        it("should use a custom sourceCommand template", async () => {
            mockManifestExists();
            const { plugin } = await setupPlugin({
                sourceCommand: 'sail artisan ts:publish --source="{file}"',
            });

            const absoluteFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Status.php",
            );
            await (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });

            expect(mockExec).toHaveBeenCalledWith(
                'sail artisan ts:publish --source="app/Enums/Status.php" --quiet',
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
        });

        it("should always run the full command when sourceCommand is false", async () => {
            mockManifestExists();
            const { plugin } = await setupPlugin({
                sourceCommand: false,
            });

            const absoluteFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Status.php",
            );
            await (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });

            expect(mockExec).toHaveBeenCalledWith(
                "php artisan ts:publish --quiet",
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
        });

        it("should auto-derive sourceCommand from custom command", async () => {
            mockManifestExists();
            const { plugin } = await setupPlugin({
                command: "sail artisan ts:publish",
            });

            const absoluteFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Status.php",
            );
            await (plugin.handleHotUpdate as HotUpdateHook)({
                file: absoluteFile,
            });

            expect(mockExec).toHaveBeenCalledWith(
                'sail artisan ts:publish --source="app/Enums/Status.php" --quiet',
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
        });

        it("should load array manifest and count watched files", async () => {
            mockManifestExists();
            const { mockConfig } = await setupPlugin();

            expect(mockConfig.logger.info).toHaveBeenCalledWith(
                expect.stringContaining("Watching 3 PHP files"),
                expect.any(Object),
            );
        });

        it("should deduplicate the same file in the queue", async () => {
            const commands: string[] = [];
            const resolvers: Array<(v: unknown) => void> = [];

            mockExec.mockImplementation(
                (cmd: string, _opts: unknown, cb: ExecCallback) => {
                    commands.push(cmd);
                    const p = new Promise((resolve) => {
                        resolvers.push(resolve);
                    });
                    p.then(() => cb(null, "", ""));
                },
            );

            mockManifestExists();
            const { plugin } = await setupPlugin();

            const statusFile = path.resolve(MOCK_ROOT, "app/Enums/Status.php");

            // Fire three hot updates for the same file concurrently
            const first = (plugin.handleHotUpdate as HotUpdateHook)({
                file: statusFile,
            });
            const second = (plugin.handleHotUpdate as HotUpdateHook)({
                file: statusFile,
            });
            const third = (plugin.handleHotUpdate as HotUpdateHook)({
                file: statusFile,
            });

            // First command started with Status file path
            expect(commands).toHaveLength(1);
            expect(commands[0]).toContain('--source="app/Enums/Status.php"');

            // Resolve first — triggers queued run (deduplicated to one entry)
            resolvers[0]!(undefined);

            await vi.waitFor(() => {
                expect(commands).toHaveLength(2);
            });

            expect(commands[1]).toContain('--source="app/Enums/Status.php"');

            resolvers[1]!(undefined);
            await first;
            await second;
            await third;

            // Only two commands total — third was deduplicated
            expect(commands).toHaveLength(2);
        });

        it("should queue distinct files and process each individually", async () => {
            const commands: string[] = [];
            const resolvers: Array<(v: unknown) => void> = [];

            mockExec.mockImplementation(
                (cmd: string, _opts: unknown, cb: ExecCallback) => {
                    commands.push(cmd);
                    const p = new Promise((resolve) => {
                        resolvers.push(resolve);
                    });
                    p.then(() => cb(null, "", ""));
                },
            );

            mockManifestExists();
            const { plugin } = await setupPlugin();

            const statusFile = path.resolve(MOCK_ROOT, "app/Enums/Status.php");
            const priorityFile = path.resolve(
                MOCK_ROOT,
                "app/Enums/Priority.php",
            );
            const userFile = path.resolve(MOCK_ROOT, "app/Models/User.php");

            // Fire three hot updates for different files concurrently
            const first = (plugin.handleHotUpdate as HotUpdateHook)({
                file: statusFile,
            });
            const second = (plugin.handleHotUpdate as HotUpdateHook)({
                file: priorityFile,
            });
            const third = (plugin.handleHotUpdate as HotUpdateHook)({
                file: userFile,
            });

            // First command started with Status file path
            expect(commands).toHaveLength(1);
            expect(commands[0]).toContain('--source="app/Enums/Status.php"');

            // Resolve first — triggers next queued file (Priority)
            resolvers[0]!(undefined);

            await vi.waitFor(() => {
                expect(commands).toHaveLength(2);
            });

            expect(commands[1]).toContain('--source="app/Enums/Priority.php"');

            // Resolve second — triggers next queued file (User)
            resolvers[1]!(undefined);

            await vi.waitFor(() => {
                expect(commands).toHaveLength(3);
            });

            expect(commands[2]).toContain('--source="app/Models/User.php"');

            resolvers[2]!(undefined);
            await first;
            await second;
            await third;

            // All three files processed individually
            expect(commands).toHaveLength(3);
        });

        it("should still use full command on runOnDevStart with object manifest", async () => {
            mockManifestExists();
            await setupPlugin({ runOnDevStart: true });

            // runOnDevStart always uses the full command (no source)
            expect(mockExec).toHaveBeenCalledWith(
                "php artisan ts:publish --quiet",
                { cwd: MOCK_ROOT },
                expect.any(Function),
            );
        });
    });
});
