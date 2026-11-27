import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export interface PackageJson {
    name?: string;
    version?: string;
    private?: boolean;
    main?: string;
    types?: string;
    files?: string[];
    exports?: unknown;
    publishConfig?: Record<string, unknown>;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    tolki?: { docs?: string[] };
    [key: string]: unknown;
}

export interface WorkspacePackage {
    dirName: string;
    dir: string;
    name: string;
    manifest: PackageJson;
}

/**
 * Lists the directories under `<repoRoot>/packages` that hold a package.json.
 *
 * @param repoRoot - Absolute path of the repository root.
 * @returns The packages sorted by directory name.
 */
export function workspacePackages(repoRoot: string): WorkspacePackage[] {
    const packagesDir = join(repoRoot, "packages");

    if (!existsSync(packagesDir)) {
        throw new Error(`Packages directory not found: ${packagesDir}`);
    }

    return readdirSync(packagesDir)
        .sort()
        .flatMap((dirName) => {
            const dir = join(packagesDir, dirName);
            const manifestPath = join(dir, "package.json");

            if (!statSync(dir).isDirectory() || !existsSync(manifestPath)) {
                return [];
            }

            const manifest = JSON.parse(
                readFileSync(manifestPath, "utf8"),
            ) as PackageJson;

            return [
                {
                    dirName,
                    dir,
                    name: manifest.name ?? `@tolki/${dirName}`,
                    manifest,
                },
            ];
        });
}

/**
 * Tells whether a package publishes to npm.
 *
 * @param pkg - The workspace package.
 * @returns True unless the manifest is private.
 */
export function isPublished(pkg: WorkspacePackage): boolean {
    return pkg.manifest.private !== true;
}

/**
 * Tells whether a package has a build script.
 *
 * @param pkg - The workspace package.
 * @returns True when `scripts.build` is a string.
 */
export function hasBuild(pkg: WorkspacePackage): boolean {
    return typeof pkg.manifest.scripts?.["build"] === "string";
}
