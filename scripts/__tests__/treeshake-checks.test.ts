import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type {
    ExportEntry,
    SideEffectCategory,
    SourceScan,
} from "../side-effects/scan.ts";
import { BUNDLERS } from "../treeshake/bundlers.ts";
import type { DebtEntry, Finding } from "../treeshake/checks.ts";
import {
    applyDebt,
    EXPECTATION_CHANGED,
    runFixture,
} from "../treeshake/checks.ts";
import type { Fixture, SubpathExports } from "../treeshake/fixtures.ts";
import { buildFixtures, readSubpathExports } from "../treeshake/fixtures.ts";

const SUBPATHS: SubpathExports[] = [
    {
        pkg: "@tolki/a",
        subpath: ".",
        specifier: "@tolki/a",
        names: ["Thing", "get", "pop", "set"],
    },
    {
        pkg: "@tolki/a",
        subpath: "./a",
        specifier: "@tolki/a/a",
        names: ["get", "pop", "set"],
    },
    {
        pkg: "@tolki/b",
        subpath: "./extra",
        specifier: "@tolki/b/extra",
        names: ["only"],
    },
    { pkg: "@tolki/b", subpath: ".", specifier: "@tolki/b", names: ["get"] },
];

/** One scanned export of `src/x.ts`. */
function entry(
    pkg: string,
    name: string,
    kind: ExportEntry["kind"],
    category: SideEffectCategory | null = null,
): ExportEntry {
    return { pkg, file: "src/x.ts", name, line: 1, kind, category };
}

const SCAN: SourceScan = {
    exports: [
        entry("@tolki/a", "Thing", "class"),
        entry("@tolki/a", "get", "pure"),
        entry("@tolki/a", "pop", "impure", "mutates"),
        entry("@tolki/a", "set", "pure"),
        entry("@tolki/b", "get", "impure", "state"),
        entry("@tolki/b", "only", "pure"),
        entry("@tolki/b", "hidden", "pure"),
    ],
    placement: [],
    moduleScope: [],
};

const ENTRY_USED = 'import { used } from "./mod.js";\nconsole.log(used);\n';

/** The fixtures of one check, keyed by id. */
function byCheck(check: Fixture["check"]): Map<string, Fixture> {
    return new Map(
        buildFixtures(SUBPATHS, SCAN)
            .filter((fixture) => fixture.check === check)
            .map((fixture) => [fixture.id, fixture]),
    );
}

