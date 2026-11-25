import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { strimWidth, strWidth, WIDE_RANGES } from "../src/width";

interface Probe {
    label: string;
    value: unknown;
}

function transcript(path: string): Probe[] {
    const file = resolve(__dirname, "../../../docs/php-parity", path);

    return (JSON.parse(readFileSync(file, "utf8")) as { probes: Probe[] })
        .probes;
}

describe("WIDE_RANGES", () => {
    it("matches PHP's mb_strwidth table", () => {
        // docs/php-parity/Php/mb_strwidth.json, "mb_strwidth-wide-ranges"
        const ranges = transcript("Php/mb_strwidth.json").find(
            ({ label }) => label === "mb_strwidth-wide-ranges",
        )?.value;

        expect(WIDE_RANGES).toEqual(ranges);
    });
});

describe("strWidth", () => {
    it("counts wide characters as two, as mb_strwidth does", () => {
        // docs/php-parity/Php/mb_strwidth.json, "mb_strwidth-samples"
        expect(
            ["😀", "日", "é", "𝒳", "e\u0301", "\u200B"].map((value) =>
                strWidth(value),
            ),
        ).toEqual([2, 2, 1, 1, 2, 1]);
    });

    it("counts each wide range's edges as two and their neighbours as one", () => {
        // Runs never touch, so the code points just outside a run are always narrow.
        for (const [first, last] of WIDE_RANGES) {
            expect(strWidth(String.fromCodePoint(first))).toBe(2);
            expect(strWidth(String.fromCodePoint(last))).toBe(2);
            expect(strWidth(String.fromCodePoint(first - 1))).toBe(1);
            expect(strWidth(String.fromCodePoint(last + 1))).toBe(1);
        }
    });
});

describe("strimWidth", () => {
    it("keeps the longest prefix that fits, never splitting a wide character", () => {
        // docs/php-parity/Str/limit.json, "limit-astral", "limit-zero-and-negative"
        expect(strimWidth("😀😀😀", 3)).toBe("😀");
        expect(strimWidth("a😀😀", 4)).toBe("a😀");
        expect(strimWidth("abc", 0)).toBe("");
    });

    it("counts a negative width back from the full width", () => {
        // docs/php-parity/Str/limit.json, "limit-zero-and-negative"
        expect(strimWidth("😀😀😀", -1)).toBe("😀😀");
        expect(strimWidth("abc", -1)).toBe("ab");
    });
});
