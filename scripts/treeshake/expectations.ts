import type { BundlerName } from "./bundlers.ts";

export interface KeptDrop {
    /** Bundlers that keep residue after the unused call is dropped. */
    bundlers: BundlerName[];
    reason: string;
}

const EXPORT_LIST =
    "Rolldown 1.3.2 honours the annotation only on an inline export, so an export list keeps the helper's side-effectful dependency";
const RSPACK_LIST =
    "Rspack 2.3.3 shows the same residue through an export list";
const COLLECTION_CLASS =
    "the Collection class and the helpers it references stay after the call is dropped";

const BOTH: BundlerName[] = ["rolldown", "rspack"];

function entries(
    specifier: string,
    names: string[],
    reason: string,
): Record<string, KeptDrop> {
    return Object.fromEntries(
        names.map((name) => [
            `${specifier}:${name}`,
            { bundlers: BOTH, reason: `${reason}; ${RSPACK_LIST}` },
        ]),
    );
}

/**
 * Pure names whose unused module-level call still leaves code behind in some bundlers, keyed `<specifier>:<name>`.
 * These are measured expectations, not debt: a bundler that starts dropping them fails the check.
 */
export const KEPT_DROPS: Record<string, KeptDrop> = {
    ...entries("@tolki/collection", ["collect"], COLLECTION_CLASS),
    ...entries("@tolki/str", ["uuid", "uuid7"], `${EXPORT_LIST} (uuid)`),
    ...entries("@tolki/str", ["ulid"], `${EXPORT_LIST} (ulid)`),
    ...entries(
        "@tolki/str",
        [
            "counted",
            "isPlural",
            "isSingular",
            "matchCase",
            "plural",
            "pluralPascal",
            "pluralStudly",
            "singular",
            "uncountable",
        ],
        `${EXPORT_LIST} (pluralize)`,
    ),
    ...entries(
        "@tolki/str",
        ["markdown", "inlineMarkdown", "markDownRenderer"],
        `${EXPORT_LIST} (markdown-it)`,
    ),
    ...entries(
        "@tolki/str",
        ["ascii", "slug"],
        `${EXPORT_LIST} (transliteration)`,
    ),
    ...entries(
        "@tolki/str",
        ["of", "str"],
        `${EXPORT_LIST} (Stringable pulls every dependency)`,
    ),
};
