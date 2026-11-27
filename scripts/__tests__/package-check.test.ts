import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PackedPackage } from "../lib/pack.ts";
import { parseOptions } from "../package-check/check.ts";
import type {
    Cell,
    CellName,
    ConsumerEntry,
} from "../package-check/consumer.ts";
import {
    CELLS,
    consumerEntries,
    consumerFiles,
    emptyPackages,
    filterEntries,
    isEmptyCell,
    NO_DOM_EXCLUDED,
    staleExclusions,
} from "../package-check/consumer.ts";
import {
    isAmbientDeclaration,
    runCell,
    runSmoke,
} from "../package-check/runners.ts";

const FIXTURES = resolve(__dirname, "../package-check/fixtures");

/**
 * A packed package held in memory, for the functions that only read its manifest.
 *
 * @param name - The package name.
 * @param exportsField - The published exports field.
 * @returns The packed package, rooted at a path nothing reads.
 */
function packed(name: string, exportsField: unknown): PackedPackage {
    return {
        name,
        dir: `/repo/${name}`,
        root: `/consumer/node_modules/${name}`,
        tarball: `/tarballs/${name}.tgz`,
        manifest: { name, exports: exportsField },
        subpaths: [],
    };
}

/**
 * The CELLS entry with its files narrowed to the one generated consumer file it reads.
 *
 * @param name - The cell name.
 * @returns The cell, reading `cjs.cts` for nodenext-cjs and `esm.mts` otherwise.
 */
function cell(name: CellName): Cell {
    const found = CELLS.find((candidate) => candidate.name === name);

    if (found === undefined) {
        throw new Error(`no cell named ${name}`);
    }

    return {
        ...found,
        files: [name === "nodenext-cjs" ? "cjs.cts" : "esm.mts"],
    };
}

describe("CELLS", () => {
    it("checks every cell strictly against the library declarations", () => {
        for (const { compilerOptions } of CELLS) {
            expect(compilerOptions).toMatchObject({
                strict: true,
                noEmit: true,
                skipLibCheck: false,
                types: [],
                target: "esnext",
            });
        }
    });

    it("gives each cell its resolution settings and files", () => {
        const summary = CELLS.map(({ name, compilerOptions, files }) => [
            name,
            compilerOptions["module"],
            compilerOptions["moduleResolution"],
            files,
        ]);

        expect(summary).toEqual([
            [
                "node16-esm",
                "node16",
                "node16",
                ["esm.mts", "repro.mts", "augment.mts"],
            ],
            [
                "nodenext-esm",
                "nodenext",
                "nodenext",
                ["esm.mts", "repro.mts", "augment.mts"],
            ],
            ["nodenext-cjs", "nodenext", "nodenext", ["cjs.cts"]],
            [
                "bundler",
                "esnext",
                "bundler",
                ["esm.mts", "repro.mts", "augment.mts"],
            ],
            ["nodenext-no-dom", "nodenext", "nodenext", ["core.mts"]],
        ]);
    });

    it("drops the DOM and tightens optional and indexed access in the no-DOM cell", () => {
        expect(cell("nodenext-no-dom").compilerOptions).toMatchObject({
            lib: ["esnext"],
            exactOptionalPropertyTypes: true,
            noUncheckedIndexedAccess: true,
        });
    });
});

describe("NO_DOM_EXCLUDED", () => {
    it("lists the framework and Vite entries", () => {
        expect(NO_DOM_EXCLUDED).toEqual([
            "@tolki/lang/vue",
            "@tolki/lang/react",
            "@tolki/lang/svelte",
            "@tolki/lang/vite-laravel",
            "@tolki/enum/vite",
            "@tolki/ts/vite",
        ]);
    });
});

