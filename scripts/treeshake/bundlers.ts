import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { rspack } from "@rspack/core";
import { build as esbuild } from "esbuild";
import { rolldown } from "rolldown";
import type { Plugin } from "rollup";
import { rollup } from "rollup";
import webpack from "webpack";

export type BundlerName =
    | "rollup"
    | "rolldown"
    | "esbuild"
    | "webpack"
    | "rspack";

export const BUNDLERS: readonly BundlerName[] = [
    "rollup",
    "rolldown",
    "esbuild",
    "webpack",
    "rspack",
];

export interface BundleOptions {
    strict?: boolean;
}

export interface BundleResult {
    code: string;
    ownBytes: Record<string, number> | null;
    missingExports: string[];
}

const OWN_MODULE = /\/node_modules\/@tolki\//;

/** Whether a resolved id is a staged `@tolki` module, on any path separator. */
function isOwnModule(id: string): boolean {
    return OWN_MODULE.test(id.replaceAll("\\", "/"));
}
const PEERS = new Set(["vue", "react", "svelte", "vite"]);

/** Peer dependencies and Node built-ins stay external so a bundle holds only the code under test. */
function isExternal(id: string): boolean {
    return PEERS.has(id) || id.startsWith("svelte/") || id.startsWith("node:");
}

/** The path of a staged module relative to `node_modules/`, or null for any other module. */
function ownKey(path: string): string | null {
    const normalized = path.replaceAll("\\", "/");
    const marker = "node_modules/@tolki/";
    const at = normalized.lastIndexOf(marker);

    return at === -1 ? null : normalized.slice(at + "node_modules/".length);
}

/** Sums each own module's rendered size, keyed relative to `node_modules/`. */
function ownSizes(
    modules: Record<string, { renderedLength: number }>,
): Record<string, number> {
    const sizes: Record<string, number> = {};

    for (const [path, info] of Object.entries(modules)) {
        const key = ownKey(path);

        if (key !== null) {
            sizes[key] = info.renderedLength;
        }
    }

    return sizes;
}

/** Rollup plugin that forces `@tolki` modules side-effectful and every other module side-effect free. */
function strictSideEffects(): Plugin {
    return {
        name: "strict-side-effects",
        async resolveId(source, importer, options) {
            const resolved = await this.resolve(source, importer, {
                ...options,
                skipSelf: true,
            });

            if (resolved === null || resolved.external) {
                return resolved;
            }

            return {
                ...resolved,
                moduleSideEffects: isOwnModule(resolved.id),
            };
        },
    };
}

async function bundleRollup(
    entry: string,
    strict: boolean,
): Promise<BundleResult> {
    const missing: string[] = [];
    const build = await rollup({
        input: entry,
        external: isExternal,
        plugins: [
            ...(strict ? [strictSideEffects()] : []),
            nodeResolve({ browser: true }),
            commonjs(),
        ],
        shimMissingExports: true,
        onLog(_level, log) {
            if (
                (log.code === "MISSING_EXPORT" ||
                    log.code === "SHIMMED_EXPORT") &&
                log.binding
            ) {
                missing.push(log.binding);
            }
        },
    });
    const { output } = await build.generate({ format: "es" });

    await build.close();

    return {
        code: output[0].code,
        ownBytes: ownSizes(output[0].modules),
        missingExports: missing,
    };
}

async function bundleRolldown(
    entry: string,
    strict: boolean,
): Promise<BundleResult> {
    const missing: string[] = [];
    const build = await rolldown({
        input: entry,
        platform: "browser",
        external: isExternal,
        shimMissingExports: true,
        ...(strict
            ? {
                  treeshake: {
                      moduleSideEffects: (id: string) => isOwnModule(id),
                  },
              }
            : {}),
        onLog(_level, log) {
            if (
                (log.code === "MISSING_EXPORT" ||
                    log.code === "SHIMMED_EXPORT") &&
                log.binding
            ) {
                missing.push(log.binding);
            }
        },
    });
    const { output } = await build.generate({ format: "esm", minify: true });
    const chunk = output.find((item) => item.type === "chunk");

    await build.close();

    if (chunk?.type !== "chunk") {
        throw new Error("rolldown produced no chunk");
    }

    return {
        code: chunk.code,
        ownBytes: ownSizes(chunk.modules),
        missingExports: missing,
    };
}

