// @vitest-environment node
import type { ExportRunnerOptions } from "@tolki/lang/vite-laravel/runner";
import { createExportRunner } from "@tolki/lang/vite-laravel/runner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ExecCallback = (
    err: unknown,
    stdout: string | null,
    stderr: string | null,
) => void;

const { mockExec } = vi.hoisted(() => ({
    mockExec: vi.fn(
        (_cmd: string, _opts: unknown, _cb: ExecCallback): void => {},
    ),
}));

vi.mock("node:child_process", async (importOriginal) => {
    const actual = await importOriginal<typeof import("node:child_process")>();
    return {
        ...actual,
        default: { ...actual, exec: mockExec },
        exec: mockExec,
    };
});

const FULL = "php artisan lang:export --quiet";

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
 * Build a runner over the mocked exec.
 *
 * @param overrides - Options to replace
 * @returns The runner with its logger and success spy
 */
function setup(overrides: Partial<ExportRunnerOptions> = {}) {
    const logger = createLogger();
    const onSuccess = vi.fn();
    const runner = createExportRunner({
        fullCommand: FULL,
        sourceCommand: (file) => `php artisan lang:export --source=${file}`,
        cwd: "/project",
        logger,
        shouldThrow: () => false,
        onSuccess,
        ...overrides,
    });

    return { runner, logger, onSuccess };
}

/**
 * Finish the nth exec call.
 *
 * @param index - The call to finish
 * @param error - The failure to report, if any
 */
function finish(index: number, error: unknown = null): void {
    const callback = mockExec.mock.calls[index]?.[2];

    callback?.(error, "", "");
}

/**
 * Read the command the nth exec call ran.
 *
 * @param index - The call to read
 * @returns The command string
 */
function commandAt(index: number): string | undefined {
    return mockExec.mock.calls[index]?.[0];
}

describe("createExportRunner", () => {
    beforeEach(() => {
        mockExec.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("runs one command at a time", async () => {
        const { runner } = setup();

        const first = runner.full();
        const second = runner.full();

        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        expect(mockExec.mock.calls[0]?.[1]).toEqual({ cwd: "/project" });

        finish(0);
        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(2));
        finish(1);
        await Promise.all([first, second]);

        expect(commandAt(1)).toBe(FULL);
    });

    it("runs one source export for a single change queued behind a run", async () => {
        const { runner } = setup();

        const first = runner.full();
        const second = runner.source("lang/en/auth.php");

        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        finish(0);
        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(2));
        finish(1);
        await Promise.all([first, second]);

        expect(commandAt(1)).toBe(
            "php artisan lang:export --source=lang/en/auth.php",
        );
    });

    it("runs a source export at once when idle", async () => {
        const { runner } = setup();

        const run = runner.source("lang/en/auth.php");

        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        finish(0);
        await run;

        expect(commandAt(0)).toBe(
            "php artisan lang:export --source=lang/en/auth.php",
        );
    });

    it("runs one source export for the same file queued twice", async () => {
        const { runner } = setup();

        const first = runner.full();
        const second = runner.source("lang/en/auth.php");
        const third = runner.source("lang/en/auth.php");

        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        finish(0);
        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(2));
        finish(1);
        await Promise.all([first, second, third]);

        expect(mockExec).toHaveBeenCalledTimes(2);
        expect(commandAt(1)).toContain("--source=lang/en/auth.php");
    });

    it("collapses two or more queued requests into one full export", async () => {
        const { runner } = setup();

        const runs = [
            runner.full(),
            runner.source("lang/en/a.php"),
            runner.source("lang/en/b.php"),
            runner.source("lang/en/c.php"),
        ];

        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        finish(0);
        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(2));
        finish(1);
        await Promise.all(runs);

        expect(mockExec).toHaveBeenCalledTimes(2);
        expect(commandAt(1)).toBe(FULL);
    });

    it("runs a full export for a queued full request even with one file", async () => {
        const { runner } = setup();

        const runs = [
            runner.full(),
            runner.source("lang/en/a.php"),
            runner.full(),
        ];

        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        finish(0);
        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(2));
        finish(1);
        await Promise.all(runs);

        expect(commandAt(1)).toBe(FULL);
    });

    it("runs the full command when sourceCommand is null", async () => {
        const { runner } = setup({ sourceCommand: null });

        const run = runner.source("lang/en/auth.php");

        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        finish(0);
        await run;

        expect(commandAt(0)).toBe(FULL);
    });

    it("throws with the command's output when shouldThrow is true", async () => {
        const { runner } = setup({ shouldThrow: () => true });
        const failure = Object.assign(new Error("exit 1"), {
            stdout: "Malformed config\n",
            stderr: "",
        });

        const run = runner.full();
        const assertion = expect(run).rejects.toThrow(
            /Command failed.*exit 1\nMalformed config/s,
        );

        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        finish(0, failure);
        await assertion;
    });

    it("does not repeat output the error message already holds", async () => {
        const { runner } = setup({ shouldThrow: () => true });
        const failure = Object.assign(new Error("exit 1: boom"), {
            stdout: "",
            stderr: "boom",
        });

        const run = runner.full();
        const assertion = expect(run).rejects.toThrow(
            /^\[@tolki\/lang\] Command failed: exit 1: boom$/,
        );

        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        finish(0, failure);
        await assertion;
    });

    it("reports a thrown non-error value", async () => {
        const { runner } = setup({ shouldThrow: () => true });

        const run = runner.full();
        const assertion = expect(run).rejects.toThrow(
            "[@tolki/lang] Command failed: nope",
        );

        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        finish(0, "nope");
        await assertion;
    });

    it("rejects every request a failed run covers", async () => {
        const { runner } = setup({ shouldThrow: () => true });

        const first = runner.full();
        const second = runner.source("lang/en/a.php");
        const settled = Promise.allSettled([first, second]);

        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        finish(0, new Error("one"));
        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(2));
        finish(1, new Error("two"));

        const results = await settled;
        expect(results.map((result) => result.status)).toEqual([
            "rejected",
            "rejected",
        ]);
    });

    it("logs the failure and resolves when shouldThrow is false", async () => {
        const { runner, logger } = setup();

        const run = runner.full();

        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        finish(0, new Error("exit 1"));
        await run;

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("Command failed: exit 1"),
        );
    });

    it("calls onSuccess only after a successful run", async () => {
        const { runner, onSuccess } = setup();

        const failed = runner.full();
        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        finish(0, new Error("exit 1"));
        await failed;
        expect(onSuccess).not.toHaveBeenCalled();

        const passed = runner.full();
        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(2));
        finish(1);
        await passed;
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("accepts new work after the queue drains", async () => {
        const { runner } = setup();

        const first = runner.full();
        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(1));
        finish(0);
        await first;

        const second = runner.full();
        await vi.waitFor(() => expect(mockExec).toHaveBeenCalledTimes(2));
        finish(1);
        await second;
    });
});
