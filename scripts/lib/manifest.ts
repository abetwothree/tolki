import type { PackageJson } from "./workspace.ts";

const IMPORT_CONDITIONS = new Set(["node", "import", "module-sync", "default"]);

/**
 * The file Node's `import` conditions pick from an exports target.
 *
 * @param target - An exports value: a path or a condition map.
 * @returns The picked path, or null when no import condition matches.
 */
export function importTarget(target: unknown): string | null {
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

/**
 * The exports field keyed by subpath.
 *
 * @param manifest - A published manifest.
 * @returns A subpath map; a bare target or condition map is wrapped under `"."`.
 */
export function exportsBySubpath(
    manifest: PackageJson,
): Record<string, unknown> {
    const field = manifest.exports ?? manifest.main ?? "./index.js";

    return typeof field === "object" &&
        field !== null &&
        Object.keys(field).some((key) => key.startsWith("."))
        ? (field as Record<string, unknown>)
        : { ".": field };
}

/**
 * Every string target inside an exports value.
 *
 * @param value - An exports value: a path or a condition map.
 * @returns Each path found, depth first.
 */
function exportTargets(value: unknown): string[] {
    if (typeof value === "string") {
        return [value];
    }

    return Object.values(value as Record<string, unknown>).flatMap(
        exportTargets,
    );
}

/**
 * The code subpaths of a published `exports` field.
 *
 * @param manifest - A published manifest.
 * @returns Subpaths such as `"."` and `"./vue"`, without wildcards, `package.json` or type-only entries.
 */
export function publishedSubpaths(manifest: PackageJson): string[] {
    const exportsField = manifest.exports ?? "./index.js";
    const keys =
        typeof exportsField === "object" &&
        Object.keys(exportsField as object).some((key) => key.startsWith("."))
            ? (exportsField as Record<string, unknown>)
            : { ".": exportsField };

    return Object.entries(keys)
        .filter(
            ([key, target]) =>
                key !== "./package.json" &&
                !key.includes("*") &&
                !exportTargets(target).every((path) => path.endsWith(".d.ts")),
        )
        .map(([key]) => key);
}