describe("consumerEntries", () => {
    it("reads value, types-only and ambient entries and adds one probe per wildcard export", () => {
        const a = packed("@fx/a", {
            ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
            "./*": { types: "./dist/*", default: "./dist/*" },
            "./client": { types: "./client.d.ts" },
            "./package.json": "./package.json",
        });

        expect(
            consumerEntries([a], (file) => file.endsWith("client.d.ts")),
        ).toEqual([
            { pkg: "@fx/a", specifier: "@fx/a", kind: "value" },
            { pkg: "@fx/a", specifier: "@fx/a/index.js", kind: "value" },
            { pkg: "@fx/a", specifier: "@fx/a/client", kind: "ambient" },
        ]);
    });

    it("marks a types-only module entry as types and asks about its file under the package root", () => {
        const asked: string[] = [];
        const types = packed("@fx/types", {
            ".": { types: "./src/index.d.ts" },
            "./arrays": { types: "./src/arrays.d.ts" },
        });

        expect(
            consumerEntries([types], (file) => {
                asked.push(file);

                return false;
            }),
        ).toEqual([
            { pkg: "@fx/types", specifier: "@fx/types", kind: "types" },
            { pkg: "@fx/types", specifier: "@fx/types/arrays", kind: "types" },
        ]);
        expect(asked).toEqual([
            join(types.root, "./src/index.d.ts"),
            join(types.root, "./src/arrays.d.ts"),
        ]);
    });

    it("throws for a wildcard export without a root import target to probe it with", () => {
        const wild = packed("@fx/wild", {
            ".": { types: "./index.d.ts" },
            "./*": "./dist/*",
        });

        expect(() => consumerEntries([wild], () => false)).toThrow(
            '@fx/wild exports "./*" but "." has no import target to probe it with',
        );
    });
});

describe("filterEntries", () => {
    const entries: ConsumerEntry[] = [
        { pkg: "@tolki/str", specifier: "@tolki/str", kind: "value" },
        { pkg: "@tolki/str", specifier: "@tolki/str/ascii", kind: "value" },
        { pkg: "@tolki/arr", specifier: "@tolki/arr", kind: "value" },
    ];

    it("keeps every entry without a filter", () => {
        expect(filterEntries(entries, undefined)).toEqual(entries);
    });

    it("keeps the entries whose specifier contains the filter", () => {
        expect(
            filterEntries(entries, "str").map(({ specifier }) => specifier),
        ).toEqual(["@tolki/str", "@tolki/str/ascii"]);
    });
});

describe("consumerFiles", () => {
    const entries: ConsumerEntry[] = [
        { pkg: "@fx/a", specifier: "@fx/a", kind: "value" },
        { pkg: "@fx/a", specifier: "@fx/a/client", kind: "ambient" },
        { pkg: "@fx/types", specifier: "@fx/types", kind: "types" },
    ];

    it("writes references first, then one import and export per entry", () => {
        expect(consumerFiles(entries)["esm.mts"]).toBe(
            '/// <reference types="@fx/a/client" />\nimport * as e0 from "@fx/a";\nexport { e0 };\nimport type * as e1 from "@fx/types";\nexport type { e1 };\n',
        );
    });

    it("writes the same text into cjs.cts", () => {
        const files = consumerFiles(entries);

        expect(files["cjs.cts"]).toBe(files["esm.mts"]);
    });

    it("leaves the framework entries out of core.mts", () => {
        const vueEntry: ConsumerEntry = {
            pkg: "@tolki/lang",
            specifier: "@tolki/lang/vue",
            kind: "value",
        };
        const files = consumerFiles([vueEntry, ...entries]);

        expect(files["esm.mts"]).toContain('from "@tolki/lang/vue"');
        expect(files["core.mts"]).not.toContain("@tolki/lang/vue");
        expect(files["core.mts"]).toContain('import * as e0 from "@fx/a";');
    });
});

describe("staleExclusions", () => {
    it("names an excluded specifier no entry has", () => {
        const present = NO_DOM_EXCLUDED.slice(1).map(
            (specifier): ConsumerEntry => ({
                pkg: "@tolki/x",
                specifier,
                kind: "value",
            }),
        );

        expect(staleExclusions(present)).toEqual(["@tolki/lang/vue"]);
    });
});

describe("emptyPackages", () => {
    it("names a packed package that contributes no entry", () => {
        const packages = [packed("@fx/a", "./a.js"), packed("@fx/b", "./b.js")];
        const entries: ConsumerEntry[] = [
            { pkg: "@fx/a", specifier: "@fx/a", kind: "value" },
        ];

        expect(emptyPackages(packages, entries)).toEqual(["@fx/b"]);
    });
});

describe("isEmptyCell", () => {
    const vueEntry: ConsumerEntry = {
        pkg: "@tolki/lang",
        specifier: "@tolki/lang/vue",
        kind: "value",
    };

    it("is true when the cell reads only a generated consumer file that holds no entry", () => {
        const noDom: Cell = { ...cell("nodenext-no-dom"), files: ["core.mts"] };

        expect(isEmptyCell(noDom, consumerFiles([vueEntry]))).toBe(true);
    });

    it("is false when the generated file holds an import or only a reference", () => {
        const client: ConsumerEntry = {
            pkg: "@tolki/lang",
            specifier: "@tolki/lang/client",
            kind: "ambient",
        };

        expect(isEmptyCell(cell("node16-esm"), consumerFiles([vueEntry]))).toBe(
            false,
        );
        expect(isEmptyCell(cell("node16-esm"), consumerFiles([client]))).toBe(
            false,
        );
    });

    it("is false when the cell also reads a fixed input", () => {
        const full = CELLS.find(({ name }) => name === "node16-esm");

        expect(full).toBeDefined();
        expect(isEmptyCell(full as Cell, consumerFiles([]))).toBe(false);
    });
});

