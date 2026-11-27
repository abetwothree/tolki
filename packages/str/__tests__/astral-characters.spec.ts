import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as Str from "@tolki/str";
import { isFunction } from "@tolki/utils";
import { describe, expect, it } from "vitest";

type Row = [string, unknown[], unknown];

const file = resolve(
    __dirname,
    "../../../docs/php-parity/Str/astral-characters.json",
);

// docs/php-parity/Str/astral-characters.json, "astral-characters"
const rows =
    (
        JSON.parse(readFileSync(file, "utf8")) as {
            probes: { label: string; value: Row[] }[];
        }
    ).probes.filter(({ label }) => label === "astral-characters")[0]?.value ??
    [];

describe("astral characters", () => {
    it("records every row", () => {
        expect(rows).toHaveLength(74);
    });

    it.each(rows)("%s answers as Laravel does", (method, args, expected) => {
        const fn = (Str as Record<string, unknown>)[method];

        expect(isFunction(fn)).toBe(true);

        const result: unknown = Reflect.apply(
            fn as () => unknown,
            undefined,
            args,
        );

        expect(result).toEqual(expected);

        const strings = Array.isArray(result) ? result : [result];

        for (const value of strings) {
            if (typeof value === "string") {
                expect(value.isWellFormed()).toBe(true);
            }
        }
    });
});
