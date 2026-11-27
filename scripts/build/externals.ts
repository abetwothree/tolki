import { builtinModules } from "node:module";
import path from "node:path";

import type { PackageJson } from "../lib/workspace.ts";

/**
 * Names the package an import specifier points into.
 *
 * @param id - A bare import specifier.
 * @returns The package name, two segments when scoped.
 */
function packageNameOf(id: string): string {
    return id
        .split("/")
        .slice(0, id.startsWith("@") ? 2 : 1)
        .join("/");
}

/**
 * The Rolldown `external` predicate for one package: built-ins and declared deps, peers and self are external.
 *
 * @param manifest - The package's package.json.
 * @returns A predicate that throws on a bare import the manifest does not declare.
 */
export function packageExternals(
    manifest: PackageJson,
): (id: string) => boolean {
    const declared = new Set([
        ...Object.keys(manifest.dependencies ?? {}),
        ...Object.keys(manifest.peerDependencies ?? {}),
        ...(manifest.name === undefined ? [] : [manifest.name]),
    ]);
    const builtins = new Set(builtinModules);

    return (id) => {
        if (
            id.startsWith("\0") ||
            id.startsWith(".") ||
            id.startsWith("/") ||
            path.win32.isAbsolute(id)
        ) {
            return false;
        }

        if (id.startsWith("node:")) {
            return true;
        }

        const name = packageNameOf(id);

        if (builtins.has(name) || declared.has(name)) {
            return true;
        }

        throw new Error(
            `${manifest.name} imports "${id}", which is not in its dependencies or peerDependencies`,
        );
    };
}
