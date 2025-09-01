import { describe, expect, it } from "vitest";
import { Str } from "@laravel-js-support/str";

describe("Str after", () => {
    it("runs php tests", () => {
        expect(Str.after("hannah", "han")).toBe("nah");
        expect(Str.after("hannah", "n")).toBe("nah");
        expect(Str.after("ééé hannah", "han")).toBe("nah");
        expect(Str.after("hannah", "xxxx")).toBe("hannah");
        expect(Str.after("hannah", "")).toBe("hannah");
        expect(Str.after("han0nah", "0")).toBe("nah");
        expect(Str.after("han0nah", 0)).toBe("nah");
        expect(Str.after("han2nah", 2)).toBe("nah");
    });
});
