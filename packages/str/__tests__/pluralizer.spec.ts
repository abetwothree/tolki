import { Pluralizer } from "@laravel-js/str";
import { describe, expect,it } from "vitest";

describe("Str/Pluralizer", () => {
    it("pluralizes/singularizes and respects uncountable", () => {
        expect(Pluralizer.plural("cat")).toBe("cats");
        expect(Pluralizer.singular("dogs")).toBe("dog");

        // uncountable words remain unchanged
        expect(Pluralizer.plural("fish")).toBe("fish");
        expect(Pluralizer.singular("series")).toBe("series");

        // case matching
        expect(Pluralizer.plural("DOG")).toBe("DOGS");
        expect(Pluralizer.plural("Dog")).toBe("Dogs");

        // isPlural / isSingular
        expect(Pluralizer.isPlural("cars")).toBe(true);
        expect(Pluralizer.isSingular("car")).toBe(true);
    });
});