async function bundleEsbuild(entry: string): Promise<BundleResult> {
    const result = await esbuild({
        entryPoints: [entry],
        bundle: true,
        format: "esm",
        // The renamer weighs the text of code it later drops, so mangled names would differ from the control build.
        minifyWhitespace: true,
        minifySyntax: true,
        platform: "browser",
        metafile: true,
        write: false,
        outfile: join(dirname(entry), "out.js"),
        external: ["vue", "react", "svelte", "svelte/*", "vite", "node:*"],
        logLevel: "silent",
    }).catch((error: { errors?: { text: string }[] }) => {
        const missing = (error.errors ?? [])
            .map(
                (item) =>
                    /No matching export in .* for import "(.+)"/.exec(
                        item.text,
                    )?.[1],
            )
            .filter((name): name is string => name !== undefined);

        if (missing.length === 0 || missing.length !== error.errors?.length) {
            throw error;
        }

        return missing;
    });

    if (Array.isArray(result)) {
        return { code: "", ownBytes: {}, missingExports: result };
    }

    const [output] = Object.values(result.metafile.outputs);
    const ownBytes: Record<string, number> = {};

    for (const [path, info] of Object.entries(output.inputs)) {
        const key = ownKey(path);

        if (key !== null) {
            ownBytes[key] = info.bytesInOutput;
        }
    }

    return { code: result.outputFiles[0].text, ownBytes, missingExports: [] };
}

interface PackStats {
    hasErrors(): boolean;
    toJson(options: { all: false; errors: true; warnings: true }): {
        errors?: { message: string }[];
        warnings?: { message: string }[];
    };
}

type Pack = (
    config: object,
    callback: (error: Error | null, stats?: PackStats) => void,
) => void;

/** Builds with webpack or Rspack into a temp dir and reads the bundle back from disk. */
async function bundlePack(entry: string, pack: Pack): Promise<BundleResult> {
    const outDir = mkdtempSync(join(tmpdir(), "treeshake-pack-"));

    try {
        const stats = await new Promise<PackStats>((resolve, reject) => {
            pack(
                {
                    context: dirname(entry),
                    entry,
                    mode: "production",
                    target: "web",
                    devtool: false,
                    optimization: { emitOnErrors: true },
                    output: { path: outDir, filename: "out.js" },
                    externals: [
                        (
                            { request }: { request?: string },
                            done: (error?: Error, result?: string) => void,
                        ) => {
                            // The default `var` type would emit `module.exports = node:path`, which does not parse.
                            done(
                                undefined,
                                request !== undefined && isExternal(request)
                                    ? `commonjs ${request}`
                                    : undefined,
                            );
                        },
                    ],
                },
                (error, result) => {
                    if (error || !result) {
                        reject(error ?? new Error("no stats"));
                    } else {
                        resolve(result);
                    }
                },
            );
        });
        const { errors = [], warnings = [] } = stats.toJson({
            all: false,
            errors: true,
            warnings: true,
        });
        const missingName = (message: string): string | undefined =>
            /export '(.+?)' \(imported as '.+?'\) was not found/.exec(
                message,
            )?.[1];
        const fatal = errors.filter(({ message }) => !missingName(message));

        if (fatal.length > 0) {
            throw new Error(fatal.map((item) => item.message).join("\n"));
        }

        const missing = [...errors, ...warnings]
            .map(({ message }) => missingName(message))
            .filter((name): name is string => name !== undefined);

        return {
            code: readFileSync(join(outDir, "out.js"), "utf8"),
            ownBytes: null,
            missingExports: missing,
        };
    } finally {
        rmSync(outDir, { recursive: true, force: true });
    }
}

/**
 * Bundles an entry with one bundler, minified, with frameworks external.
 *
 * @param entry - Absolute path of the entry module.
 * @param bundler - Which bundler to run.
 * @param options - `strict` forces `@tolki` modules side-effectful and the rest side-effect free.
 * @returns The bundle text, each own module's size where the bundler reports it, and the missing exports.
 */
export async function bundle(
    entry: string,
    bundler: BundlerName,
    options: BundleOptions = {},
): Promise<BundleResult> {
    const strict = options.strict === true;

    if (strict && bundler !== "rollup" && bundler !== "rolldown") {
        throw new Error("strict mode needs rollup or rolldown");
    }

    switch (bundler) {
        case "rollup":
            return bundleRollup(entry, strict);
        case "rolldown":
            return bundleRolldown(entry, strict);
        case "esbuild":
            return bundleEsbuild(entry);
        case "webpack":
            return bundlePack(entry, webpack as unknown as Pack);
        case "rspack":
            return bundlePack(entry, rspack as unknown as Pack);
    }
}
