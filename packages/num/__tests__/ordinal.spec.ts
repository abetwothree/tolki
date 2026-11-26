import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { isString, isUndefined } from "@tolki/utils";
import { describe, expect, it } from "vitest";

import { formatOrdinal } from "../src/ordinal";
import {
    INDICATORS,
    type OrdinalRule,
    ordinalRule,
} from "../src/ordinal/rules";

interface Probe {
    label: string;
    value: unknown;
}

function transcript(path: string): Probe[] {
    const file = resolve(__dirname, "../../../docs/php-parity", path);

    return (JSON.parse(readFileSync(file, "utf8")) as { probes: Probe[] })
        .probes;
}

function probeValue<TValue>(path: string, label: string): TValue {
    return transcript(path).find((probe) => probe.label === label)
        ?.value as TValue;
}

/**
 * The BCP 47 tag of an ICU locale id.
 */
function tagOf(locale: string): string {
    return Intl.getCanonicalLocales(locale.replaceAll("_", "-"))[0] as string;
}

/**
 * Read a number the probe spelled as a string, since JSON holds no INF, NAN or -0.
 */
function numberOf(spelling: string): number {
    const named: Record<string, number> = {
        INF: Infinity,
        "-INF": -Infinity,
        NAN: NaN,
        "-0": -0,
    };

    return named[spelling] ?? Number(spelling);
}

/**
 * Every string a rule set writes beside the number.
 */
function textsOf(rule: OrdinalRule): string[] {
    const { prefix, suffix, whole, negative } = rule;
    const texts = [prefix, negative, ...Object.values(whole ?? {})];

    if (isString(suffix)) {
        texts.push(suffix);
    } else if (!isUndefined(suffix) && "plural" in suffix) {
        texts.push(...Object.values(suffix.plural));
    } else if (!isUndefined(suffix)) {
        texts.push(
            ...INDICATORS[suffix.indicator]
                .map(([, text]) => text)
                .filter(isString),
        );
    }

    return texts.filter(isString);
}

describe("ordinalRule", () => {
    // docs/php-parity/Php/NumberFormatter.json, "ordinal-rule-sets", "ordinal-rule-set-of-each-locale"
    const sets = probeValue<string[]>(
        "Php/NumberFormatter.json",
        "ordinal-rule-sets",
    );
    const setOfLocale = probeValue<Record<string, number>>(
        "Php/NumberFormatter.json",
        "ordinal-rule-set-of-each-locale",
    );

    it("gives the locales of one ICU rule set one rule, and each ICU rule set its own", () => {
        const ruleOfSet = new Map<number, OrdinalRule>();

        for (const [locale, set] of Object.entries(setOfLocale)) {
            const rule = ordinalRule(tagOf(locale));

            expect(ruleOfSet.get(set) ?? rule, locale).toBe(rule);
            ruleOfSet.set(set, rule);
        }

        expect(Object.keys(setOfLocale)).toHaveLength(906);
        expect(new Set(ruleOfSet.values()).size).toBe(sets.length);
    });

    it("writes only text that ICU's rule set holds, with ICU's grouping, fraction and sign rules", () => {
        for (const [locale, set] of Object.entries(setOfLocale)) {
            const rule = ordinalRule(tagOf(locale));
            const pattern = sets[set] as string;
            const ruleText = pattern.replaceAll(/%[\w-]+/g, "");

            // A rule set writes `-` before its suffix text, which this port keeps in the text.
            for (const text of textsOf(rule)) {
                expect(ruleText, locale).toContain(text.replace(/^-/, ""));
            }

            expect(rule.indian === true, locale).toBe(
                pattern.includes("#,##,##0"),
            );
            expect(rule.fraction === true, locale).toBe(
                pattern.includes("x.x:"),
            );
            expect(isUndefined(rule.negative), locale).toBe(
                !pattern.includes(">#,##0>"),
            );
            expect(rule.indirect === true, locale).toBe(
                /%digits-ordinal:\n0: =%/.test(pattern),
            );
        }
    });

    it("gives a tag outside ICU's locales the rule of the rule set ICU falls back to", () => {
        // docs/php-parity/Php/NumberFormatter.json, "ordinal-rule-set-of-fallback-tags"
        const setOfTag = probeValue<Record<string, number>>(
            "Php/NumberFormatter.json",
            "ordinal-rule-set-of-fallback-tags",
        );
        const ruleOfSet = new Map(
            Object.entries(setOfLocale).map(([locale, set]) => [
                set,
                ordinalRule(tagOf(locale)),
            ]),
        );

        for (const [tag, set] of Object.entries(setOfTag)) {
            expect(ordinalRule(tagOf(tag)), tag).toBe(ruleOfSet.get(set));
        }

        expect(Object.keys(setOfTag)).toHaveLength(50);
    });
});

