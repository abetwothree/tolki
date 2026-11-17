import {
    cpSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    realpathSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

export type PackageJson = Record<string, unknown>;

export interface StagedPackage {
    name: string;
    root: string;
    subpaths: string[];
}

/**
 * The manifest a package publishes: `publishConfig` copied over the top level, then dropped.
 *
 * @param manifest - The package.json as it sits in the repository.
 * @returns The manifest as it ships.
 */
export function publishedManifest(manifest: PackageJson): PackageJson {
    const { publishConfig, ...rest } = manifest;

    return { ...rest, ...(publishConfig as PackageJson | undefined) };
}

/** Every string target inside an exports value. */
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

/** Links `<outDir>/node_modules/<dep>` to the realpath of the dependency installed beside the package. */
function linkDependency(
    packageDir: string,
    outModules: string,
    dep: string,
): void {
    const installed = join(packageDir, "node_modules", dep);
    const target = join(outModules, dep);

    if (!existsSync(installed) || existsSync(target)) {
        return;
    }

    mkdirSync(dirname(target), { recursive: true });
    symlinkSync(realpathSync(installed), target);
}

/**
 * Stages every published package as it ships, under `<outDir>/node_modules`.
 *
 * @param repoRoot - The repository root holding `packages/`.
 * @param outDir - The throwaway workspace to stage into.
 * @returns One entry per staged package.
 */
export function stagePackages(
    repoRoot: string,
    outDir: string,
): StagedPackage[] {
    const outModules = join(outDir, "node_modules");
    const staged: StagedPackage[] = [];

    for (const entry of readdirSync(join(repoRoot, "packages")).sort()) {
        const packageDir = join(repoRoot, "packages", entry);
        const manifestPath = join(packageDir, "package.json");

        if (!existsSync(manifestPath)) {
            continue;
        }

        const source = JSON.parse(
            readFileSync(manifestPath, "utf8"),
        ) as PackageJson;
        const scripts = source.scripts as Record<string, string> | undefined;

        if (source.private === true || !scripts?.build) {
            continue;
        }

        const manifest = publishedManifest(source);
        const name = manifest.name as string;
        const root = join(outModules, name);

        rmSync(root, { recursive: true, force: true });
        mkdirSync(root, { recursive: true });
        writeFileSync(
            join(root, "package.json"),
            JSON.stringify(manifest, null, 2),
        );

        for (const file of (manifest.files as string[] | undefined) ?? []) {
            if (!existsSync(join(packageDir, file))) {
                throw new Error(
                    `${name} has no build output at ${file}; run pnpm build first`,
                );
            }

            cpSync(join(packageDir, file), join(root, file), {
                recursive: true,
            });
        }

        const deps = [
            ...Object.keys((manifest.dependencies as object | undefined) ?? {}),
            ...Object.keys(
                (manifest.peerDependencies as object | undefined) ?? {},
            ),
        ];

        for (const dep of deps.filter((dep) => !dep.startsWith("@tolki/"))) {
            linkDependency(packageDir, outModules, dep);
        }

        staged.push({ name, root, subpaths: publishedSubpaths(manifest) });
    }

    return staged;
}
