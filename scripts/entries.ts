import path from "path";
import { glob } from "glob";

export interface BuildEntriesOptions {
	ignore?: string[];
	stripPrefix?: string; // prefix to remove from key generation
	lowercase?: boolean; // default true
	extensions?: string[]; // default ['.ts'] used for key stripping
}

/**
 * Build a Vite library multi-entry map from a glob pattern relative to a base directory.
 * Mirrors previous per-package logic (lowercase keys, strip src/ and .ts).
 *
 * @param pattern   Glob pattern relative to baseDir
 * @param baseDir   Root directory to resolve the glob from (typically the package root).
 */
export function buildEntries(
	pattern: string,
	baseDir: string,
	options: BuildEntriesOptions = {},
): Record<string, string> {
	const {
		ignore = ["src/**/*.d.ts"],
		stripPrefix = "src/",
		lowercase = true,
		extensions = [".ts"],
	} = options;

	const files = glob.sync(pattern, { cwd: baseDir, ignore });

	const entries: Record<string, string> = {};
	for (const rel of files) {
		let key = rel;
		if (stripPrefix && key.startsWith(stripPrefix)) {
			key = key.slice(stripPrefix.length);
		}
		for (const ext of extensions) {
			if (key.endsWith(ext)) {
				key = key.slice(0, -ext.length);
				break;
			}
		}
		if (lowercase) key = key.toLowerCase();
		entries[key] = path.join(baseDir, rel);
	}
	return entries;
}

/** Convenience for vite configs inside a package directory. */
export function buildPackageEntries(
	pattern: string,
	importMetaUrl: string,
	options?: BuildEntriesOptions,
) {
	const baseDir = path.dirname(new URL(importMetaUrl).pathname);
	return buildEntries(pattern, baseDir, options);
}