describe("formatOrdinal", () => {
    // docs/php-parity/Number/ordinal.json, "ordinal-inputs", "ordinal-of-en"
    it("matches Laravel for one locale of each ICU rule set and each number", () => {
        const probes = transcript("Number/ordinal.json");
        const inputs = probeValue<string[]>(
            "Number/ordinal.json",
            "ordinal-inputs",
        ).map(numberOf);
        const rows = probes.filter(({ label }) =>
            label.startsWith("ordinal-of-"),
        );

        expect(rows).toHaveLength(50);

        for (const { label, value } of rows) {
            const tag = tagOf(label.slice("ordinal-of-".length));

            inputs.forEach((input, i) => {
                expect(formatOrdinal(input, tag), `${tag} ${input}`).toBe(
                    (value as string[])[i],
                );
            });
        }
    });

    // docs/php-parity/Number/ordinal.json, "ordinal-negative-infinity"
    it("matches Laravel for -INF, which loses its sign behind an indirect rule set", () => {
        const answers = probeValue<Record<string, string>>(
            "Number/ordinal.json",
            "ordinal-negative-infinity",
        );

        expect(Object.keys(answers)).toHaveLength(43);

        for (const [locale, answer] of Object.entries(answers)) {
            expect(formatOrdinal(-Infinity, tagOf(locale)), locale).toBe(
                answer,
            );
        }
    });

    // docs/php-parity/Number/ordinal.json, "ordinal-large-fractions"
    it("matches Laravel for a large fraction, whose plural text ICU picks through a saturating cast", () => {
        const answers = probeValue<Record<string, Record<string, string>>>(
            "Number/ordinal.json",
            "ordinal-large-fractions",
        );
        const cases = Object.entries(answers).flatMap(([spelling, byLocale]) =>
            Object.entries(byLocale).map(
                ([locale, answer]) =>
                    [numberOf(spelling), locale, answer] as const,
            ),
        );

        expect(cases).toHaveLength(16);

        for (const [input, locale, answer] of cases) {
            expect(
                formatOrdinal(input, tagOf(locale)),
                `${locale} ${input}`,
            ).toBe(answer);
        }
    });

    it("writes -INF after the negative rule's text where ICU crashes", () => {
        // JS-only: PHP's ICU segfaults on -INF for these rule sets, so there is no answer to match.
        expect(formatOrdinal(-Infinity, "ja")).toBe("第\u2212∞");
        expect(formatOrdinal(-Infinity, "ms")).toBe("\u2212ke-∞");
        expect(formatOrdinal(-Infinity, "th")).toBe("ที่\u00A0\u2212∞");
    });

    it("writes the rounded value's ordinal where ICU's indicator rules loop", () => {
        // JS-only: docs/php-parity/Number/ordinal.json, "ordinal-rounds-past-a-divisor" records ICU giving up.
        expect(formatOrdinal(99.6, "af")).toBe("100ste");
        expect(formatOrdinal(99.6, "bg")).toBe("100-тен");
        expect(formatOrdinal(1099.5, "bg")).toBe("1\u00A0100-тен");
    });
});
