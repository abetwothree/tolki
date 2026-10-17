import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const PROBE_DIR = join(ROOT, "scripts/php-parity");
const TRANSCRIPT_DIR = join(ROOT, "docs/php-parity");
const PROBE_PATH =
    /^(Arr|Collection|Helpers|LazyCollection|Number|Php|Str|Stringable)\/[A-Za-z_][\w-]*\.php$/;

/**
 * Every file under a directory, as forward-slash paths relative to it.
 *
 * @param dir - The directory to walk.
 * @returns The relative paths, sorted.
 */
function filesUnder(dir: string): string[] {
    const found: string[] = [];

    const walk = (relative: string): void => {
        for (const entry of readdirSync(join(dir, relative))) {
            const path = relative === "" ? entry : `${relative}/${entry}`;

            if (statSync(join(dir, path)).isDirectory()) {
                walk(path);
            } else {
                found.push(path);
            }
        }
    };

    walk("");

    return found.sort();
}

/**
 * The labels a transcript records, in order.
 *
 * @param path - The transcript's path relative to docs/php-parity.
 * @returns Each probe's label.
 */
function labelsOf(path: string): string[] {
    const { probes } = JSON.parse(
        readFileSync(join(TRANSCRIPT_DIR, path), "utf8"),
    ) as { probes: { label: string }[] };

    return probes.map(({ label }) => label);
}

/**
 * Each run of consecutive comment lines in the packages' TypeScript sources and tests, joined with spaces.
 *
 * @returns One entry per block, with the file it came from.
 */
function commentBlocks(): { file: string; text: string }[] {
    const packagesDir = join(ROOT, "packages");
    const blocks: { file: string; text: string }[] = [];

    for (const pkg of readdirSync(packagesDir)) {
        for (const folder of ["src", "__tests__"]) {
            const dir = join(packagesDir, pkg, folder);

            if (!existsSync(dir)) {
                continue;
            }

            for (const path of filesUnder(dir).filter((file) =>
                file.endsWith(".ts"),
            )) {
                const file = `packages/${pkg}/${folder}/${path}`;
                let run: string[] = [];

                for (const line of [
                    ...readFileSync(join(ROOT, file), "utf8").split("\n"),
                    "",
                ]) {
                    const trimmed = line.trim();

                    if (/^(\/\/|\/\*|\*)/.test(trimmed)) {
                        run.push(trimmed);
                    } else if (run.length > 0) {
                        blocks.push({ file, text: run.join(" ") });
                        run = [];
                    }
                }
            }
        }
    }

    return blocks;
}

const CITED_PATH = /docs\/php-parity\/([\w-]+\/[\w-]+\.json)/g;

const DOCS_FIXTURES = "scripts/__tests__/fixtures/php-parity-citations";
const DOCS_CITATION_ROOTS = [
    "docs/vitepress/arrays-objects",
    "docs/vitepress/collections",
];

/**
 * Each HTML comment in the Markdown under the given roots that names a transcript.
 *
 * @param roots - Directories relative to the repo root; a missing one holds nothing.
 * @returns One entry per comment, with its whitespace collapsed and its path relative to its root.
 */
function docsCitationComments(
    roots: string[],
): { file: string; text: string }[] {
    return roots.flatMap((root) => {
        const dir = join(ROOT, root);

        if (!existsSync(dir)) {
            return [];
        }

        return filesUnder(dir)
            .filter((file) => file.endsWith(".md"))
            .flatMap((file) =>
                [
                    ...readFileSync(join(dir, file), "utf8").matchAll(
                        /<!--([\s\S]*?)-->/g,
                    ),
                ]
                    .map(([comment]) => comment.replace(/\s+/g, " "))
                    .filter((text) => text.includes("docs/php-parity/"))
                    .filter((text) => [...text.matchAll(CITED_PATH)].length > 0)
                    .map((text) => ({ file, text })),
            );
    });
}

describe("php-parity layout", () => {
    it("keeps each probe script in a class or topic folder", () => {
        const scripts = filesUnder(PROBE_DIR).filter(
            (path) =>
                path.endsWith(".php") &&
                path !== "bootstrap.php" &&
                path !== "shared.php",
        );

        expect(scripts.length).toBeGreaterThan(0);
        expect(scripts.filter((path) => !PROBE_PATH.test(path))).toEqual([]);
    });

    it("records one transcript per probe script, and none without a script", () => {
        const scripts = filesUnder(PROBE_DIR)
            .filter((path) => PROBE_PATH.test(path))
            .map((path) => path.replace(/\.php$/, ""));
        const transcripts = filesUnder(TRANSCRIPT_DIR)
            .filter((path) => path !== ".gitkeep")
            .map((path) => path.replace(/\.json$/, ""));

        expect(transcripts).toEqual(scripts);
    });

    it("gives each probe in a transcript its own label", () => {
        const repeated = filesUnder(TRANSCRIPT_DIR)
            .filter((path) => path.endsWith(".json"))
            .flatMap((path) => {
                const labels = labelsOf(path);

                return labels
                    .filter((label, i) => labels.indexOf(label) !== i)
                    .map((label) => `${path}: ${label}`);
            });

        expect(repeated).toEqual([]);
    });
});

/**
 * Every citation in the packages' comments and in the docs' HTML comments.
 *
 * @returns One entry per comment block.
 */
