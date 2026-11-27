import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript";

import { exportsBySubpath, importTarget } from "../lib/manifest.ts";
import type { PackedPackage } from "../lib/pack.ts";
import type { ExportEntry, SourceScan } from "../side-effects/scan.ts";
import type { BundlerName } from "./bundlers.ts";
import { BUNDLERS, isFrameworkPeer } from "./bundlers.ts";
import type { Finding } from "./checks.ts";
import type { KeptDrop } from "./expectations.ts";
import { KEPT_DROPS } from "./expectations.ts";

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
    /** The source file (as the scan names it) that declares each name the package declares itself. */
    sources?: Record<string, string>;
    /** Whether the entry imports a `node:` built-in, so it only ever runs in Node. */
    nodeOnly?: boolean;
    /** The framework peers (`vue`, `react`, `svelte` and their subpaths) the entry imports, transitively. */
    peers?: string[];
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
const CURRIED: Expectations = {
    ...all("kept"),
    rollup: "dropped",
    rspack: "dropped",
};
const RSPACK_KEEPS: Expectations = { ...DROPPED_BUT_ESBUILD, rspack: "kept" };

const CANARY_IMPORT = 'import { from } from "@tolki/enum";\n';

const ENUM_IMPORT = 'import { defineEnum, values } from "@tolki/ts";';
const ENUM_ONLY_IMPORT = 'import { defineEnum } from "@tolki/ts";';
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
        // Rspack keeps defineEnum's body once the module also derives a list from the enum.
        expect: RSPACK_KEEPS,
    },
    {
        name: "enum-only",
        head: ENUM_ONLY_IMPORT,
        exports: (pure) => [
            `export const Status = ${pure}defineEnum({ Active: "active", Inactive: "inactive", backed: true, _cases: ["Active", "Inactive"] });`,
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

/** Whether a module, or a module it imports from its own package, imports a `node:` built-in. */
function importsNodeBuiltin(file: string, seen = new Set<string>()): boolean {
    if (seen.has(file) || !existsSync(file)) {
        return false;
    }

    seen.add(file);

    const specifiers = ts
        .preProcessFile(readFileSync(file, "utf8"), true, true)
        .importedFiles.map(({ fileName }) => fileName);

    return specifiers.some(
        (specifier) =>
            specifier.startsWith("node:") ||
            (specifier.startsWith(".") &&
                importsNodeBuiltin(resolve(dirname(file), specifier), seen)),
    );
}

/** The framework peers a module, or a module it imports from its own package, imports. */
function frameworkPeers(file: string, seen = new Set<string>()): string[] {
    if (seen.has(file) || !existsSync(file)) {
        return [];
    }

    seen.add(file);

    const specifiers = ts
        .preProcessFile(readFileSync(file, "utf8"), true, true)
        .importedFiles.map(({ fileName }) => fileName);
    const peers = specifiers.filter(isFrameworkPeer);
    const nested = specifiers
        .filter((specifier) => specifier.startsWith("."))
        .flatMap((specifier) =>
            frameworkPeers(resolve(dirname(file), specifier), seen),
        );

    return [...new Set([...peers, ...nested])].sort();
}

/** The staged `dist` module for a scanned `src` file, one per source file as `scripts/entries.ts` builds. */
function distModule(root: string, file: string): string {
    const relative = file.slice(file.indexOf("/src/") + "/src/".length);

    return join(root, "dist", relative.replace(/\.ts$/, ".js").toLowerCase());
}

/**
 * Maps each name of a subpath to the source file whose declaration the subpath ships.
 *
 * @param root - The staged package root.
 * @param module - The subpath's imported module.
 * @param declarations - The package's own declaring files per name.
 * @returns The declaring file per name; a name the package does not declare, or re-exports from elsewhere, is absent.
 */
async function declaringFiles(
    root: string,
    module: Record<string, unknown>,
    declarations: Map<string, string[]>,
): Promise<Record<string, string>> {
    const sources: Record<string, string> = {};

    for (const name of Object.keys(module)) {
        for (const file of declarations.get(name) ?? []) {
            const path = distModule(root, file);

            if (!existsSync(path)) {
                continue;
            }

            const declaring = (await import(
                pathToFileURL(path).href
            )) as Record<string, unknown>;

            if (declaring[name] === module[name]) {
                sources[name] = file;
                break;
            }
        }
    }

    return sources;
}

/**
 * Reads the runtime export names of every packed subpath.
 *
 * @param packed - The packages `packWorkspace` extracted.
 * @param scan - The source scan; when given, each subpath also maps its names to their declaring files.
 * @returns One entry per subpath, names as `Object.keys` of the imported module.
 */
export async function readSubpathExports(
    packed: PackedPackage[],
    scan?: SourceScan,
): Promise<SubpathExports[]> {
    const pending = packed.flatMap((pkg) => {
        const targets = exportsBySubpath(pkg.manifest);
        const declarations = new Map<string, string[]>();

        for (const { pkg: owner, name, file } of scan?.exports ?? []) {
            if (owner === pkg.name) {
                declarations.set(name, [
                    ...(declarations.get(name) ?? []),
                    file,
                ]);
            }
        }

        return pkg.subpaths.map(async (subpath): Promise<SubpathExports> => {
            const target = importTarget(targets[subpath]);

            if (target === null) {
                throw new Error(
                    `${pkg.name} has no import target for ${subpath}`,
                );
            }

            const entry = join(pkg.root, target);
            const module = (await import(pathToFileURL(entry).href)) as Record<
                string,
                unknown
            >;
            const read: SubpathExports = {
                pkg: pkg.name,
                subpath,
                specifier:
                    subpath === "."
                        ? pkg.name
                        : `${pkg.name}/${subpath.slice(2)}`,
                names: Object.keys(module),
            };

            return scan === undefined
                ? read
                : {
                      ...read,
                      sources: await declaringFiles(
                          pkg.root,
                          module,
                          declarations,
                      ),
                      nodeOnly: importsNodeBuiltin(entry),
                      peers: frameworkPeers(entry),
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

/**
 * Bare imports of a subpath's framework peers. A real app already imports its framework, so a leftover import of it
 * costs nothing; both a fixture and its control carry them, which leaves only the library's own residue to compare.
 */
function peerImports(sub: SubpathExports): string {
    return (sub.peers ?? []).map((peer) => `import "${peer}";\n`).join("");
}

/** An entry that imports `names` and logs them, so none can be shaken away. */
function logEntry(names: string[], specifier: string): string {
    return `${importLine(names, specifier)}console.log(${names.map(local).join(", ")});\n`;
}

/** Identifies the declaration a subpath ships for a name: its file when known, else just the package and name. */
function declarationKey(sub: SubpathExports, name: string): string {
    return `${sub.pkg} ${sub.sources?.[name] ?? ""} ${name}`;
}

/** Maps each declaration to the subpath its fixtures import it from: `"."` when exported there, else the first. */
function homes(subpaths: SubpathExports[]): Map<string, SubpathExports> {
    const home = new Map<string, SubpathExports>();
    const rootFirst = [
        ...subpaths.filter(({ subpath }) => subpath === "."),
        ...subpaths.filter(({ subpath }) => subpath !== "."),
    ];

    for (const sub of rootFirst) {
        for (const name of sub.names) {
            const key = declarationKey(sub, name);

            if (!home.has(key)) {
                home.set(key, sub);
            }
        }
    }

    return home;
}

/** The mark a fixture acts on: `pure`, `mutates`, or the export's kind otherwise. */
function mark({ kind, category }: ExportEntry): string {
    return category === "mutates" ? "mutates" : kind;
}

/** The kind and category of a declaration, finer than the `mark` that selects fixtures. */
function declaredAs({ kind, category }: ExportEntry): string {
    return `${kind}:${category ?? ""}`;
}

/** Groups the scanned declarations by package and name. */
function declarationsByName(scan: SourceScan): Map<string, ExportEntry[]> {
    const grouped = new Map<string, ExportEntry[]>();

    for (const entry of scan.exports) {
        const key = `${entry.pkg} ${entry.name}`;

        grouped.set(key, [...(grouped.get(key) ?? []), entry]);
    }

    return grouped;
}

/**
 * Reports each runtime-exported name its package declares in several files with different marks.
 *
 * @param subpaths - Each published subpath and its runtime export names.
 * @param scan - The source scan.
 * @returns One finding per such name, naming each file and its mark; debt never excuses it.
 */
export function declarationConflicts(
    subpaths: SubpathExports[],
    scan: SourceScan,
): Finding[] {
    const exported = new Set(
        subpaths.flatMap((sub) =>
            sub.names.map((name) => `${sub.pkg} ${name}`),
        ),
    );

    return [...declarationsByName(scan).entries()]
        .filter(
            ([key, entries]) =>
                exported.has(key) && new Set(entries.map(declaredAs)).size > 1,
        )
        .map(([, entries]): Finding => {
            const { pkg, name } = entries[0] as ExportEntry;
            const files = entries.map(
                (entry) => `${entry.file} (${entry.category ?? entry.kind})`,
            );

            return {
                id: `drop:${pkg}:${name}`,
                bundler: null,
                check: "drop",
                message: `declared with different marks: ${files.join(", ")}`,
            };
        });
}

/** A `drop` fixture: unused calls of `names` in an app module, against the module without the calls. */
function dropFixture(
    sub: SubpathExports,
    names: string[],
    pure: boolean,
    id = `drop:${sub.specifier}${pure ? PURE_SUFFIX : ""}`,
    outcome?: { bundlers: readonly BundlerName[]; expect: Expectations },
): Fixture {
    const head = `${peerImports(sub)}${importLine(names, sub.specifier)}`;
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
        bundlers: outcome?.bundlers ?? (pure ? ["esbuild"] : BUNDLERS),
        expect:
            outcome?.expect ??
            (pure ? { esbuild: "dropped" } : DROPPED_BUT_ESBUILD),
        strict: false,
    };
}

/**
 * The `drop` fixtures of one subpath: a combined one with its per-name split, plus one fixture per name `KEPT_DROPS`
 * lists. A listed name expects `kept` in its bundlers, and with a call-site PURE it expects `dropped` there too.
 */
function dropWithSplit(
    sub: SubpathExports,
    names: string[],
    pure: boolean,
): Fixture[] {
    const known = names.filter(
        (name) => `${sub.specifier}:${name}` in KEPT_DROPS,
    );
    const rest = names.filter((name) => !known.includes(name));
    const fixtures: Fixture[] = [];

    if (rest.length > 0) {
        const combined = dropFixture(sub, rest, pure);

        fixtures.push({
            ...combined,
            split: rest.map((name) =>
                dropFixture(sub, [name], pure, `${combined.id}:${name}`),
            ),
        });
    }

    for (const name of known) {
        const kept = (KEPT_DROPS[`${sub.specifier}:${name}`] as KeptDrop)
            .bundlers;
        const id = `drop:${sub.specifier}${pure ? PURE_SUFFIX : ""}:${name}`;

        fixtures.push(
            pure
                ? dropFixture(sub, [name], true, id, {
                      bundlers: ["esbuild", ...kept],
                      expect: all("dropped"),
                  })
                : dropFixture(sub, [name], false, id, {
                      bundlers: BUNDLERS,
                      expect: {
                          ...DROPPED_BUT_ESBUILD,
                          ...Object.fromEntries(
                              kept.map((bundler) => [bundler, "kept"]),
                          ),
                      },
                  }),
        );
    }

    return fixtures;
}

/** A `keep` fixture: a call that writes to a used target, against the module without the call. */
function keepFixture(sub: SubpathExports, name: string): Fixture {
    const head = `${peerImports(sub)}${importLine([name], sub.specifier)}export const target = [];\n`;

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

/** A call every bundler keeps, so `kept` stays observable in each one whatever the packages annotate. */
const CANARY: Fixture = {
    id: "keep:@tolki/enum:canary",
    check: "keep",
    files: {
        "mod.js": `${CANARY_IMPORT}from({ A: "a", _cases: ["A"] }, "b");\n${USED}`,
        "entry.js": ENTRY_USED,
    },
    control: { "mod.js": `${CANARY_IMPORT}${USED}`, "entry.js": ENTRY_USED },
    bundlers: BUNDLERS,
    expect: all("kept"),
    strict: false,
};

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
    const marks = new Map<string, string>();

    for (const [key, entries] of declarationsByName(scan)) {
        const found = new Set(entries.map(mark));

        // Without its declaring file, a name with different marks cannot be pinned to either.
        marks.set(key, found.size === 1 ? [...found].join("") : "mixed");

        for (const entry of entries) {
            marks.set(`${entry.pkg} ${entry.file} ${entry.name}`, mark(entry));
        }
    }

    const markOf = (sub: SubpathExports, name: string): string | undefined => {
        const file = sub.sources?.[name];

        return marks.get(
            file === undefined
                ? `${sub.pkg} ${name}`
                : `${sub.pkg} ${file} ${name}`,
        );
    };
    const homed = (sub: SubpathExports, kind: string): string[] =>
        sub.names.filter(
            (name) =>
                home.get(declarationKey(sub, name)) === sub &&
                markOf(sub, name) === kind,
        );
    const named = subpaths.filter(({ names }) => names.length > 0);

    return [
        ...subpaths.map(
            (sub): Fixture => ({
                id: `bare:${sub.specifier}`,
                check: "bare",
                files: { "entry.js": `import "${sub.specifier}";\n` },
                // Rolldown measures module sizes before its minifier, so its final bundle is judged instead.
                control: { "entry.js": "" },
                bundlers: ["rollup", "rolldown"],
                expect: { rolldown: "dropped" },
                strict: true,
            }),
        ),
        // A Node-only entry runs in a Vite config and is never bundled for the browser.
        ...subpaths.flatMap((sub) =>
            sub.names
                .filter(
                    (name) =>
                        !sub.nodeOnly &&
                        home.get(declarationKey(sub, name)) === sub,
                )
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
        // A Node-only entry is never bundled for the browser, so its kept imports are not ours to drop.
        ...subpaths.flatMap((sub) => {
            const pure = homed(sub, "pure");

            return pure.length === 0 || sub.nodeOnly
                ? []
                : [
                      ...dropWithSplit(sub, pure, false),
                      ...dropWithSplit(sub, pure, true),
                  ];
        }),
        ...subpaths.flatMap((sub) =>
            homed(sub, "mutates").map((name) => keepFixture(sub, name)),
        ),
        CANARY,
        ...SHAPES.flatMap((shape) => [
            shapeFixture(shape, false),
            shapeFixture(shape, true),
        ]),
    ];
}
