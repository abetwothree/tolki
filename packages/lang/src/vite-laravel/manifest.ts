import { readFile } from "node:fs/promises";

import { isArray, isPlainObject, isString } from "@tolki/utils";
import type { Logger } from "vite";

export interface LangExportManifest {
    readonly version: 1;
    readonly locales: readonly string[];
    readonly watch: readonly string[];
    readonly fingerprint: string;
}

const LABEL = "[@tolki/lang]";

/**
 * Check that a value is a list of strings.
 *
 * @param value - The value to check.
 * @returns Whether every entry is a string.
 */
function isStringList(value: unknown): value is readonly string[] {
    return isArray(value) && value.every((entry) => isString(entry));
}

/**
 * Read the exporter's manifest, warning and answering `null` when it is unusable.
 *
 * @param file - The absolute path of `manifest.json`.
 * @param logger - The Vite logger to warn through.
 * @returns The manifest, or `null` when it is missing or invalid.
 */
export async function readManifest(
    file: string,
    logger: Logger,
): Promise<LangExportManifest | null> {
    let parsed: unknown;

    try {
        parsed = JSON.parse(await readFile(file, "utf-8"));
    } catch (error) {
        if (
            error instanceof Error &&
            (error as NodeJS.ErrnoException).code === "ENOENT"
        ) {
            logger.warn(`${LABEL} Manifest not found: ${file}`);

            return null;
        }

        logger.warn(
            `${LABEL} Failed to read manifest: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );

        return null;
    }

    if (!isPlainObject(parsed) || parsed["version"] !== 1) {
        logger.warn(`${LABEL} Manifest is not version 1: ${file}`);

        return null;
    }

    const { locales, watch, fingerprint } = parsed;

    if (
        !isStringList(locales) ||
        !isStringList(watch) ||
        !isString(fingerprint)
    ) {
        logger.warn(
            `${LABEL} Manifest needs string locales, watch and fingerprint entries: ${file}`,
        );

        return null;
    }

    return { version: 1, locales, watch, fingerprint };
}
