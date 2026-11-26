import { join } from "node:path";

import { exportEntries } from "../lib/manifest.ts";
import type { PackedPackage } from "../lib/pack.ts";

export type EntryKind = "value" | "types" | "ambient";

export interface ConsumerEntry {
    pkg: string;
    specifier: string;
    kind: EntryKind;
}

export type CellName =
    | "node16-esm"
    | "nodenext-esm"
    | "nodenext-cjs"
    | "bundler"
    | "nodenext-no-dom";

export interface Cell {
    name: CellName;
    compilerOptions: Record<string, unknown>;
    files: string[];
}

const STRICT = {
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    types: [],
    target: "esnext",
};
const NODENEXT = { module: "nodenext", moduleResolution: "nodenext" };

export const CELLS: readonly Cell[] = [
    {
        name: "node16-esm",
        compilerOptions: {
            ...STRICT,
            module: "node16",
            moduleResolution: "node16",
        },
        files: ["esm.mts", "repro.mts", "augment.mts"],
    },
    {
        name: "nodenext-esm",
        compilerOptions: { ...STRICT, ...NODENEXT },
        files: ["esm.mts", "repro.mts", "augment.mts"],
    },
    {
        name: "nodenext-cjs",
        compilerOptions: { ...STRICT, ...NODENEXT },
        files: ["cjs.cts"],
    },
    {
        name: "bundler",
        compilerOptions: {
            ...STRICT,
            module: "esnext",
            moduleResolution: "bundler",
        },
        files: ["esm.mts", "repro.mts", "augment.mts"],
    },
    {
        name: "nodenext-no-dom",
        compilerOptions: {
            ...STRICT,
            ...NODENEXT,
            lib: ["esnext"],
            exactOptionalPropertyTypes: true,
            noUncheckedIndexedAccess: true,
        },
        files: ["core.mts"],
    },
];

/** Entries that need a framework, Vite or Node types, so the no-DOM cell leaves them out. */
export const NO_DOM_EXCLUDED: readonly string[] = [
    "@tolki/lang/vue",
    "@tolki/lang/react",
    "@tolki/lang/svelte",
    "@tolki/lang/vite-laravel",
    "@tolki/enum/vite",
    "@tolki/ts/vite",
];

/**
 * The entries a consumer can import from one packed package, in manifest order.
 *
 * @param pkg - The packed package.
 * @param isAmbient - Tells whether a declaration file declares no module of its own.
 * @returns One entry per exports key, and one value probe per wildcard key.
 */
function packageEntries(
    pkg: PackedPackage,
    isAmbient: (declarationFile: string) => boolean,
): ConsumerEntry[] {
    const entries = exportEntries(pkg.manifest);
    const rootTarget =
        entries.find(({ subpath }) => subpath === ".")?.target ?? null;

    return entries.flatMap(({ subpath, types, target }): ConsumerEntry[] => {
        const specifier =
            subpath === "." ? pkg.name : `${pkg.name}${subpath.slice(1)}`;

        if (subpath.includes("*")) {
            if (rootTarget === null) {
                throw new Error(
                    `${pkg.name} exports "${subpath}" but "." has no import target to probe it with`,
                );
            }

            return [
                {
                    pkg: pkg.name,
                    specifier: `${pkg.name}/${rootTarget.replace(/^\.\/dist\//, "")}`,
                    kind: "value",
                },
            ];
        }

        if (target !== null) {
            return [{ pkg: pkg.name, specifier, kind: "value" }];
        }

        if (types === null) {
            return [];
        }

        const kind = isAmbient(join(pkg.root, types)) ? "ambient" : "types";

        return [{ pkg: pkg.name, specifier, kind }];
    });
}

/**
 * The entries the consumer files import, across every packed package.
 *
 * @param packages - The packed packages.
 * @param isAmbient - Tells whether a declaration file declares no module of its own.
 * @returns The entries in package order, then manifest order.
 */
export function consumerEntries(
    packages: readonly PackedPackage[],
    isAmbient: (declarationFile: string) => boolean,
): ConsumerEntry[] {
    return packages.flatMap((pkg) => packageEntries(pkg, isAmbient));
}

/**
 * Keeps the entries whose specifier contains the filter text.
 *
 * @param entries - The entries.
 * @param filter - The text to look for, or undefined to keep every entry.
 * @returns The kept entries, in order.
 */
export function filterEntries(
    entries: readonly ConsumerEntry[],
    filter: string | undefined,
): ConsumerEntry[] {
    return entries.filter(
        ({ specifier }) => filter === undefined || specifier.includes(filter),
    );
}

/**
 * Renders one consumer file: the ambient references, then an import and an export per other entry.
 *
 * @param entries - The entries the file covers.
 * @returns The file text.
 */
function renderConsumer(entries: readonly ConsumerEntry[]): string {
    const references = entries
        .filter(({ kind }) => kind === "ambient")
        .map(({ specifier }) => `/// <reference types="${specifier}" />\n`);
    const imports = entries
        .filter(({ kind }) => kind !== "ambient")
        .map(({ specifier, kind }, index) =>
            kind === "types"
                ? `import type * as e${index} from "${specifier}";\nexport type { e${index} };\n`
                : `import * as e${index} from "${specifier}";\nexport { e${index} };\n`,
        );

    return [...references, ...imports].join("");
}

/**
 * The generated consumer files.
 *
 * @param entries - The entries to import.
 * @returns `esm.mts` and `cjs.cts` with every entry, and `core.mts` without the NO_DOM_EXCLUDED ones.
 */
export function consumerFiles(
    entries: readonly ConsumerEntry[],
): Record<"esm.mts" | "cjs.cts" | "core.mts", string> {
    const all = renderConsumer(entries);

    return {
        "esm.mts": all,
        "cjs.cts": all,
        "core.mts": renderConsumer(
            entries.filter(
                ({ specifier }) => !NO_DOM_EXCLUDED.includes(specifier),
            ),
        ),
    };
}

/**
 * Tells whether a cell has nothing to check, so it can report skipped rather than a vacuous pass.
 *
 * @param cell - The cell.
 * @param files - The generated consumer files, from consumerFiles.
 * @returns True when every file the cell reads is a generated file with no entry; a fixed input never is.
 */
export function isEmptyCell(
    cell: Cell,
    files: Readonly<Record<"esm.mts" | "cjs.cts" | "core.mts", string>>,
): boolean {
    const generated: Readonly<Record<string, string>> = files;

    return cell.files.every((file) => generated[file] === "");
}

/**
 * The NO_DOM_EXCLUDED specifiers that no entry declares.
 *
 * @param entries - Every entry the manifests declare, before any filter.
 * @returns The stale specifiers, in list order.
 */
export function staleExclusions(entries: readonly ConsumerEntry[]): string[] {
    return NO_DOM_EXCLUDED.filter(
        (excluded) => !entries.some(({ specifier }) => specifier === excluded),
    );
}

/**
 * The packed packages that contribute no entry.
 *
 * @param packages - The packed packages.
 * @param entries - The entries built from them.
 * @returns The names of the packages without an entry.
 */
export function emptyPackages(
    packages: readonly PackedPackage[],
    entries: readonly ConsumerEntry[],
): string[] {
    return packages
        .filter(({ name }) => !entries.some(({ pkg }) => pkg === name))
        .map(({ name }) => name);
}
