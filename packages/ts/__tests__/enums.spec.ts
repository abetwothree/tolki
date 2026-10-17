import * as Enum from "@tolki/enum";
import * as Ts from "@tolki/ts";
import * as TsEnums from "@tolki/ts/enums";
import { describe, expect, it } from "vitest";

describe("enum re-exports", () => {
    it("re-exports the @tolki/enum functions instead of a copy", () => {
        expect(Ts.from).toBe(Enum.from);
        expect(Ts.tryFrom).toBe(Enum.tryFrom);
        expect(Ts.cases).toBe(Enum.cases);
        expect(Ts.defineEnum).toBe(Enum.defineEnum);
    });

    it("exports exactly the four enum functions from the enums subpath", () => {
        expect(Object.keys(TsEnums).sort()).toEqual([
            "cases",
            "defineEnum",
            "from",
            "tryFrom",
        ]);
        expect(TsEnums.defineEnum).toBe(Enum.defineEnum);
    });

    it("does not re-export SortDirection", () => {
        expect(Ts).not.toHaveProperty("SortDirection");
    });
});
