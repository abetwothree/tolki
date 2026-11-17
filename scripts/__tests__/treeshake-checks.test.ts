import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type {
    ExportEntry,
    SideEffectCategory,
    SourceScan,
} from "../side-effects/scan.ts";
import { scanPublishedSources } from "../side-effects/scan.ts";
import { BUNDLERS } from "../treeshake/bundlers.ts";
import type { DebtEntry, Finding } from "../treeshake/checks.ts";
import {
    applyDebt,
    EXPECTATION_CHANGED,
    expectationChangedMessage,
    KEEP_DROPPED,
    KEPT_DROP_CHANGED,
    runFixture,
    selectFixtures,
    withoutPeerImports,
} from "../treeshake/checks.ts";
import { KEPT_DROPS } from "../treeshake/expectations.ts";
import type { Fixture, SubpathExports } from "../treeshake/fixtures.ts";
import {
    buildFixtures,
    declarationConflicts,
    readSubpathExports,
} from "../treeshake/fixtures.ts";

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

/** One scanned export, of `src/x.ts` unless a file is given. */
function entry(
    pkg: string,
    name: string,
    kind: ExportEntry["kind"],
    category: SideEffectCategory | null = null,
    file = "src/x.ts",
): ExportEntry {
    return { pkg, file, name, line: 1, kind, category };
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
            control: { "entry.js": "" },
            bundlers: ["rollup", "rolldown"],
            expect: { rolldown: "dropped" },
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

    it("tests each KEPT_DROPS name alone, expecting kept where the table says and dropped with a call-site PURE", () => {
        const subpaths: SubpathExports[] = [
            {
                pkg: "@tolki/str",
                subpath: ".",
                specifier: "@tolki/str",
                names: ["after", "uuid"],
            },
        ];
        const scan: SourceScan = {
            exports: [
                entry("@tolki/str", "after", "pure"),
                entry("@tolki/str", "uuid", "pure"),
            ],
            placement: [],
            moduleScope: [],
        };
        const drop = new Map(
            buildFixtures(subpaths, scan)
                .filter((fixture) => fixture.check === "drop")
                .map((fixture) => [fixture.id, fixture]),
        );

        expect([...drop.keys()]).toEqual([
            "drop:@tolki/str",
            "drop:@tolki/str:uuid",
            "drop:@tolki/str:call-site-pure",
            "drop:@tolki/str:call-site-pure:uuid",
        ]);
        expect(drop.get("drop:@tolki/str")?.files["mod.js"]).toContain(
            "after()",
        );
        expect(drop.get("drop:@tolki/str")?.files["mod.js"]).not.toContain(
            "uuid",
        );
        expect(drop.get("drop:@tolki/str:uuid")?.expect).toEqual({
            rollup: "dropped",
            rolldown: "kept",
            esbuild: "kept",
            webpack: "dropped",
            rspack: "kept",
        });
        expect(drop.get("drop:@tolki/str:call-site-pure:uuid")).toMatchObject({
            bundlers: ["esbuild", "rolldown", "rspack"],
            expect: {
                esbuild: "dropped",
                rolldown: "dropped",
                rspack: "dropped",
            },
        });
        expect(
            drop.get("drop:@tolki/str:call-site-pure:uuid")?.files["mod.js"],
        ).toContain("/* @__PURE__ */ uuid()");
    });

    it("names expectations.ts for a kept drop and the shape docs for anything else", () => {
        const fixture = (id: string) => ({ id }) as Fixture;

        expect(expectationChangedMessage(fixture("drop:@tolki/str:uuid"))).toBe(
            KEPT_DROP_CHANGED,
        );
        expect(
            expectationChangedMessage(
                fixture("drop:@tolki/str:call-site-pure:uuid"),
            ),
        ).toBe(KEPT_DROP_CHANGED);
        expect(KEPT_DROP_CHANGED).toContain(
            "scripts/treeshake/expectations.ts",
        );
        expect(KEPT_DROP_CHANGED).toContain("Dependency residue");
        expect(KEPT_DROP_CHANGED).toContain("strings/index.md");
        expect(KEPT_DROP_CHANGED).toContain("collections/index.md");
        expect(EXPECTATION_CHANGED).toContain("ts/enums.md");
        expect(EXPECTATION_CHANGED).toContain("ts/routing.md");
        expect(
            expectationChangedMessage(fixture("shape:@tolki/ts:enum-only")),
        ).toBe(EXPECTATION_CHANGED);
        expect(
            expectationChangedMessage(fixture("drop:@tolki/str:after")),
        ).toBe(EXPECTATION_CHANGED);
    });

    it("calls a dropped keep fixture a correctness failure naming the mark", () => {
        const keep = { id: "keep:@tolki/a:pop", check: "keep" } as Fixture;

        expect(expectationChangedMessage(keep)).toBe(KEEP_DROPPED);
        expect(KEEP_DROPPED).toContain("@__NO_SIDE_EFFECTS__");
        expect(KEEP_DROPPED).toContain(
            "docs/features/side-effect-annotations.md",
        );
        expect(KEEP_DROPPED).toContain("correctness failure");
    });

    it("lists only exports the source scan classifies as pure", () => {
        const published = scanPublishedSources(resolve(__dirname, "../.."));

        for (const key of Object.keys(KEPT_DROPS)) {
            const [specifier = "", name = ""] = key.split(":");
            const pkg = specifier.split("/").slice(0, 2).join("/");

            expect(
                published.exports.some(
                    (found) =>
                        found.pkg === pkg &&
                        found.name === name &&
                        found.kind === "pure",
                ),
                key,
            ).toBe(true);
        }
    });

    it("gives every KEPT_DROPS entry a reason and a bundler", () => {
        for (const [key, entry] of Object.entries(KEPT_DROPS)) {
            expect(key).toMatch(/^@tolki\/[\w/]+:\w+$/);
            expect(entry.reason.length).toBeGreaterThan(0);
            expect(entry.bundlers.length).toBeGreaterThan(0);
        }

        expect(Object.keys(KEPT_DROPS)).toHaveLength(24);
    });

    it("builds keep fixtures only for mutates exports", () => {
        const keep = byCheck("keep");
        const entryTarget =
            'import { target } from "./mod.js";\nconsole.log(target);\n';

        expect([...keep.keys()]).toEqual([
            "keep:@tolki/a:pop",
            "keep:@tolki/enum:canary",
        ]);
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
            rspack: "dropped",
        };

        expect(
            Object.fromEntries(
                [...shape.values()].map((fixture) => [
                    fixture.id,
                    fixture.expect,
                ]),
            ),
        ).toEqual({
            "shape:@tolki/ts:enum-file": {
                ...dropped,
                esbuild: "kept",
                rspack: "kept",
            },
            "shape:@tolki/ts:enum-file:call-site-pure": allDropped,
            "shape:@tolki/ts:enum-only": { ...dropped, esbuild: "kept" },
            "shape:@tolki/ts:enum-only:call-site-pure": allDropped,
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
        expect(shape.get("shape:@tolki/ts:enum-only")?.files["mod.js"]).toBe(
            [
                'import { defineEnum } from "@tolki/ts";',
                'export const Status = defineEnum({ Active: "active", Inactive: "inactive", backed: true, _cases: ["Active", "Inactive"] });',
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

describe("withoutPeerImports", () => {
    it("drops bare and bound peer requires and imports", () => {
        expect(
            withoutPeerImports(
                '(()=>{"use strict";let e=require("react");require("vue"),console.log(1)})();',
            ),
        ).toBe('(()=>{"use strict";console.log(1)})();');
        expect(
            withoutPeerImports(
                'import"svelte";import{ref as r}from"vue";import "svelte/reactivity";console.log(1);',
            ),
        ).toBe("console.log(1);");
    });

    it("keeps other imports", () => {
        const code = 'import"@tolki/utils";require("lodash");console.log(1);';

        expect(withoutPeerImports(code)).toBe(code);
    });
});

describe("framework peers", () => {
    const peered: SubpathExports[] = [
        {
            pkg: "@tolki/a",
            subpath: "./vue",
            specifier: "@tolki/a/vue",
            names: ["get", "pop"],
            peers: ["svelte", "svelte/reactivity"],
        },
    ];
    const scan: SourceScan = {
        exports: [
            entry("@tolki/a", "get", "pure"),
            entry("@tolki/a", "pop", "impure", "mutates"),
        ],
        placement: [],
        moduleScope: [],
    };

    it("imports each peer in a drop fixture and its control", () => {
        const drop = buildFixtures(peered, scan).find(
            ({ id }) => id === "drop:@tolki/a/vue",
        ) as Fixture;
        const head = 'import "svelte";\nimport "svelte/reactivity";\n';

        expect(drop.files["mod.js"]).toBe(
            `${head}import { get } from "@tolki/a/vue";\nexport const __u0 = get();\nexport const used = 1;\n`,
        );
        expect(drop.control?.["mod.js"]).toBe(
            `${head}import { get } from "@tolki/a/vue";\nexport const used = 1;\n`,
        );
    });

    it("imports each peer in a keep fixture and its control", () => {
        const keep = buildFixtures(peered, scan).find(
            ({ id }) => id === "keep:@tolki/a/vue:pop",
        ) as Fixture;

        expect(keep.files["mod.js"]).toMatch(/^import "svelte";\n/);
        expect(keep.control?.["mod.js"]).toMatch(/^import "svelte";\n/);
    });
});

describe("shared and Node-only exports", () => {
    const shared: SubpathExports[] = [
        {
            pkg: "@tolki/l",
            subpath: ".",
            specifier: "@tolki/l",
            names: ["createLang"],
            sources: { createLang: "packages/l/src/lang.ts" },
        },
        {
            pkg: "@tolki/l",
            subpath: "./vue",
            specifier: "@tolki/l/vue",
            names: ["createLang"],
            sources: { createLang: "packages/l/src/vue.ts" },
        },
        {
            pkg: "@tolki/l",
            subpath: "./vite",
            specifier: "@tolki/l/vite",
            names: ["plugin"],
            nodeOnly: true,
        },
    ];
    const declared = (vueKind: ExportEntry["kind"]): SourceScan => ({
        exports: [
            entry(
                "@tolki/l",
                "createLang",
                "pure",
                null,
                "packages/l/src/lang.ts",
            ),
            entry(
                "@tolki/l",
                "createLang",
                vueKind,
                vueKind === "impure" ? "state" : null,
                "packages/l/src/vue.ts",
            ),
            entry("@tolki/l", "plugin", "pure", null, "packages/l/src/vite.ts"),
        ],
        placement: [],
        moduleScope: [],
    });
    const ids = (scan: SourceScan, check: Fixture["check"]): string[] =>
        buildFixtures(shared, scan)
            .filter((fixture) => fixture.check === check)
            .map(({ id }) => id);

    it("tests each declaration of a shared name through the subpath that ships it", () => {
        expect(ids(declared("pure"), "drop")).toEqual([
            "drop:@tolki/l",
            "drop:@tolki/l:call-site-pure",
            "drop:@tolki/l/vue",
            "drop:@tolki/l/vue:call-site-pure",
        ]);
        expect(declarationConflicts(shared, declared("pure"))).toEqual([]);
    });

    it("reports a shared name declared with different marks", () => {
        expect(declarationConflicts(shared, declared("impure"))).toEqual([
            {
                id: "drop:@tolki/l:createLang",
                bundler: null,
                check: "drop",
                message:
                    "declared with different marks: packages/l/src/lang.ts (pure), packages/l/src/vue.ts (state)",
            },
        ]);
    });

    it("reports a shared name declared with different categories", () => {
        const scan: SourceScan = {
            exports: [
                entry(
                    "@tolki/l",
                    "createLang",
                    "impure",
                    "state",
                    "packages/l/src/lang.ts",
                ),
                entry(
                    "@tolki/l",
                    "createLang",
                    "impure",
                    "callback",
                    "packages/l/src/vue.ts",
                ),
            ],
            placement: [],
            moduleScope: [],
        };

        expect(declarationConflicts(shared, scan)).toMatchObject([
            {
                id: "drop:@tolki/l:createLang",
                message:
                    "declared with different marks: packages/l/src/lang.ts (state), packages/l/src/vue.ts (callback)",
            },
        ]);
    });

    it("gives an unmapped name with different marks no drop fixture", () => {
        const unmapped = shared.map((sub) => ({ ...sub, sources: {} }));
        const drops = buildFixtures(unmapped, declared("impure")).filter(
            ({ check }) => check === "drop",
        );

        expect(drops.map(({ id }) => id)).toEqual([]);
    });

    it("skips parity for Node-only subpaths", () => {
        expect(ids(declared("pure"), "parity")).toEqual([
            "parity:@tolki/l:createLang",
            "parity:@tolki/l/vue:createLang",
        ]);
        expect(ids(declared("pure"), "surface")).toContain(
            "surface:@tolki/l/vite",
        );
    });

    it("adds a canary that keeps an asserting call in every bundler", () => {
        const canary = buildFixtures([], {
            exports: [],
            placement: [],
            moduleScope: [],
        }).find(({ id }) => id === "keep:@tolki/enum:canary");

        expect(canary).toEqual({
            id: "keep:@tolki/enum:canary",
            check: "keep",
            files: {
                "mod.js":
                    'import { from } from "@tolki/enum";\nfrom({ A: "a", _cases: ["A"] }, "b");\nexport const used = 1;\n',
                "entry.js": ENTRY_USED,
            },
            control: {
                "mod.js":
                    'import { from } from "@tolki/enum";\nexport const used = 1;\n',
                "entry.js": ENTRY_USED,
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
});

describe("selectFixtures", () => {
    const part = (id: string) => ({ id, check: "drop" }) as Fixture;
    const combined = {
        id: "drop:@tolki/x",
        check: "drop",
        split: [part("drop:@tolki/x:f"), part("drop:@tolki/x:g")],
    } as Fixture;
    const keep = { id: "keep:@tolki/x:f", check: "keep" } as Fixture;
    const all = [combined, keep];
    const ids = (fixtures: Fixture[]) => fixtures.map((f) => f.id);

    it("selects everything without a filter", () => {
        expect(selectFixtures(all, ["drop", "keep"], undefined)).toEqual(all);
    });

    it("keeps the combined run when its id matches", () => {
        expect(ids(selectFixtures(all, ["drop"], "drop:@tolki/x"))).toEqual([
            "drop:@tolki/x",
        ]);
    });

    it("selects the split fixtures whose ids match when the parent does not", () => {
        expect(ids(selectFixtures(all, ["drop"], "drop:@tolki/x:f"))).toEqual([
            "drop:@tolki/x:f",
        ]);
    });

    it("honours the check list and selects nothing for an unknown filter", () => {
        expect(selectFixtures(all, ["bare"], "@tolki/x")).toEqual([]);
        expect(selectFixtures(all, ["drop", "keep"], "nope")).toEqual([]);
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

    it("never excuses a build failure, a missing export or a scan finding", () => {
        const findings: Finding[] = [
            {
                id: "surface:a",
                bundler: "webpack",
                check: "surface",
                message: "build failed: Module not found",
            },
            {
                id: "surface:a",
                bundler: "rollup",
                check: "surface",
                message: "missing exports: nope",
            },
            {
                id: "drop:a:f",
                bundler: null,
                check: "drop",
                message:
                    "declared with different marks: a.ts (pure), b.ts (state)",
            },
        ];
        const entries: DebtEntry[] = [
            { id: "surface:a", bundler: "webpack", issue: "#1", reason: "r" },
            { id: "surface:a", bundler: "rollup", issue: "#1", reason: "r" },
        ];

        expect(applyDebt(findings, entries)).toEqual({
            failures: findings,
            debtHit: [],
            stale: entries,
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
                exports: {
                    ".": "./dist/index.js",
                    "./setup": "./dist/setup.js",
                    "./template": "./dist/template.js",
                    "./vue": "./dist/vue.js",
                    "./react": "./dist/react.js",
                    "./vite": "./dist/vite.js",
                },
            }),
        );
        put(
            app,
            "node_modules/@tolki/fx/dist/index.js",
            [
                "/* @__NO_SIDE_EFFECTS__ */",
                "export function pure(value) { return { value }; }",
                "export function plain(value) { globalThis.seen = value; return value; }",
                'export { make } from "./lang.js";',
                "",
            ].join("\n"),
        );
        put(
            app,
            "node_modules/@tolki/fx/dist/lang.js",
            "export function make() { return 1; }\n",
        );
        put(
            app,
            "node_modules/@tolki/fx/dist/vue.js",
            'import "vue";\nexport function make() { return 2; }\n',
        );
        put(
            app,
            "node_modules/@tolki/fx/dist/react.js",
            'export { hook } from "./hook.js";\n',
        );
        put(
            app,
            "node_modules/@tolki/fx/dist/hook.js",
            'import "react/jsx-runtime";\nexport function hook() { return 3; }\n',
        );
        put(
            app,
            "node_modules/react/jsx-runtime.js",
            "export const jsx = 1;\n",
        );
        put(
            app,
            "node_modules/react/package.json",
            '{"name":"react","type":"module","exports":{"./jsx-runtime":"./jsx-runtime.js"}}',
        );
        put(app, "node_modules/vue/index.js", "export const ref = 1;\n");
        put(
            app,
            "node_modules/vue/package.json",
            '{"name":"vue","type":"module","main":"index.js"}',
        );
        put(
            app,
            "node_modules/@tolki/fx/dist/vite.js",
            'export { run } from "./runner.js";\n',
        );
        put(
            app,
            "node_modules/@tolki/fx/dist/runner.js",
            'import { exec } from "node:child_process";\nexport function run() { return exec; }\n',
        );
        put(
            app,
            "node_modules/@tolki/fx/dist/setup.js",
            'import { plain } from "./index.js";\nplain(1);\nexport const ready = true;\n',
        );
        put(
            app,
            "node_modules/@tolki/fx/dist/template.js",
            'var e = "virtual:fx", t = `\\0${e}`;\nexport { t as RESOLVED, e as ID };\n',
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
        expect(findings[1]?.message).toMatch(/^kept; expected dropped/);
    });

    it("judges a Rolldown bare import by its minified output", async () => {
        const bare = buildFixtures(
            [
                {
                    pkg: "@tolki/fx",
                    subpath: "./template",
                    specifier: "@tolki/fx/template",
                    names: ["RESOLVED"],
                },
            ],
            { exports: [], placement: [], moduleScope: [] },
        ).find(({ id }) => id === "bare:@tolki/fx/template") as Fixture;

        expect(
            await runFixture({ ...bare, bundlers: ["rolldown"] }, app),
        ).toEqual([]);
    });

    it("throws when a fixture lacks its control or an expectation", async () => {
        const keep = buildFixtures([], {
            exports: [],
            placement: [],
            moduleScope: [],
        }).find(({ id }) => id === "keep:@tolki/enum:canary") as Fixture;

        await expect(
            runFixture({ ...keep, control: null }, app),
        ).rejects.toThrow("keep:@tolki/enum:canary needs a control build");
        await expect(
            runFixture({ ...keep, expect: { rollup: "kept" } }, app),
        ).rejects.toThrow(
            "keep:@tolki/enum:canary has no expectation for rolldown",
        );
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

    it("reads each staged subpath's names, declaring files and Node-only flag", async () => {
        const scan: SourceScan = {
            exports: [
                entry(
                    "@tolki/fx",
                    "make",
                    "pure",
                    null,
                    "packages/fx/src/lang.ts",
                ),
                entry(
                    "@tolki/fx",
                    "make",
                    "pure",
                    null,
                    "packages/fx/src/vue.ts",
                ),
                entry(
                    "@tolki/fx",
                    "pure",
                    "pure",
                    null,
                    "packages/fx/src/index.ts",
                ),
            ],
            placement: [],
            moduleScope: [],
        };
        const subpaths = await readSubpathExports(
            [
                {
                    name: "@tolki/fx",
                    root: join(app, "node_modules/@tolki/fx"),
                    subpaths: [".", "./setup", "./vue", "./react", "./vite"],
                },
            ],
            scan,
        );

        expect(subpaths).toEqual([
            {
                pkg: "@tolki/fx",
                subpath: ".",
                specifier: "@tolki/fx",
                names: ["make", "plain", "pure"],
                sources: {
                    make: "packages/fx/src/lang.ts",
                    pure: "packages/fx/src/index.ts",
                },
                nodeOnly: false,
                peers: [],
            },
            {
                pkg: "@tolki/fx",
                subpath: "./setup",
                specifier: "@tolki/fx/setup",
                names: ["ready"],
                sources: {},
                nodeOnly: false,
                peers: [],
            },
            {
                pkg: "@tolki/fx",
                subpath: "./vue",
                specifier: "@tolki/fx/vue",
                names: ["make"],
                sources: { make: "packages/fx/src/vue.ts" },
                nodeOnly: false,
                peers: ["vue"],
            },
            {
                pkg: "@tolki/fx",
                subpath: "./react",
                specifier: "@tolki/fx/react",
                names: ["hook"],
                sources: {},
                nodeOnly: false,
                peers: ["react/jsx-runtime"],
            },
            {
                pkg: "@tolki/fx",
                subpath: "./vite",
                specifier: "@tolki/fx/vite",
                names: ["run"],
                sources: {},
                nodeOnly: true,
                peers: [],
            },
        ]);
    });
});
