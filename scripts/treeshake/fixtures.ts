import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { SourceScan } from "../side-effects/scan.ts";
import type { BundlerName } from "./bundlers.ts";
import { BUNDLERS } from "./bundlers.ts";
import type { PackageJson, StagedPackage } from "./stage.ts";

export type CheckName =
    | "bare"
    | "parity"
    | "surface"
    | "namespace"
    | "drop"
    | "keep"
    | "shape";

export type Outcome = "dropped" | "kept";

export interface Fixture {
    id: string;
    check: CheckName;
    files: Record<string, string>;
    control: Record<string, string> | null;
    bundlers: readonly BundlerName[];
    expect: Partial<Record<BundlerName, Outcome>>;
    strict: boolean;
    /** One fixture per name of a combined `drop`, re-run when it fails so the finding names each kept function. */
    split?: Fixture[];
}

export interface SubpathExports {
    pkg: string;
    subpath: string;
    specifier: string;
    names: string[];
}

type Expectations = Partial<Record<BundlerName, Outcome>>;

const ENTRY_USED = 'import { used } from "./mod.js";\nconsole.log(used);\n';
const ENTRY_TARGET =
    'import { target } from "./mod.js";\nconsole.log(target);\n';
const USED = "export const used = 1;\n";
const PURE = "/* @__PURE__ */ ";
const PURE_SUFFIX = ":call-site-pure";

/** Every bundler with the same outcome. */
function all(outcome: Outcome): Expectations {
    return Object.fromEntries(BUNDLERS.map((bundler) => [bundler, outcome]));
}

const DROPPED_BUT_ESBUILD: Expectations = {
    ...all("dropped"),
    esbuild: "kept",
};
const CURRIED: Expectations = { ...all("kept"), rollup: "dropped" };

const ENUM_IMPORT = 'import { defineEnum, values } from "@tolki/ts";';
const ROUTE_IMPORT =
    'import { annotatePageProps, annotateRequestPayload, defineRoute } from "@tolki/ts";';

interface Shape {
    name: string;
    head: string;
    exports: (pure: string) => string[];
    expect: Expectations;
}

/** The generated consumer files of Appendix B, table 4, one row each. */
const SHAPES: Shape[] = [
    {
        name: "enum-file",
        head: ENUM_IMPORT,
        exports: (pure) => [
            `export const Status = ${pure}defineEnum({ Active: "active", Inactive: "inactive", backed: true, _cases: ["Active", "Inactive"] });`,
            `export const STATUSES = ${pure}values(Status);`,
        ],
        expect: DROPPED_BUT_ESBUILD,
    },
    {
        name: "define-route",
        head: ROUTE_IMPORT,
        exports: (pure) => [
            `export const index = ${pure}defineRoute({ name: "users.index", url: "/users", methods: ["get"] });`,
        ],
        expect: DROPPED_BUT_ESBUILD,
    },
    {
        name: "annotate-page-props",
        head: ROUTE_IMPORT,
        exports: (pure) => [
            `export const show = ${pure}annotatePageProps()(${pure}defineRoute({ url: "/users/{user}", methods: ["get"], args: [{ name: "user", required: true }] }));`,
        ],
        expect: CURRIED,
    },
    {
        name: "annotate-request-payload",
        head: ROUTE_IMPORT,
        exports: (pure) => [
            `export const store = ${pure}annotateRequestPayload()(${pure}defineRoute({ url: "/users", methods: ["post"] }));`,
        ],
        expect: CURRIED,
    },
];

const IMPORT_CONDITIONS = new Set(["node", "import", "module-sync", "default"]);

/** The file Node's `import` conditions pick from an exports target. */
function importTarget(target: unknown): string | null {
    if (typeof target === "string") {
        return target;
    }

    if (target === null || typeof target !== "object") {
        return null;
    }

    for (const [condition, value] of Object.entries(target)) {
        const found = IMPORT_CONDITIONS.has(condition)
            ? importTarget(value)
            : null;

        if (found !== null) {
            return found;
        }
    }

    return null;
}

