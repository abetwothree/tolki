import { describe, it, expect } from "vitest";
import { Number } from "@laravel-js/number";

describe("Number", () => {
    describe("format", () => {
        it.skip("should format a number", () => {
            expect(Number.format(1234.5678)).toBe("1,234.57");
        });
    });

    describe("parse", () => {
        it.skip("should parse a string to a number", () => {
            expect(Number.parse("1,234.57")).toBe(1234.57);
        });
    });
});
