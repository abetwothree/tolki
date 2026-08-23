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
});