/** The exports field keyed by subpath, as `publishedSubpaths` reads it. */
function exportsBySubpath(manifest: PackageJson): Record<string, unknown> {
    const field = manifest.exports ?? manifest.main ?? "./index.js";

    return typeof field === "object" &&
        field !== null &&
        Object.keys(field).some((key) => key.startsWith("."))
        ? (field as Record<string, unknown>)
        : { ".": field };
}

/**
 * Reads the runtime export names of every staged subpath.
 *
 * @param staged - The packages `stagePackages` wrote.
 * @returns One entry per subpath, names as `Object.keys` of the imported module.
 */
export async function readSubpathExports(
    staged: StagedPackage[],
): Promise<SubpathExports[]> {
    const pending = staged.flatMap((pkg) => {
        const manifest = JSON.parse(
            readFileSync(join(pkg.root, "package.json"), "utf8"),
        ) as PackageJson;
        const targets = exportsBySubpath(manifest);

        return pkg.subpaths.map(async (subpath) => {
            const target = importTarget(targets[subpath]);

            if (target === null) {
                throw new Error(
                    `${pkg.name} has no import target for ${subpath}`,
                );
            }

            const module = (await import(
                pathToFileURL(join(pkg.root, target)).href
            )) as Record<string, unknown>;

            return {
                pkg: pkg.name,
                subpath,
                specifier:
                    subpath === "."
                        ? pkg.name
                        : `${pkg.name}/${subpath.slice(2)}`,
                names: Object.keys(module),
            };
        });
    });

    return Promise.all(pending);
}

/** The local binding a generated import gives a name; `default` is not an identifier. */
function local(name: string): string {
    return name === "default" ? "_default" : name;
}

/** A named import of `names` from `specifier`, ending in a newline. */
function importLine(names: string[], specifier: string): string {
    const bindings = names.map((name) =>
        name === "default" ? "default as _default" : name,
    );

    return `import { ${bindings.join(", ")} } from "${specifier}";\n`;
}

/** An entry that imports `names` and logs them, so none can be shaken away. */
function logEntry(names: string[], specifier: string): string {
    return `${importLine(names, specifier)}console.log(${names.map(local).join(", ")});\n`;
}

/** Maps each `pkg` and name to the subpath its fixtures import it from: `"."` when exported there, else the first. */
function homes(subpaths: SubpathExports[]): Map<string, SubpathExports> {
    const home = new Map<string, SubpathExports>();
    const rootFirst = [
        ...subpaths.filter(({ subpath }) => subpath === "."),
        ...subpaths.filter(({ subpath }) => subpath !== "."),
    ];

    for (const sub of rootFirst) {
        for (const name of sub.names) {
            const key = `${sub.pkg} ${name}`;

            if (!home.has(key)) {
                home.set(key, sub);
            }
        }
    }

    return home;
}

/** A `drop` fixture: unused calls of `names` in an app module, against the module without the calls. */
function dropFixture(
    sub: SubpathExports,
    names: string[],
    pure: boolean,
    id = `drop:${sub.specifier}${pure ? PURE_SUFFIX : ""}`,
): Fixture {
    const head = importLine(names, sub.specifier);
    const calls = names
        .map(
            (name, index) =>
                `export const __u${index} = ${pure ? PURE : ""}${local(name)}();\n`,
        )
        .join("");

    return {
        id,
        check: "drop",
        files: { "mod.js": `${head}${calls}${USED}`, "entry.js": ENTRY_USED },
        control: { "mod.js": `${head}${USED}`, "entry.js": ENTRY_USED },
        bundlers: pure ? ["esbuild"] : BUNDLERS,
        expect: pure ? { esbuild: "dropped" } : DROPPED_BUT_ESBUILD,
        strict: false,
    };
}

/** The combined `drop` fixture of one subpath plus its per-name split. */
function dropWithSplit(
    sub: SubpathExports,
    names: string[],
    pure: boolean,
): Fixture {
    const combined = dropFixture(sub, names, pure);

    return {
        ...combined,
        split: names.map((name) =>
            dropFixture(sub, [name], pure, `${combined.id}:${name}`),
        ),
    };
}

