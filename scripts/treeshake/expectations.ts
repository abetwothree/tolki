import type { BundlerName } from "./bundlers.ts";

export interface KeptDrop {
    /** Bundlers that keep residue after the unused call is dropped. */
    bundlers: BundlerName[];
    reason: string;
}

const EXPORT_LIST =
    "Rolldown 1.3.2 honours the annotation only on an inline export, so an export list keeps the helper's side-effectful dependency";
const COLLECTION_CLASS =
    "Rolldown 1.3.2 keeps Collection's class cycle after the call is dropped, and Rspack 2.3.3 does the same";

const BOTH: BundlerName[] = ["rolldown", "rspack"];
const CREATE_LANG_RESIDUE =
    "Rspack 2.3.3's default SWC compress leaves the dead annotated @tolki/utils declarations (compareValues, looseEqual, phpIntCast); optimization.minimizer with SWC compress.passes 3 removes them";
const RSPACK: BundlerName[] = ["rspack"];

function entries(
    specifier: string,
    names: string[],
    reason: string,
    bundlers: BundlerName[] = BOTH,
): Record<string, KeptDrop> {
    return Object.fromEntries(
        names.map((name) => [`${specifier}:${name}`, { bundlers, reason }]),
    );
}

/**
 * Pure names whose unused module-level call still leaves code behind in some bundlers, keyed `<specifier>:<name>`.
 * These are measured expectations, not debt: a bundler that starts dropping them fails the check.
 */
export const KEPT_DROPS: Record<string, KeptDrop> = {
    ...entries("@tolki/collection", ["collect"], COLLECTION_CLASS),
    ...entries(
        "@tolki/str",
        ["uuid", "uuid7"],
        `${EXPORT_LIST}, and Rspack 2.3.3 shows the same residue (uuid)`,
    ),
    ...entries(
        "@tolki/str",
        ["ulid"],
        `${EXPORT_LIST}, and Rspack 2.3.3 shows the same residue (ulid)`,
    ),
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
        `${EXPORT_LIST}, and Rspack 2.3.3 shows the same residue (pluralize)`,
    ),
    ...entries(
        "@tolki/str",
        ["markdown", "inlineMarkdown", "markDownRenderer"],
        `${EXPORT_LIST}, and Rspack 2.3.3 shows the same residue (markdown-it)`,
    ),
    ...entries(
        "@tolki/str",
        ["ascii", "slug"],
        `${EXPORT_LIST}, and Rspack 2.3.3 shows the same residue (transliteration)`,
    ),
    ...entries(
        "@tolki/str",
        ["of", "str"],
        `${EXPORT_LIST}, and Rspack 2.3.3 shows the same residue (Stringable pulls every dependency)`,
    ),
    ...entries(
        "@tolki/num",
        ["spell", "spellOrdinal"],
        "Rspack 2.3.3 keeps its chunk-loading runtime for the dynamic `import()` after the call is dropped",
        RSPACK,
    ),
    ...entries("@tolki/lang", ["createLang"], CREATE_LANG_RESIDUE, RSPACK),
    ...entries("@tolki/lang/vue", ["createLang"], CREATE_LANG_RESIDUE, RSPACK),
};
