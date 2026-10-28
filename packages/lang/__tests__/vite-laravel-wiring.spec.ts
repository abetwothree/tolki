// @vitest-environment node
import type { LaravelLangExportOptions } from "@tolki/lang/vite-laravel";
import { laravelLangExport } from "@tolki/lang/vite-laravel";
import type { ExportRunnerOptions } from "@tolki/lang/vite-laravel/runner";
import { afterEach, describe, expect, it, vi } from "vitest";

const { captured } = vi.hoisted(() => ({
    captured: [] as ExportRunnerOptions[],
}));

vi.mock("@tolki/lang/vite-laravel/runner", () => ({
    createExportRunner: (options: ExportRunnerOptions) => {
        captured.push(options);

        return { full: vi.fn(), source: vi.fn() };
    },
}));

/**
 * Resolve a plugin and return the options it gave the runner.
 *
 * @param options - The plugin options
 * @returns The runner options
 */
function runnerOptions(options?: LaravelLangExportOptions) {
    const plugin = laravelLangExport(options);

    (plugin.configResolved as (config: unknown) => void)({
        root: "/project",
        logger: {},
        command: "serve",
    });

    return captured[captured.length - 1] as ExportRunnerOptions;
}

describe("laravelLangExport runner wiring", () => {
    afterEach(() => {
        captured.length = 0;
        vi.restoreAllMocks();
    });

    it("derives the source command from the command and shares the flags", () => {
        const { sourceCommand } = runnerOptions({ locales: ["en"] });

        expect(sourceCommand?.("lang/en/my auth.php")).toBe(
            "php artisan lang:export --source='lang/en/my auth.php' --locale=en --quiet",
        );
    });

    it("uses a custom source command template", () => {
        const { sourceCommand } = runnerOptions({
            sourceCommand: "sail artisan lang:export --source={file}",
        });

        expect(sourceCommand?.("lang/en/auth.php")).toBe(
            "sail artisan lang:export --source=lang/en/auth.php --quiet",
        );
    });

    it("passes no source command when sourceCommand is false", () => {
        expect(
            runnerOptions({ sourceCommand: false }).sourceCommand,
        ).toBeNull();
    });

    it("does not throw by default in dev", () => {
        const { shouldThrow } = runnerOptions();

        expect(shouldThrow()).toBe(false);
    });
});
