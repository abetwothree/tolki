import * as Str from "@laravel-js/str";
import { describe, expect, it } from "vitest";

describe("Str/Pluralizer", () => {
    it("pluralizes/singularizes and respects uncountable", () => {
        expect(Str.plural("cat")).toBe("cats");
        expect(Str.singular("dogs")).toBe("dog");

        // uncountable words remain unchanged
        expect(Str.plural("fish")).toBe("fish");
        expect(Str.singular("series")).toBe("series");

        // case matching
        expect(Str.plural("DOG")).toBe("DOGS");
        expect(Str.plural("Dog")).toBe("Dogs");

        // isPlural / isSingular
        expect(Str.isPlural("cars")).toBe(true);
        expect(Str.isSingular("car")).toBe(true);
    });
});
