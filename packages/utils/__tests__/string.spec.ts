import * as Utils from "@tolki/utils";
import { describe, expect, it } from "vitest";

describe("Utils", () => {
    describe("toLower", () => {
        it("should convert a string to lowercase", () => {
            expect(Utils.toLower("HELLO")).toBe("hello");
            expect(Utils.toLower("Hello World")).toBe("hello world");
            expect(Utils.toLower("")).toBe("");
            expect(Utils.toLower("already lowercase")).toBe(
                "already lowercase",
            );
        });
    });

    describe("toUpper", () => {
        it("should convert a string to uppercase", () => {
            expect(Utils.toUpper("hello")).toBe("HELLO");
            expect(Utils.toUpper("Hello World")).toBe("HELLO WORLD");
            expect(Utils.toUpper("")).toBe("");
            expect(Utils.toUpper("ALREADY UPPERCASE")).toBe(
                "ALREADY UPPERCASE",
            );
        });
    });

    describe("lowerFirst", () => {
        it("should convert the first character to lowercase", () => {
            expect(Utils.lowerFirst("Hello")).toBe("hello");
            expect(Utils.lowerFirst("HELLO")).toBe("hELLO");
            expect(Utils.lowerFirst("hello")).toBe("hello");
            expect(Utils.lowerFirst("A")).toBe("a");
        });

        it("should return empty string unchanged", () => {
            expect(Utils.lowerFirst("")).toBe("");
        });
    });

    describe("upperFirst", () => {
        it("should convert the first character to uppercase", () => {
            expect(Utils.upperFirst("hello")).toBe("Hello");
            expect(Utils.upperFirst("HELLO")).toBe("HELLO");
            expect(Utils.upperFirst("Hello")).toBe("Hello");
            expect(Utils.upperFirst("a")).toBe("A");
        });

        it("should return empty string unchanged", () => {
            expect(Utils.upperFirst("")).toBe("");
        });
    });

    describe("escapeShellArg", () => {
        it("should return empty quoted string for empty input", () => {
            expect(Utils.escapeShellArg("")).toBe("''");
        });

        it("should pass through safe strings unchanged", () => {
            expect(Utils.escapeShellArg("app/Models/User.php")).toBe(
                "app/Models/User.php",
            );
        });

        it("should single-quote strings with spaces", () => {
            expect(Utils.escapeShellArg("my file.php")).toBe("'my file.php'");
        });

        it("should escape single quotes within the value", () => {
            expect(Utils.escapeShellArg("it's a file.php")).toBe(
                "'it'\\''s a file.php'",
            );
        });
    });

    describe("escapeWindowsShellArg", () => {
        it("should return empty double quotes for empty input", () => {
            expect(Utils.escapeWindowsShellArg("")).toBe('""');
        });

        it("should pass through safe strings unchanged", () => {
            expect(Utils.escapeWindowsShellArg("app/Models/User.php")).toBe(
                "app/Models/User.php",
            );
        });

        it("should double-quote strings with spaces or wildcards", () => {
            expect(Utils.escapeWindowsShellArg("my file.php")).toBe(
                '"my file.php"',
            );
            expect(Utils.escapeWindowsShellArg("admin/*")).toBe('"admin/*"');
        });

        it("should keep single quotes literal", () => {
            expect(Utils.escapeWindowsShellArg("it's.php")).toBe('"it\'s.php"');
        });

        it("should escape double quotes within the value", () => {
            expect(Utils.escapeWindowsShellArg('say "hi"')).toBe(
                '"say \\"hi\\""',
            );
        });

        it("should double a run of backslashes before a double quote", () => {
            expect(Utils.escapeWindowsShellArg('a\\\\"b')).toBe(
                '"a\\\\\\\\\\"b"',
            );
        });

        it("should double trailing backslashes before the closing quote", () => {
            expect(Utils.escapeWindowsShellArg("C:\\my dir\\\\")).toBe(
                '"C:\\my dir\\\\\\\\"',
            );
        });

        it("should leave backslashes elsewhere alone", () => {
            expect(Utils.escapeWindowsShellArg("lang\\en\\auth.php")).toBe(
                '"lang\\en\\auth.php"',
            );
        });

        it("should leave percent signs as they are", () => {
            expect(Utils.escapeWindowsShellArg("50% off")).toBe('"50% off"');
        });
    });
});
