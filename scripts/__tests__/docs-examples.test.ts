import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
    type CompiledExample,
    compileExample,
    orderedShape,
    runExample,
} from "../docs-examples.ts";
import { type MarkdownFence, parseFences } from "../docs-markdown.ts";

const ROOT = resolve(__dirname, "../..");

/**
 * Builds a fence the way parseFences would.
 *
 * @param code - The fence body.
 * @param lang - The fence language.
 * @returns The fence, opening on line 10.
 */
function fence(code: string, lang = "js"): MarkdownFence {
    return { lang, title: null, code, line: 10, codeGroup: null };
}

/**
 * Compiles code that must hold an assertion.
 *
 * @param code - The fence body.
 * @returns The compiled example.
 */
function compiled(code: string): CompiledExample {
    const example = compileExample(fence(code), "file.md");

    if (example === null) {
        throw new Error("expected an example");
    }

    return example;
}

describe("orderedShape", () => {
    it("reports a different key order", () => {
        expect(orderedShape({ a: 1, b: 2 })).not.toEqual(
            orderedShape({ b: 2, a: 1 }),
        );
        expect(orderedShape({ a: 1, b: 2 })).toEqual(
            orderedShape({ a: 1, b: 2 }),
        );
    });

    it("tells apart values deep equality conflates", () => {
        expect(orderedShape(1)).not.toEqual(orderedShape("1"));
        expect(orderedShape(-0)).not.toEqual(orderedShape(0));
        expect(orderedShape(Number.NaN)).not.toEqual(orderedShape(null));
        expect(orderedShape(undefined)).not.toEqual(orderedShape(null));
    });

    it("reads a Map and a Set in insertion order", () => {
        expect(
            orderedShape(
                new Map([
                    ["b", 1],
                    ["a", 2],
                ]),
            ),
        ).not.toEqual(
            orderedShape(
                new Map([
                    ["a", 2],
                    ["b", 1],
                ]),
            ),
        );
        expect(orderedShape(new Set([2, 1]))).not.toEqual(
            orderedShape(new Set([1, 2])),
        );
    });

    it("reads a null-prototype object like a plain one", () => {
        const bare = Object.assign(Object.create(null) as object, { a: 1 });

        expect(orderedShape(bare)).toEqual(orderedShape({ a: 1 }));
    });

    it("reads arrays and dates", () => {
        expect(orderedShape([1, [2]])).toEqual({
            type: "array",
            items: [orderedShape(1), orderedShape([2])],
        });
        expect(orderedShape(new Date(0))).toEqual({
            type: "date",
            iso: "1970-01-01T00:00:00.000Z",
        });
        expect(orderedShape(new Date(Number.NaN))).toEqual({
            type: "date",
            iso: "Invalid Date",
        });
    });

    it("throws for a class instance or a function", () => {
        class Box {}

        expect(() => orderedShape(new Box())).toThrow(TypeError);
        expect(() => orderedShape(new Box())).toThrow(".all() or .toArray()");
        expect(() => orderedShape(() => 1)).toThrow(".all() or .toArray()");
    });

    it("refuses a circular value", () => {
        const a: unknown[] = [];

        a.push(a);

        expect(() => orderedShape(a)).toThrow("circular");
    });
});

describe("compileExample", () => {
    it("returns null for a fence with no assertion", () => {
        expect(compileExample(fence("get();"), "file.md")).toBeNull();
    });

    it("returns null for a bash fence", () => {
        expect(
            compileExample(fence("pnpm add x\n// => 1", "bash"), "file.md"),
        ).toBeNull();
    });

    it("rewrites imports and lists their modules", () => {
        const example = compiled(
            'import { get as g } from "@tolki/arr";\ng([1], 0);\n// => 1',
        );

        expect(example.modules).toEqual(["@tolki/arr"]);
        expect(example.body).toContain('{ get: g } = __m["@tolki/arr"]');
        expect(example).toMatchObject({ file: "file.md", line: 10 });
    });

    it("joins a multi-line expected value", async () => {
        const example = compiled("[1, 2];\n// => [\n//   1,\n//   2,\n// ]");

        await expect(runExample(example, async () => ({}))).resolves.toBe(
            undefined,
        );
    });

    it("ends the expected value at a balanced expression, so a note below it stays a comment", async () => {
        const example = compiled("1 + 1;\n// => 2\n// a note about it\n3;");

        await expect(runExample(example, async () => ({}))).resolves.toBe(
            undefined,
        );
    });

    it("does not count brackets inside strings or templates", async () => {
        const example = compiled(
            'const n = 1;\n`a(${n}`;\n// => `a(${n}`\n// a note )\n"(";\n// => "("',
        );

        await expect(runExample(example, async () => ({}))).resolves.toBe(
            undefined,
        );
    });

    it("throws when the comment follows a declaration", () => {
        expect(() =>
            compileExample(fence("const x = 1;\n// => 1"), "file.md"),
        ).toThrow("`// =>` must follow an expression statement (file.md:12)");
    });
});

