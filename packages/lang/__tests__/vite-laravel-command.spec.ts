// @vitest-environment node
import {
    exportCommand,
    sourceExportCommand,
} from "@tolki/lang/vite-laravel/command";
import { describe, expect, it } from "vitest";

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
});