describe("isAmbientDeclaration", () => {
    let dir: string;

    beforeAll(() => {
        dir = mkdtempSync(join(tmpdir(), "package-check-ambient-"));
        writeFileSync(
            join(dir, "client.d.ts"),
            'declare module "virtual:x" {\n    export const lines: string;\n}\n',
        );
        writeFileSync(
            join(dir, "module.d.ts"),
            "export declare const value: number;\n",
        );
    });

    afterAll(() => {
        rmSync(dir, { recursive: true, force: true });
    });

    it("is true for a file of declare module blocks and false for a module", () => {
        expect(isAmbientDeclaration(join(dir, "client.d.ts"))).toBe(true);
        expect(isAmbientDeclaration(join(dir, "module.d.ts"))).toBe(false);
    });

    it("is false for a missing file, so its import reports the file as missing", () => {
        expect(isAmbientDeclaration(join(dir, "absent.d.ts"))).toBe(false);
    });
});

describe("parseOptions", () => {
    it("reads the filter, and leaves it undefined without one", () => {
        expect(parseOptions(["--filter", "@tolki/str"])).toEqual({
            filter: "@tolki/str",
        });
        expect(parseOptions([])).toEqual({ filter: undefined });
    });

    it("rejects an empty filter, which would keep every entry yet skip the full-run checks", () => {
        expect(() => parseOptions(["--filter", ""])).toThrow(
            "--filter needs text",
        );
        expect(() => parseOptions(["--filter="])).toThrow(
            "--filter needs text",
        );
    });

    it("rejects an unknown flag and a positional", () => {
        expect(() => parseOptions(["--bogus"])).toThrow(
            "Unknown option '--bogus'",
        );
        expect(() => parseOptions(["@tolki/str"])).toThrow(
            "Unexpected argument '@tolki/str'",
        );
    });
});

describe("runCell", () => {
    let dir: string;

    beforeAll(() => {
        const source =
            'import * as e0 from "@fixture/extensionless";\nexport { e0 };\n';

        dir = mkdtempSync(join(tmpdir(), "package-check-cell-"));
        cpSync(
            join(FIXTURES, "extensionless"),
            join(dir, "node_modules/@fixture/extensionless"),
            { recursive: true },
        );
        writeFileSync(join(dir, "esm.mts"), source);
        writeFileSync(join(dir, "cjs.cts"), source);
    });

    afterAll(() => {
        rmSync(dir, { recursive: true, force: true });
    });

    it("fails the node16 and nodenext cells on an extensionless declaration and passes bundler", () => {
        for (const name of [
            "node16-esm",
            "nodenext-esm",
            "nodenext-cjs",
        ] as const) {
            expect(runCell(cell(name), dir).join("\n")).toMatch(
                /TS2834|TS2835/,
            );
        }

        expect(runCell(cell("bundler"), dir)).toEqual([]);
    }, 60_000);

    it("returns the whole output when tsc fails without a located diagnostic", () => {
        const missing: Cell = { ...cell("bundler"), files: ["absent.mts"] };

        expect(runCell(missing, dir).join("\n")).toContain("absent.mts");
    }, 60_000);
});

describe("runSmoke", () => {
    let dir: string;

    beforeAll(() => {
        dir = mkdtempSync(join(tmpdir(), "package-check-smoke-"));
        mkdirSync(join(dir, "node_modules/@fixture"), { recursive: true });
        cpSync(
            join(FIXTURES, "extensionless"),
            join(dir, "node_modules/@fixture/extensionless"),
            { recursive: true },
        );
    });

    afterAll(() => {
        rmSync(dir, { recursive: true, force: true });
    });

    it("loads a valid package both ways and reports a missing one for each mode", () => {
        const failures = runSmoke(dir, [
            "@fixture/extensionless",
            "@fixture/missing",
        ]);

        expect(
            failures.map(({ specifier, mode }) => `${specifier}:${mode}`),
        ).toEqual(["@fixture/missing:import", "@fixture/missing:require"]);
        expect(failures[0]?.error).toMatch(/^ERR_MODULE_NOT_FOUND: /);
        expect(failures[1]?.error).toMatch(/^MODULE_NOT_FOUND: /);
    });
});
