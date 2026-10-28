// @vitest-environment node
import {
    exportCommand,
    sourceExportCommand,
} from "@tolki/lang/vite-laravel/command";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

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

beforeEach(() => {
    stubPlatform("linux");
});

afterEach(() => {
    Object.defineProperty(process, "platform", platform);
});

describe("exportCommand", () => {
    it("appends --quiet when quiet is set", () => {
        expect(exportCommand("php artisan lang:export", {}, true)).toBe(
            "php artisan lang:export --quiet",
        );
    });

    it("leaves the base alone when quiet is off", () => {
        expect(exportCommand("php artisan lang:export", {}, false)).toBe(
            "php artisan lang:export",
        );
    });

    it("skips --quiet when the base holds it", () => {
        expect(exportCommand("php artisan lang:export --quiet", {}, true)).toBe(
            "php artisan lang:export --quiet",
        );
    });

    it("orders the flags and escapes their values", () => {
        expect(
            exportCommand(
                "php artisan lang:export",
                {
                    output: "my out",
                    locales: ["en"],
                    only: ["a b"],
                    except: ["x'y"],
                },
                true,
            ),
        ).toBe(
            "php artisan lang:export --output='my out' --locale=en --only='a b' --except='x'\\''y' --quiet",
        );
    });

    it("single-quotes a pattern on POSIX", () => {
        expect(
            exportCommand(
                "php artisan lang:export",
                { only: ["admin/*"] },
                false,
            ),
        ).toBe("php artisan lang:export --only='admin/*'");
    });

    it("double-quotes a pattern on Windows, where cmd.exe keeps single quotes", () => {
        stubPlatform("win32");

        expect(
            exportCommand(
                "php artisan lang:export",
                { only: ["admin/*"], except: ["x y"] },
                false,
            ),
        ).toBe('php artisan lang:export --only="admin/*" --except="x y"');
    });
});

describe("sourceExportCommand", () => {
    it("replaces {file} with the escaped file and appends the flags", () => {
        expect(
            sourceExportCommand(
                "php artisan lang:export --source={file}",
                "lang/en/my auth.php",
                { locales: ["en"] },
                true,
            ),
        ).toBe(
            "php artisan lang:export --source='lang/en/my auth.php' --locale=en --quiet",
        );
    });

    it("double-quotes a file with a space on Windows", () => {
        stubPlatform("win32");

        expect(
            sourceExportCommand(
                "php artisan lang:export --source={file}",
                "lang/en/my auth.php",
                {},
                false,
            ),
        ).toBe('php artisan lang:export --source="lang/en/my auth.php"');
    });

    it.each([
        ["$&", "'lang/$&.php'"],
        ["$'", "'lang/$'\\''.php'"],
        ["$$", "'lang/$$.php'"],
        ["$`", "'lang/$`.php'"],
    ])("substitutes %s in the file name literally", (name, escaped) => {
        const file = name === "$'" ? "lang/$'.php" : `lang/${name}.php`;

        expect(
            sourceExportCommand("x --source={file} y", file, {}, false),
        ).toBe(`x --source=${escaped} y`);
    });

    it("still adds --quiet when the file name contains it", () => {
        expect(
            sourceExportCommand(
                "php artisan lang:export --source={file}",
                "lang/en/--quiet.php",
                {},
                true,
            ),
        ).toBe("php artisan lang:export --source=lang/en/--quiet.php --quiet");
    });

    it("skips --quiet when the template holds it", () => {
        expect(
            sourceExportCommand(
                "php artisan lang:export --quiet --source={file}",
                "lang/en/auth.php",
                {},
                true,
            ),
        ).toBe("php artisan lang:export --quiet --source=lang/en/auth.php");
    });
});