describe("runExample", () => {
    it("resolves a passing assertion", async () => {
        await expect(
            runExample(compiled("1 + 1;\n// => 2"), async () => ({})),
        ).resolves.toBe(undefined);
    });

    it("awaits an asserted expression", async () => {
        await expect(
            runExample(
                compiled("await Promise.resolve(5);\n// => 5"),
                async () => ({}),
            ),
        ).resolves.toBe(undefined);
    });

    it("rejects a failing assertion with the file and line", async () => {
        await expect(
            runExample(
                compiled("const a = 1;\na + 1;\n// => 3"),
                async () => ({}),
            ),
        ).rejects.toThrow("file.md:12");
    });

    it("fails on a different key order", async () => {
        await expect(
            runExample(
                compiled("({ a: 1, b: 2 });\n// => ({ b: 2, a: 1 })"),
                async () => ({}),
            ),
        ).rejects.toThrow("file.md:11");
    });

    it("loads imported modules", async () => {
        const example = compiled(
            'import { double } from "x";\ndouble(2);\n// => 4',
        );

        await expect(
            runExample(example, async (specifier) => {
                expect(specifier).toBe("x");

                return { double: (n: number) => n * 2 };
            }),
        ).resolves.toBe(undefined);
    });

    it("awaits a promise result", async () => {
        await expect(
            runExample(
                compiled("Promise.resolve(5);\n// => 5"),
                async () => ({}),
            ),
        ).resolves.toBe(undefined);
    });

    it("passes when the call throws the named error", async () => {
        const code =
            'import { fail } from "x";\nfail();\n// => throws InvalidArgumentException';
        const load = async (): Promise<Record<string, unknown>> => ({
            fail: () => {
                const error = new Error("no");
                error.name = "InvalidArgumentException";

                throw error;
            },
        });

        await expect(runExample(compiled(code), load)).resolves.toBe(undefined);
    });

    it("fails when the call throws nothing", async () => {
        await expect(
            runExample(
                compiled("1;\n// => throws InvalidArgumentException"),
                async () => ({}),
            ),
        ).rejects.toThrow("file.md:11");
    });

    it("names a non-Error thrown value", async () => {
        await expect(
            runExample(
                compiled(
                    'import { fail } from "x";\nfail();\n// => throws Error',
                ),
                async () => ({
                    fail: () => {
                        throw "boom";
                    },
                }),
            ),
        ).rejects.toThrow("got boom");
    });

    it("fails when the call throws another error", async () => {
        await expect(
            runExample(
                compiled(
                    'import { fail } from "x";\nfail();\n// => throws InvalidArgumentException',
                ),
                async () => ({
                    fail: () => {
                        throw new TypeError("no");
                    },
                }),
            ),
        ).rejects.toThrow("TypeError");
    });
});

/**
 * Every Markdown file under a directory of the repo, or none if it is missing.
 *
 * @param dir - The directory relative to the repo root.
 * @returns Repo-relative paths, sorted.
 */
function markdownUnder(dir: string): string[] {
    const found: string[] = [];

    const walk = (relative: string): void => {
        let entries: string[];

        try {
            entries = readdirSync(join(ROOT, relative));
        } catch {
            return;
        }

        for (const entry of entries) {
            const path = `${relative}/${entry}`;

            if (statSync(join(ROOT, path)).isDirectory()) {
                walk(path);
            } else if (path.endsWith(".md")) {
                found.push(path);
            }
        }
    };

    walk(dir);

    return found.sort();
}

describe("documented examples", () => {
    const files = [
        ...markdownUnder("docs/vitepress/arrays-objects"),
        ...markdownUnder("docs/vitepress/collections"),
        "scripts/__tests__/fixtures/docs-examples.md",
    ];
    const examples = files.flatMap((file) =>
        parseFences(readFileSync(join(ROOT, file), "utf8")).flatMap((found) => {
            const example = compileExample(found, file);

            return example === null ? [] : [example];
        }),
    );

    it("finds at least the fixture example", () => {
        expect(examples.length).toBeGreaterThan(0);
    });

    describe("runs every documented example", () => {
        it.each(
            examples.map(
                (example) =>
                    [`${example.file}:${example.line}`, example] as const,
            ),
        )("%s", async (_name, example) => {
            await runExample(example, (specifier) => import(specifier));
        });
    });
});