function allCitations(): { file: string; text: string }[] {
    return [...commentBlocks(), ...docsCitationComments(DOCS_CITATION_ROOTS)];
}

/**
 * The transcripts a docs citation names that do not exist.
 *
 * @param roots - Directories relative to the repo root.
 * @returns `file: path` for each missing transcript.
 */
function missingDocsTranscripts(roots: string[]): string[] {
    return docsCitationComments(roots).flatMap(({ file, text }) =>
        [...text.matchAll(CITED_PATH)]
            .map(([, path]) => path)
            .filter((path) => !existsSync(join(TRANSCRIPT_DIR, path)))
            .map((path) => `${file}: ${path}`),
    );
}

/**
 * The docs citations that name a transcript but quote no label from it.
 *
 * @param citations - The comments to check.
 * @returns The file of each such citation.
 */
function unlabelledDocsCitations(
    citations: { file: string; text: string }[],
): string[] {
    return citations
        .filter(({ text }) => !/"[^"]+"/.test(text))
        .map(({ file }) => file);
}

/**
 * The quoted strings in a docs citation that none of its cited transcripts record.
 *
 * @param roots - Directories relative to the repo root.
 * @returns `file: quoted` for each unrecorded string.
 */
function unrecordedDocsLabels(roots: string[]): string[] {
    return docsCitationComments(roots).flatMap(({ file, text }) => {
        const cited = [...text.matchAll(CITED_PATH)]
            .map(([, path]) => path)
            .filter((path) => existsSync(join(TRANSCRIPT_DIR, path)));

        if (cited.length === 0) {
            return [];
        }

        const recorded = new Set(cited.flatMap(labelsOf));

        return [...text.matchAll(/"([^"]+)"/g)]
            .map(([, quoted]) => quoted)
            .filter((quoted) => !recorded.has(quoted))
            .map((quoted) => `${file}: ${quoted}`);
    });
}

describe("php-parity citations", () => {
    it("cites no retired task-NN transcript", () => {
        const retired = commentBlocks()
            .filter(({ text }) => /\btask-\d\d\b/.test(text))
            .map(({ file }) => file);

        expect(retired).toEqual([]);
    });

    it("cites only transcripts that exist", () => {
        const missing = allCitations().flatMap(({ file, text }) =>
            [...text.matchAll(CITED_PATH)]
                .map(([, path]) => path)
                .filter((path) => !existsSync(join(TRANSCRIPT_DIR, path)))
                .map((path) => `${file}: ${path}`),
        );

        expect(missing).toEqual([]);
    });

    it("cites only labels the cited transcripts record", () => {
        const everyLabel = new Set(
            filesUnder(TRANSCRIPT_DIR)
                .filter((path) => path.endsWith(".json"))
                .flatMap(labelsOf),
        );
        const wrong = allCitations().flatMap(({ file, text }) => {
            const cited = [...text.matchAll(CITED_PATH)]
                .map(([, path]) => path)
                .filter((path) => existsSync(join(TRANSCRIPT_DIR, path)));

            if (cited.length === 0) {
                return [];
            }

            const recorded = new Set(cited.flatMap(labelsOf));

            return [...text.matchAll(/"([^"]+)"/g)]
                .map(([, quoted]) => quoted)
                .filter(
                    (quoted) => everyLabel.has(quoted) && !recorded.has(quoted),
                )
                .map((quoted) => `${file}: ${quoted}`);
        });

        expect(wrong).toEqual([]);
    });
    it("reads citations from markdown HTML comments", () => {
        const found = docsCitationComments([DOCS_FIXTURES]);

        expect(found).toEqual([
            {
                file: "bad.md",
                text: '<!-- docs/php-parity/Collection/chunkk.json, "collection-chunk-zero" -->',
            },
            {
                file: "bad.md",
                text: '<!-- docs/php-parity/Collection/chunk.json, "collection-chunk-made-up" -->',
            },
            {
                file: "good.md",
                text: '<!-- docs/php-parity/Collection/chunk.json, "collection-chunk-last-chunk-keys" -->',
            },
        ]);
    });

    it("finds nothing under a directory that does not exist", () => {
        expect(docsCitationComments(["docs/vitepress/missing"])).toEqual([]);
    });

    it("docs citations quote only labels the cited transcripts record", () => {
        expect(unrecordedDocsLabels([DOCS_FIXTURES])).toEqual([
            "bad.md: collection-chunk-made-up",
        ]);
        expect(unrecordedDocsLabels(DOCS_CITATION_ROOTS)).toEqual([]);
    });

    it("docs citations quote at least one label", () => {
        const naming = {
            file: "x.md",
            text: "<!-- docs/php-parity/Collection/chunk.json -->",
        };

        expect(unlabelledDocsCitations([naming])).toEqual(["x.md"]);
        expect(
            unlabelledDocsCitations(docsCitationComments([DOCS_FIXTURES])),
        ).toEqual([]);
        expect(
            unlabelledDocsCitations(docsCitationComments(DOCS_CITATION_ROOTS)),
        ).toEqual([]);
    });

    it("docs citations name only transcripts that exist", () => {
        expect(missingDocsTranscripts([DOCS_FIXTURES])).toEqual([
            "bad.md: Collection/chunkk.json",
        ]);
        expect(missingDocsTranscripts(DOCS_CITATION_ROOTS)).toEqual([]);
    });
});
