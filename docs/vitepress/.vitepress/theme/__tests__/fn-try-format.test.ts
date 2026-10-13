import { collect } from "@tolki/collection";
import { InvalidArgumentException } from "@tolki/utils";
import { describe, expect, it } from "vitest";

import { formatError, formatResult } from "../fn-try-format";

describe("formatResult", () => {
    it.each([
        ["a string, quoted", "a", '"a"'],
        ["undefined", undefined, "undefined"],
        ["NaN", NaN, "NaN"],
        ["negative zero", -0, "-0"],
        ["zero", 0, "0"],
        ["Infinity", Infinity, "Infinity"],
        ["a bigint", 10n, "10n"],
        ["a boolean", true, "true"],
        ["null", null, "null"],
        ["a symbol", Symbol("s"), "Symbol(s)"],
        ["an array", [1, "a", null], '[1,"a",null]'],
        ["an empty array", [], "[]"],
        ["an empty object", {}, "{}"],
        ["entry order kept", { b: 1, a: [NaN] }, '{"b":1,"a":[NaN]}'],
        ["a Map", new Map([["a", 1]]), 'Map(1) {"a" => 1}'],
        ["an empty Map", new Map(), "Map(0) {}"],
        ["a Set", new Set([1, 2]), "Set(2) {1, 2}"],
        ["a Collection via toJSON", collect({ a: 1 }), '{"a":1}'],
        ["a Date via toJSON", new Date(0), '"1970-01-01T00:00:00.000Z"'],
        [
            "a Map nested in an object",
            { m: new Map([[1, 2]]) },
            '{"m":Map(1) {1 => 2}}',
        ],
        [
            "an anonymous function",
            (
                () => () =>
                    1
            )(),
            "[Function (anonymous)]",
        ],
    ])("formats %s", (_name, input, expected) => {
        expect(formatResult(input)).toBe(expected);
    });

    it("formats a named function", () => {
        function get(): void {}

        expect(formatResult(get)).toBe("[Function get]");
    });

    it("formats a class instance with its name", () => {
        class Point {
            x = 1;
            y = 2;
        }

        expect(formatResult(new Point())).toBe('Point {"x":1,"y":2}');
    });

    it("formats a null-prototype object as a plain object", () => {
        const value = Object.assign(Object.create(null), { a: 1 });

        expect(formatResult(value)).toBe('{"a":1}');
    });

    it("marks a self-reference as circular", () => {
        const value: Record<string, unknown> = { a: 1 };
        value.self = value;

        expect(formatResult(value)).toBe('{"a":1,"self":[Circular]}');
    });

    it("does not mark a repeated, non-circular reference", () => {
        const shared = { a: 1 };

        expect(formatResult([shared, shared])).toBe('[{"a":1},{"a":1}]');
    });
});

describe("formatError", () => {
    it("prefixes a subclass name", () => {
        expect(formatError(new InvalidArgumentException("x"))).toBe(
            "InvalidArgumentException: x",
        );
    });

    it("shows a plain Error's message only", () => {
        expect(formatError(new Error("x"))).toBe("x");
    });

    it("stringifies a non-Error", () => {
        expect(formatError("boom")).toBe("boom");
    });
});
