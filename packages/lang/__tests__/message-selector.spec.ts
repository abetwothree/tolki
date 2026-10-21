import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { choose, getPluralIndex } from "@tolki/lang";
import { describe, expect, it } from "vitest";

interface Probe {
    label: string;
    value: unknown;
}

interface ChooseRow {
    line: string;
    number: number;
    expected: string;
    chosen: string;
}

function transcript(path: string): Probe[] {
    const file = resolve(__dirname, "../../../docs/php-parity", path);

    return (JSON.parse(readFileSync(file, "utf8")) as { probes: Probe[] })
        .probes;
}

describe("choose", () => {
    // docs/php-parity/MessageSelector/choose.json, "choose-laravel-data-00"
    it("matches every row of Laravel's choose data", () => {
        const rows = transcript("MessageSelector/choose.json").filter(
            ({ label }) => label.startsWith("choose-laravel-data-"),
        );

        expect(rows.length).toBeGreaterThanOrEqual(52);

        for (const { value } of rows) {
            const { line, number, chosen } = value as ChooseRow;

            expect(choose(line, number, "en")).toBe(chosen);
        }
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-float-uses-range"
    it("uses a range for a float", () => {
        expect(choose("{0} zero|{1} one|[2,*] many", 2.75, "pl")).toBe("many");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-float-half-is-plural"
    it("treats a half as plural", () => {
        expect(choose("singular|plural", 0.5, "en")).toBe("plural");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-negative-one-singular", "choose-negative-two-plural",
    // "choose-negative-ru-one", "choose-negative-ru-two", "choose-negative-ru-five",
    // "choose-negative-ru-twenty-one"
    it("reads a negative number by its absolute value", () => {
        expect(choose("item|items", -1, "en")).toBe("item");
        expect(choose("item|items", -2, "en")).toBe("items");

        const files = "файл|файла|файлов";

        expect(choose(files, -1, "ru")).toBe("файл");
        expect(choose(files, -2, "ru")).toBe("файла");
        expect(choose(files, -5, "ru")).toBe("файлов");
        expect(choose(files, -21, "ru")).toBe("файл");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-negative-exact-condition"
    it("matches an exact negative condition", () => {
        expect(choose("{-1} minus one|[*,*] other", -1, "en")).toBe(
            "minus one",
        );
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-plural-segment-keeps-spaces",
    // "choose-first-segment-keeps-spaces"
    it("keeps plural segments untrimmed", () => {
        expect(choose("one | many", 2, "en")).toBe(" many");
        expect(choose("one | many", 1, "en")).toBe("one ");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-inline-trims-php-whitespace"
    it("trims an inline segment as PHP's trim does", () => {
        expect(choose("{1} \t one \n|[2,*] many", 1, "en")).toBe("one");
        expect(choose("{1}\0\x0Bone\r|[2,*] many", 1, "en")).toBe("one");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-inline-keeps-nbsp"
    it("keeps a non-breaking space", () => {
        expect(choose("{1}\u{a0}one\u{a0}|[2,*] many", 1, "en")).toBe(
            "\u{a0}one\u{a0}",
        );
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-inline-keeps-form-feed"
    it("keeps a form feed", () => {
        expect(choose("{1}\x0Bone\f|[2,*] many", 1, "en")).toBe("one\f");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-inline-spans-lines"
    it("lets an inline segment span lines", () => {
        expect(choose("{1}a\r\nb|[2,*]c", 1, "en")).toBe("a\r\nb");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-condition-with-spaces-is-text"
    it("reads a condition with spaces as text", () => {
        expect(choose("{ 1 } one|many", 1, "en")).toBe("{ 1 } one");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-non-ascii-digit-is-text"
    it("reads a non-ASCII digit as text", () => {
        expect(choose("{١}one|many", 1, "en")).toBe("{١}one");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-range-empty-start"
    it("reads an empty range start as PHP compares it", () => {
        expect(choose("[,5] low|[6,*] high", 3, "en")).toBe("low");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-range-extra-comma"
    it("keeps commas after the first in the range end", () => {
        expect(choose("[1,2,3] a|b", 2, "en")).toBe("a");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-range-reversed"
    it("never matches a reversed range", () => {
        expect(choose("[5,1] a|b", 3, "en")).toBe("b");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-range-star-star"
    it("matches a star-to-star range", () => {
        expect(choose("[*,*] all|none", 7, "en")).toBe("all");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-exact-loose-float"
    it("compares an exact condition loosely", () => {
        expect(choose("{1.0}one|many", 1, "en")).toBe("one");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-exact-star-never-matches"
    it("never matches a star as an exact condition", () => {
        expect(choose("{*}any|other", 5, "en")).toBe("other");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-empty-condition"
    it("never matches an empty condition", () => {
        expect(choose("{}none|[1,*]some", 0, "en")).toBe("some");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-null-locale"
    it("uses the first form for a null locale", () => {
        expect(choose("item|items", 5, null)).toBe("item");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-hyphen-locale"
    it("uses the default rule for a hyphenated locale", () => {
        expect(choose("item|items", 5, "en-US")).toBe("item");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-index-past-segments"
    it("falls back to the first segment past the end", () => {
        expect(choose("a|b", 5, "ru")).toBe("a");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-empty-line"
    it("returns an empty string for an empty line", () => {
        expect(choose("", 1, "en")).toBe("");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-lone-pipe"
    it("returns an empty string for a lone pipe", () => {
        expect(choose("|", 2, "en")).toBe("");
    });

    // docs/php-parity/MessageSelector/choose.json, "choose-numeric-string-number", "choose-null-number"
    it("reads a numeric string or null as PHP does", () => {
        expect(
            Reflect.apply(choose, undefined, ["item|items", "-3", "en"]),
        ).toBe("items");
        expect(
            Reflect.apply(choose, undefined, ["item|items", null, "en"]),
        ).toBe("items");
    });
});

describe("getPluralIndex", () => {
    // docs/php-parity/MessageSelector/getPluralIndex.json, "plural-index-numbers", "plural-index-en"
    it("matches Laravel for every locale and number", () => {
        const probes = transcript("MessageSelector/getPluralIndex.json");

        const numbers = probes.find(({ label }) => {
            return label === "plural-index-numbers";
        })?.value as number[];

        const rows = probes.filter(({ label }) => {
            return (
                label.startsWith("plural-index-") &&
                !["numbers", "null-number", "numeric-string"].includes(
                    label.slice("plural-index-".length),
                )
            );
        });

        expect(rows).toHaveLength(284);

        for (const { label, value } of rows) {
            const name = label.slice("plural-index-".length);
            const locale = name === "empty-locale" ? "" : name;

            numbers.forEach((number, i) => {
                expect(
                    getPluralIndex(locale, number),
                    `${locale} ${number}`,
                ).toBe((value as number[])[i]);
            });
        }
    });

    // docs/php-parity/MessageSelector/getPluralIndex.json, "plural-index-null-number", "plural-index-numeric-string"
    it("reads a null or a numeric string as PHP does", () => {
        expect(Reflect.apply(getPluralIndex, undefined, ["en", null])).toBe(1);
        expect(Reflect.apply(getPluralIndex, undefined, ["ru", "-21"])).toBe(0);
    });
});