describe("buildFixtures", () => {
    it("builds one bare and one surface fixture per subpath", () => {
        const bare = byCheck("bare");
        const surface = byCheck("surface");
        const ids = ["@tolki/a", "@tolki/a/a", "@tolki/b/extra", "@tolki/b"];

        expect([...bare.keys()]).toEqual(ids.map((spec) => `bare:${spec}`));
        expect([...surface.keys()]).toEqual(
            ids.map((spec) => `surface:${spec}`),
        );
        expect(bare.get("bare:@tolki/a")).toEqual({
            id: "bare:@tolki/a",
            check: "bare",
            files: { "entry.js": 'import "@tolki/a";\n' },
            control: null,
            bundlers: ["rollup", "rolldown"],
            expect: {},
            strict: true,
        });
        expect(surface.get("surface:@tolki/a")).toEqual({
            id: "surface:@tolki/a",
            check: "surface",
            files: {
                "entry.js":
                    'import { Thing, get, pop, set } from "@tolki/a";\nconsole.log(Thing, get, pop, set);\n',
            },
            control: null,
            bundlers: BUNDLERS,
            expect: {},
            strict: false,
        });
    });

    it("builds one parity fixture per exported name, preferring the root subpath", () => {
        const parity = byCheck("parity");

        expect([...parity.keys()]).toEqual([
            "parity:@tolki/a:Thing",
            "parity:@tolki/a:get",
            "parity:@tolki/a:pop",
            "parity:@tolki/a:set",
            "parity:@tolki/b/extra:only",
            "parity:@tolki/b:get",
        ]);
        expect(parity.get("parity:@tolki/b/extra:only")).toEqual({
            id: "parity:@tolki/b/extra:only",
            check: "parity",
            files: {
                "entry.js":
                    'import { only } from "@tolki/b/extra";\nconsole.log(only);\n',
            },
            control: null,
            bundlers: ["rolldown", "esbuild"],
            expect: {},
            strict: false,
        });
    });

    it("compares each namespace import with the named import", () => {
        expect(byCheck("namespace").get("namespace:@tolki/a/a")).toEqual({
            id: "namespace:@tolki/a/a",
            check: "namespace",
            files: {
                "entry.js":
                    'import * as ns from "@tolki/a/a";\nconsole.log(ns.get);\n',
            },
            control: {
                "entry.js":
                    'import { get } from "@tolki/a/a";\nconsole.log(get);\n',
            },
            bundlers: ["rollup", "rolldown", "esbuild"],
            expect: {},
            strict: false,
        });
    });

    it("aliases a default export in generated imports", () => {
        const fixtures = buildFixtures(
            [
                {
                    pkg: "@tolki/v",
                    subpath: "./vite",
                    specifier: "@tolki/v/vite",
                    names: ["default", "plugin"],
                },
            ],
            { exports: [], placement: [], moduleScope: [] },
        );
        const files = (id: string) =>
            fixtures.find((fixture) => fixture.id === id)?.files["entry.js"];

        expect(files("surface:@tolki/v/vite")).toBe(
            'import { default as _default, plugin } from "@tolki/v/vite";\nconsole.log(_default, plugin);\n',
        );
        expect(files("parity:@tolki/v/vite:default")).toBe(
            'import { default as _default } from "@tolki/v/vite";\nconsole.log(_default);\n',
        );
    });

    it("puts each pure name in exactly one drop fixture, preferring the root subpath", () => {
        const drop = byCheck("drop");
        const combined = drop.get("drop:@tolki/a");

        expect([...drop.keys()]).toEqual([
            "drop:@tolki/a",
            "drop:@tolki/a:call-site-pure",
            "drop:@tolki/b/extra",
            "drop:@tolki/b/extra:call-site-pure",
        ]);
        expect(combined).toMatchObject({
            check: "drop",
            files: {
                "mod.js":
                    'import { get, set } from "@tolki/a";\nexport const __u0 = get();\nexport const __u1 = set();\nexport const used = 1;\n',
                "entry.js": ENTRY_USED,
            },
            control: {
                "mod.js":
                    'import { get, set } from "@tolki/a";\nexport const used = 1;\n',
                "entry.js": ENTRY_USED,
            },
            bundlers: BUNDLERS,
            expect: {
                rollup: "dropped",
                rolldown: "dropped",
                esbuild: "kept",
                webpack: "dropped",
                rspack: "dropped",
            },
            strict: false,
        });
        expect(combined?.split?.map((fixture) => fixture.id)).toEqual([
            "drop:@tolki/a:get",
            "drop:@tolki/a:set",
        ]);
        expect(combined?.split?.[1]?.files["mod.js"]).toBe(
            'import { set } from "@tolki/a";\nexport const __u0 = set();\nexport const used = 1;\n',
        );
    });

    it("adds a call-site PURE esbuild drop fixture", () => {
        const pure = byCheck("drop").get("drop:@tolki/a:call-site-pure");

        expect(pure).toMatchObject({
            files: {
                "mod.js":
                    'import { get, set } from "@tolki/a";\nexport const __u0 = /* @__PURE__ */ get();\nexport const __u1 = /* @__PURE__ */ set();\nexport const used = 1;\n',
                "entry.js": ENTRY_USED,
            },
            control: {
                "mod.js":
                    'import { get, set } from "@tolki/a";\nexport const used = 1;\n',
                "entry.js": ENTRY_USED,
            },
            bundlers: ["esbuild"],
            expect: { esbuild: "dropped" },
        });
        expect(pure?.split?.map((fixture) => fixture.id)).toEqual([
            "drop:@tolki/a:call-site-pure:get",
            "drop:@tolki/a:call-site-pure:set",
        ]);
    });

    it("builds keep fixtures only for mutates exports", () => {
        const keep = byCheck("keep");
        const entryTarget =
            'import { target } from "./mod.js";\nconsole.log(target);\n';

        expect([...keep.keys()]).toEqual(["keep:@tolki/a:pop"]);
        expect(keep.get("keep:@tolki/a:pop")).toEqual({
            id: "keep:@tolki/a:pop",
            check: "keep",
            files: {
                "mod.js":
                    'import { pop } from "@tolki/a";\nexport const target = [];\npop(target);\n',
                "entry.js": entryTarget,
            },
            control: {
                "mod.js":
                    'import { pop } from "@tolki/a";\nexport const target = [];\n',
                "entry.js": entryTarget,
            },
            bundlers: BUNDLERS,
            expect: {
                rollup: "kept",
                rolldown: "kept",
                esbuild: "kept",
                webpack: "kept",
                rspack: "kept",
            },
            strict: false,
        });
    });

    it("builds every table 4 shape with and without call-site PURE", () => {
        const shape = byCheck("shape");
        const dropped = {
            rollup: "dropped",
            rolldown: "dropped",
            webpack: "dropped",
            rspack: "dropped",
        };
        const allDropped = { ...dropped, esbuild: "dropped" };
        const curried = {
            rollup: "dropped",
            rolldown: "kept",
            esbuild: "kept",
            webpack: "kept",
            rspack: "kept",
        };

        expect(
            Object.fromEntries(
                [...shape.values()].map((fixture) => [
                    fixture.id,
                    fixture.expect,
                ]),
            ),
        ).toEqual({
            "shape:@tolki/ts:enum-file": { ...dropped, esbuild: "kept" },
            "shape:@tolki/ts:enum-file:call-site-pure": allDropped,
            "shape:@tolki/ts:define-route": { ...dropped, esbuild: "kept" },
            "shape:@tolki/ts:define-route:call-site-pure": allDropped,
            "shape:@tolki/ts:annotate-page-props": curried,
            "shape:@tolki/ts:annotate-page-props:call-site-pure": allDropped,
            "shape:@tolki/ts:annotate-request-payload": curried,
            "shape:@tolki/ts:annotate-request-payload:call-site-pure":
                allDropped,
        });

        for (const fixture of shape.values()) {
            const mod = fixture.files["mod.js"] ?? "";
            const control = fixture.control?.["mod.js"] ?? "";
            const importLine = mod.split("\n")[0] ?? "";
            const calls = mod.match(/\w+\(/g)?.length ?? 0;
            const pure = mod.match(/\/\* @__PURE__ \*\//g)?.length ?? 0;

            expect(fixture.bundlers).toEqual(BUNDLERS);
            expect(fixture.files["entry.js"]).toBe(ENTRY_USED);
            expect(importLine).toMatch(/^import \{ .+ \} from "@tolki\/ts";$/);
            expect(control).toBe(`${importLine}\nexport const used = 1;\n`);
            expect(mod.endsWith("export const used = 1;\n")).toBe(true);
            expect(pure).toBe(
                fixture.id.endsWith(":call-site-pure") ? calls : 0,
            );
        }

        expect(
            shape.get("shape:@tolki/ts:annotate-page-props:call-site-pure")
                ?.files["mod.js"],
        ).toBe(
            [
                'import { annotatePageProps, annotateRequestPayload, defineRoute } from "@tolki/ts";',
                'export const show = /* @__PURE__ */ annotatePageProps()(/* @__PURE__ */ defineRoute({ url: "/users/{user}", methods: ["get"], args: [{ name: "user", required: true }] }));',
                "export const used = 1;",
                "",
            ].join("\n"),
        );
        expect(shape.get("shape:@tolki/ts:enum-file")?.files["mod.js"]).toBe(
            [
                'import { defineEnum, values } from "@tolki/ts";',
                'export const Status = defineEnum({ Active: "active", Inactive: "inactive", backed: true, _cases: ["Active", "Inactive"] });',
                "export const STATUSES = values(Status);",
                "export const used = 1;",
                "",
            ].join("\n"),
        );
    });
});

describe("applyDebt", () => {
    it("splits debt into failures, debt hits and stale entries", () => {
        const finding = (id: string, bundler: Finding["bundler"]): Finding => ({
            id,
            bundler,
            check: "shape",
            message: "kept; expected dropped",
        });
        const debt = (
            id: string,
            bundler: DebtEntry["bundler"],
        ): DebtEntry => ({
            id,
            bundler,
            issue: "#141",
            reason: "needs Task 5 annotations",
        });
        const findings = [
            finding("shape:a", "rollup"),
            finding("shape:a", "webpack"),
            finding("shape:b", "esbuild"),
        ];
        const entries = [
            debt("shape:a", "webpack"),
            debt("shape:c", "rollup"),
            debt("shape:a", "webpack"),
            debt("shape:b", "rollup"),
        ];

        expect(applyDebt(findings, entries)).toEqual({
            failures: [findings[0], findings[2]],
            debtHit: [findings[1]],
            stale: [entries[1], entries[2], entries[3]],
        });
    });
});

/** Writes a file, creating its directories. */
function put(root: string, file: string, content: string): void {
    const path = join(root, file);

    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
}

describe("runFixture", () => {
    let app: string;

    beforeAll(() => {
        app = mkdtempSync(join(tmpdir(), "treeshake-checks-"));
        put(app, "package.json", JSON.stringify({ type: "module" }));
        put(
            app,
            "node_modules/@tolki/fx/package.json",
            JSON.stringify({
                name: "@tolki/fx",
                type: "module",
                sideEffects: false,
                exports: { ".": "./index.js", "./setup": "./setup.js" },
            }),
        );
        put(
            app,
            "node_modules/@tolki/fx/index.js",
            [
                "/* @__NO_SIDE_EFFECTS__ */",
                "export function pure(value) { return { value }; }",
                "export function plain(value) { globalThis.seen = value; return value; }",
                "",
            ].join("\n"),
        );
        put(
            app,
            "node_modules/@tolki/fx/setup.js",
            'import { plain } from "./index.js";\nplain(1);\nexport const ready = true;\n',
        );
    });

    afterAll(() => {
        rmSync(app, { recursive: true, force: true });
    });

    const fx = (names: string[]): SubpathExports[] => [
        { pkg: "@tolki/fx", subpath: ".", specifier: "@tolki/fx", names },
    ];

    it("re-runs a failed drop per name and names each kept function", async () => {
        const scan: SourceScan = {
            exports: [
                entry("@tolki/fx", "plain", "pure"),
                entry("@tolki/fx", "pure", "pure"),
            ],
            placement: [],
            moduleScope: [],
        };
        const drop = buildFixtures(fx(["plain", "pure"]), scan).find(
            (fixture) => fixture.id === "drop:@tolki/fx",
        ) as Fixture;

        const findings = await runFixture(
            { ...drop, bundlers: ["rollup", "esbuild"] },
            app,
        );

        expect(findings).toEqual([
            {
                id: "drop:@tolki/fx:plain",
                bundler: "rollup",
                check: "drop",
                message: "kept; expected dropped",
            },
        ]);
    });

    it("reports an expectation change when a kept call drops", async () => {
        const scan: SourceScan = {
            exports: [entry("@tolki/fx", "pure", "pure")],
            placement: [],
            moduleScope: [],
        };
        const drop = buildFixtures(fx(["pure"]), scan).find(
            (fixture) => fixture.id === "drop:@tolki/fx",
        ) as Fixture;

        const findings = await runFixture(
            { ...drop, bundlers: ["rollup"], expect: { rollup: "kept" } },
            app,
        );

        expect(findings).toEqual([
            {
                id: "drop:@tolki/fx",
                bundler: "rollup",
                check: "drop",
                message: EXPECTATION_CHANGED,
            },
        ]);
    });

    it("fails a bare import that keeps own module code", async () => {
        const bare = buildFixtures(
            [
                {
                    pkg: "@tolki/fx",
                    subpath: "./setup",
                    specifier: "@tolki/fx/setup",
                    names: ["ready"],
                },
            ],
            { exports: [], placement: [], moduleScope: [] },
        ).find((fixture) => fixture.id === "bare:@tolki/fx/setup") as Fixture;

        const findings = await runFixture(bare, app);

        expect(findings.map(({ bundler }) => bundler)).toEqual([
            "rollup",
            "rolldown",
        ]);
        expect(findings[0]?.message).toMatch(/^keeps @tolki\/fx\//);
    });

    it("reports a missing export on the surface", async () => {
        const surface = buildFixtures(fx(["pure", "nope"]), {
            exports: [],
            placement: [],
            moduleScope: [],
        }).find((fixture) => fixture.id === "surface:@tolki/fx") as Fixture;

        const findings = await runFixture(
            { ...surface, bundlers: ["rolldown", "webpack"] },
            app,
        );

        expect(findings).toEqual([
            {
                id: "surface:@tolki/fx",
                bundler: "rolldown",
                check: "surface",
                message: "missing exports: nope",
            },
            {
                id: "surface:@tolki/fx",
                bundler: "webpack",
                check: "surface",
                message: "missing exports: nope",
            },
        ]);
    });

    it("reads each staged subpath's export names", async () => {
        const subpaths = await readSubpathExports([
            {
                name: "@tolki/fx",
                root: join(app, "node_modules/@tolki/fx"),
                subpaths: [".", "./setup"],
            },
        ]);

        expect(subpaths).toEqual([
            {
                pkg: "@tolki/fx",
                subpath: ".",
                specifier: "@tolki/fx",
                names: ["plain", "pure"],
            },
            {
                pkg: "@tolki/fx",
                subpath: "./setup",
                specifier: "@tolki/fx/setup",
                names: ["ready"],
            },
        ]);
    });
});