/** A `keep` fixture: a call that writes to a used target, against the module without the call. */
function keepFixture(sub: SubpathExports, name: string): Fixture {
    const head = `${importLine([name], sub.specifier)}export const target = [];\n`;

    return {
        id: `keep:${sub.specifier}:${name}`,
        check: "keep",
        files: {
            "mod.js": `${head}${local(name)}(target);\n`,
            "entry.js": ENTRY_TARGET,
        },
        control: { "mod.js": head, "entry.js": ENTRY_TARGET },
        bundlers: BUNDLERS,
        expect: all("kept"),
        strict: false,
    };
}

/** A `shape` fixture: one generated consumer file, against its import line alone. */
function shapeFixture(shape: Shape, pure: boolean): Fixture {
    const lines = [shape.head, ...shape.exports(pure ? PURE : "")];

    return {
        id: `shape:@tolki/ts:${shape.name}${pure ? PURE_SUFFIX : ""}`,
        check: "shape",
        files: {
            "mod.js": `${lines.join("\n")}\n${USED}`,
            "entry.js": ENTRY_USED,
        },
        control: { "mod.js": `${shape.head}\n${USED}`, "entry.js": ENTRY_USED },
        bundlers: BUNDLERS,
        expect: pure ? all("dropped") : shape.expect,
        strict: false,
    };
}

/**
 * Builds every fixture `treeshake:check` bundles.
 *
 * @param subpaths - Each published subpath and its runtime export names.
 * @param scan - The source scan, which says which exports are pure and which mutate an argument.
 * @returns The fixtures, grouped by check.
 */
export function buildFixtures(
    subpaths: SubpathExports[],
    scan: SourceScan,
): Fixture[] {
    const home = homes(subpaths);
    const kinds = new Map<string, string>();

    for (const entry of scan.exports) {
        const key = `${entry.pkg} ${entry.name}`;
        const kind = entry.category === "mutates" ? "mutates" : entry.kind;
        const seen = kinds.get(key);

        // A name that two source files export with different marks cannot be pinned to either.
        kinds.set(key, seen === undefined || seen === kind ? kind : "mixed");
    }

    const homed = (sub: SubpathExports, kind: string): string[] =>
        sub.names.filter((name) => {
            const key = `${sub.pkg} ${name}`;

            return home.get(key) === sub && kinds.get(key) === kind;
        });
    const named = subpaths.filter(({ names }) => names.length > 0);

    return [
        ...subpaths.map(
            (sub): Fixture => ({
                id: `bare:${sub.specifier}`,
                check: "bare",
                files: { "entry.js": `import "${sub.specifier}";\n` },
                control: null,
                bundlers: ["rollup", "rolldown"],
                expect: {},
                strict: true,
            }),
        ),
        ...subpaths.flatMap((sub) =>
            sub.names
                .filter((name) => home.get(`${sub.pkg} ${name}`) === sub)
                .map(
                    (name): Fixture => ({
                        id: `parity:${sub.specifier}:${name}`,
                        check: "parity",
                        files: { "entry.js": logEntry([name], sub.specifier) },
                        control: null,
                        bundlers: ["rolldown", "esbuild"],
                        expect: {},
                        strict: false,
                    }),
                ),
        ),
        ...named.map(
            (sub): Fixture => ({
                id: `surface:${sub.specifier}`,
                check: "surface",
                files: { "entry.js": logEntry(sub.names, sub.specifier) },
                control: null,
                bundlers: BUNDLERS,
                expect: {},
                strict: false,
            }),
        ),
        ...named.map((sub): Fixture => {
            const [first = ""] = sub.names;

            return {
                id: `namespace:${sub.specifier}`,
                check: "namespace",
                files: {
                    "entry.js": `import * as ns from "${sub.specifier}";\nconsole.log(ns.${first});\n`,
                },
                control: { "entry.js": logEntry([first], sub.specifier) },
                bundlers: ["rollup", "rolldown", "esbuild"],
                expect: {},
                strict: false,
            };
        }),
        ...subpaths.flatMap((sub) => {
            const pure = homed(sub, "pure");

            return pure.length === 0
                ? []
                : [
                      dropWithSplit(sub, pure, false),
                      dropWithSplit(sub, pure, true),
                  ];
        }),
        ...subpaths.flatMap((sub) =>
            homed(sub, "mutates").map((name) => keepFixture(sub, name)),
        ),
        ...SHAPES.flatMap((shape) => [
            shapeFixture(shape, false),
            shapeFixture(shape, true),
        ]),
    ];
}
