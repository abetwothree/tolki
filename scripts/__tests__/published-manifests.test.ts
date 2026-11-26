import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildEntries } from "../entries.ts";
import {
    hasBuild,
    type WorkspacePackage,
    workspacePackages,
} from "../lib/workspace.ts";

const REPO_ROOT = resolve(import.meta.dirname, "../..");
const packages = workspacePackages(REPO_ROOT);

interface ExportMap {
    label: string;
    map: unknown;
}

interface ConditionObject {
    path: string;
    keys: string[];
    value: Record<string, unknown>;
}

/**
 * Narrows a value to a plain object.
 *
 * @param value - Any parsed JSON value.
 * @returns True for non-null, non-array objects.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Collects every condition object in an exports map: objects whose keys are not subpaths.
 *
 * @param map - An `exports` value.
 * @param path - Path used to name the object in failures.
 * @returns One entry per condition object found.
 */
function conditionObjects(map: unknown, path = "exports"): ConditionObject[] {
    if (!isRecord(map)) {
        return [];
    }

    const keys = Object.keys(map);

    if (keys.length > 0 && keys.every((key) => !key.startsWith("."))) {
        return [{ path, keys, value: map }];
    }

    return keys.flatMap((key) => conditionObjects(map[key], `${path}[${key}]`));
}

/**
 * Lists the top-level and published export maps of every package that has one.
 *
 * @returns The labelled maps.
 */
function exportMaps(): ExportMap[] {
    return packages.flatMap((pkg) => {
        const maps: ExportMap[] = [];

        if (pkg.manifest.exports !== undefined) {
            maps.push({
                label: `${pkg.name} exports`,
                map: pkg.manifest.exports,
            });
        }

        const published = pkg.manifest.publishConfig?.["exports"];

        if (published !== undefined) {
            maps.push({
                label: `${pkg.name} publishConfig.exports`,
                map: published,
            });
        }

        return maps;
    });
}

/**
 * Reads the exports map a package publishes.
 *
 * @param pkg - The workspace package.
 * @returns The publishConfig map when set, else the top-level map.
 */
function publishedExports(pkg: WorkspacePackage): Record<string, unknown> {
    const map = pkg.manifest.publishConfig?.["exports"] ?? pkg.manifest.exports;

    return isRecord(map) ? map : {};
}

/**
 * Tells whether an exports key matches a subpath pattern holding at most one `*`.
 *
 * @param pattern - A dev exports key.
 * @param key - A published exports key.
 * @returns True when the key equals the pattern or fills its `*`.
 */
function matchesSubpath(pattern: string, key: string): boolean {
    if (!pattern.includes("*")) {
        return pattern === key;
    }

    const [head = "", tail = ""] = pattern.split("*");

    return (
        key.length >= head.length + tail.length &&
        key.startsWith(head) &&
        key.endsWith(tail)
    );
}

const allExportMaps = exportMaps();
const builtPackages = packages.filter(
    (pkg) =>
        (hasBuild(pkg) && pkg.manifest.exports !== undefined) ||
        (hasBuild(pkg) &&
            pkg.manifest.publishConfig?.["exports"] !== undefined),
);
const packagesWithBoth = packages.filter((pkg) =>
    ["@tolki/enum", "@tolki/lang", "@tolki/ts"].includes(pkg.name),
);

describe("exports condition objects", () => {
    it.each(allExportMaps)(
        "$label holds only types and default, types first",
        ({ map }) => {
            for (const { path, keys } of conditionObjects(map)) {
                expect(
                    keys.every((key) => key === "types" || key === "default"),
                    path,
                ).toBe(true);

                if (keys.includes("types")) {
                    expect(keys[0], path).toBe("types");
                }
            }
        },
    );
});

describe("@tolki/types exports", () => {
    const types = packages.find((pkg) => pkg.name === "@tolki/types");
    const exportsMap = types ? publishedExports(types) : {};
    const srcDir = join(REPO_ROOT, "packages/types/src");

    it("points every target at an existing file", () => {
        const missing = conditionObjects(exportsMap)
            .map(({ value }) => value["types"])
            .filter(
                (target): target is string =>
                    typeof target === "string" &&
                    !existsSync(join(REPO_ROOT, "packages/types", target)),
            );

        expect(missing).toEqual([]);
    });

    it("gives every src declaration file except index a subpath of its own name", () => {
        const missingSubpaths = readdirSync(srcDir)
            .filter((file) => file.endsWith(".d.ts") && file !== "index.d.ts")
            .map((file) => `./${file.slice(0, -".d.ts".length)}`)
            .filter((subpath) => !(subpath in exportsMap));

        expect(missingSubpaths).toEqual([]);
    });
});

describe("built packages' dist targets", () => {
    it.each(builtPackages)(
        "$name maps every ./dist/<path>.js target to a build entry with a matching .d.ts",
        (pkg) => {
            const entries = buildEntries("src/**/*.ts", pkg.dir);
            const problems: string[] = [];

            for (const { path, value } of conditionObjects(
                publishedExports(pkg),
            )) {
                const target = value["default"];

                if (
                    typeof target !== "string" ||
                    target.includes("*") ||
                    !target.startsWith("./dist/") ||
                    !target.endsWith(".js")
                ) {
                    continue;
                }

                const key = target.slice("./dist/".length, -".js".length);

                if (!(key in entries)) {
                    problems.push(`${path}: no build entry for ${key}`);
                }

                if (value["types"] !== `./dist/${key}.d.ts`) {
                    problems.push(`${path}: types is not ./dist/${key}.d.ts`);
                }
            }

            expect(problems).toEqual([]);
        },
    );
});

describe("dev and published exports", () => {
    it.each(packagesWithBoth)(
        "$name publishes only subpaths its dev exports declare, exactly or through *",
        (pkg) => {
            const dev = isRecord(pkg.manifest.exports)
                ? Object.keys(pkg.manifest.exports)
                : [];
            const published = Object.keys(publishedExports(pkg)).filter((key) =>
                key.startsWith("."),
            );
            const undeclared = published.filter(
                (key) => !dev.some((pattern) => matchesSubpath(pattern, key)),
            );

            expect(undeclared).toEqual([]);
        },
    );
});
