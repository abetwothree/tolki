import { spawnSync } from "node:child_process";
import {
    existsSync,
    mkdirSync,
    readFileSync,
    realpathSync,
    rmSync,
    symlinkSync,
} from "node:fs";
import { dirname, join } from "node:path";

import { publishedSubpaths } from "./manifest.ts";
import type { PackageJson, WorkspacePackage } from "./workspace.ts";
import { hasBuild, isPublished, workspacePackages } from "./workspace.ts";

export interface PackedPackage {
    name: string;
    dir: string;
    root: string;
    tarball: string;
    manifest: PackageJson;
    subpaths: string[];
}

/** The executable and leading arguments that run pnpm, preferring the pnpm that started this script. */
function pnpmCommand(): { command: string; args: string[] } {
    const execPath = process.env["npm_execpath"] ?? "";

    return /pnpm\.c?js$/.test(execPath)
        ? { command: process.execPath, args: [execPath] }
        : { command: "pnpm", args: [] };
}

/** Runs a command, returning stdout; a failure throws with the command's stderr. */
function run(
    command: string,
    args: string[],
    cwd: string,
    env: NodeJS.ProcessEnv = process.env,
): string {
    const result = spawnSync(command, args, {
        cwd,
        env,
        encoding: "utf8",
        shell: command === "pnpm" && process.platform === "win32",
    });

    if (result.status !== 0) {
        throw new Error(
            `${command} ${args.join(" ")} failed in ${cwd}: ${result.error?.message ?? result.stderr}`,
        );
    }

    return result.stdout;
}

/**
 * Packs one package with its lifecycle scripts off.
 *
 * @param pkg - The workspace package.
 * @param tarballs - The directory to write the tarball into.
 * @returns The absolute tarball path.
 */
function packOne(pkg: WorkspacePackage, tarballs: string): string {
    const { command, args } = pnpmCommand();
    const stdout = run(
        command,
        [...args, "pack", "--pack-destination", tarballs, "--json"],
        pkg.dir,
        { ...process.env, npm_config_ignore_scripts: "true" },
    );
    const { filename } = JSON.parse(stdout) as { filename: string };

    return filename;
}

/**
 * Symlinks the third-party dependencies and peers installed beside a package into outModules.
 *
 * @param pkg - The workspace package whose `node_modules` holds the installs.
 * @param outModules - The `node_modules` directory to link into.
 */
export function linkDependencies(
    pkg: WorkspacePackage,
    outModules: string,
): void {
    const deps = [
        ...Object.keys(pkg.manifest.dependencies ?? {}),
        ...Object.keys(pkg.manifest.peerDependencies ?? {}),
    ];

    for (const dep of deps.filter((name) => !name.startsWith("@tolki/"))) {
        const installed = join(pkg.dir, "node_modules", dep);
        const target = join(outModules, dep);

        if (!existsSync(installed) || existsSync(target)) {
            continue;
        }

        mkdirSync(dirname(target), { recursive: true });
        symlinkSync(realpathSync(installed), target);
    }
}

/**
 * Packs every published package into `<outDir>/tarballs` and extracts each into `<outDir>/node_modules/<name>`.
 *
 * @param repoRoot - The repository root holding `packages/`.
 * @param outDir - The throwaway workspace to pack into.
 * @returns One entry per published package, in directory order.
 */
export function packWorkspace(
    repoRoot: string,
    outDir: string,
): PackedPackage[] {
    const tarballs = join(outDir, "tarballs");
    const outModules = join(outDir, "node_modules");
    const packages = workspacePackages(repoRoot).filter(isPublished);

    for (const pkg of packages.filter(hasBuild)) {
        for (const file of pkg.manifest.files ?? []) {
            if (!existsSync(join(pkg.dir, file))) {
                throw new Error(
                    `${pkg.name} has no build output at ${file}; run pnpm build first`,
                );
            }
        }
    }

    mkdirSync(tarballs, { recursive: true });

    return packages.map((pkg) => {
        const tarball = packOne(pkg, tarballs);
        const root = join(outModules, pkg.name);

        rmSync(root, { recursive: true, force: true });
        mkdirSync(root, { recursive: true });
        run(
            "tar",
            ["-xzf", tarball, "-C", root, "--strip-components=1"],
            outDir,
        );
        linkDependencies(pkg, outModules);

        const manifest = JSON.parse(
            readFileSync(join(root, "package.json"), "utf8"),
        ) as PackageJson;

        return {
            name: pkg.name,
            dir: pkg.dir,
            root,
            tarball,
            manifest,
            subpaths: publishedSubpaths(manifest),
        };
    });
}
