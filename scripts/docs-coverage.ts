/**
 * Checks the VitePress list pages against the packages: every export and public Collection member
 * has a section, every in-page anchor resolves, and every package tab imports its own package.
 *
 * Reads sources with the TypeScript AST because a TypeScript `private` method still exists at runtime.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { parseFences, parseHeadings } from "./docs-markdown.ts";

export type CoverageIssue =
    | { kind: "missing"; page: string; owner: string; name: string }
    | { kind: "anchor"; page: string; slug: string; line: number }
    | {
          kind: "fence";
          page: string;
          title: string;
          module: string;
          line: number;
      };

type PackageName = "arr" | "obj" | "data";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS_ROOT = path.join(ROOT, "docs", "vitepress");
const UTILITIES_PAGE = "arrays-objects/utilities-list.md";
const METHODS_PAGE = "collections/methods-list.md";
const PACKAGES: PackageName[] = ["arr", "obj", "data"];

/**
 * Parses a source file from the repo.
 *
 * @param relativePath - The path from the repo root.
 * @returns The parsed source file.
 */
function readSource(relativePath: string): ts.SourceFile {
    return ts.createSourceFile(
        relativePath,
        readFileSync(path.join(ROOT, relativePath), "utf8"),
        ts.ScriptTarget.ES2022,
        true,
    );
}

/**
 * Lists a package's top-level exported functions and constants.
 *
 * @param pkg - The package short name.
 * @returns The export names, once each, in source order.
 */
export function listPackageExports(pkg: PackageName): string[] {
    const names = new Set<string>();

    for (const statement of readSource(`packages/${pkg}/src/${pkg}.ts`)
        .statements) {
        const exported = ts
            .getModifiers(statement as ts.HasModifiers)
            ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

        if (exported !== true) {
            continue;
        }

        if (ts.isFunctionDeclaration(statement) && statement.name) {
            names.add(statement.name.text);
        } else if (ts.isVariableStatement(statement)) {
            for (const declaration of statement.declarationList.declarations) {
                if (ts.isIdentifier(declaration.name)) {
                    names.add(declaration.name.text);
                }
            }
        }
    }

    return [...names];
}

/**
 * Reads a class member's name, spelling a computed `[Symbol.x]` as `Symbol.x`.
 *
 * @param name - The member's name node.
 * @returns The name, or null for a kind of name the docs never use.
 */
function memberName(name: ts.PropertyName): string | null {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
        return name.text;
    }

    if (ts.isComputedPropertyName(name)) {
        return name.expression.getText();
    }

    return null;
}

/**
 * Lists the public methods and getters of `class Collection`, statics included.
 *
 * @returns The member names, once each, in source order.
 */
export function listCollectionMembers(): string[] {
    const names = new Set<string>();
    const source = readSource("packages/collection/src/collection.ts");

    for (const statement of source.statements) {
        if (
            !ts.isClassDeclaration(statement) ||
            statement.name?.text !== "Collection"
        ) {
            continue;
        }

        for (const member of statement.members) {
            if (!ts.isMethodDeclaration(member) && !ts.isGetAccessor(member)) {
                continue;
            }

            const hidden = ts
                .getModifiers(member)
                ?.some(
                    (modifier) =>
                        modifier.kind === ts.SyntaxKind.PrivateKeyword ||
                        modifier.kind === ts.SyntaxKind.ProtectedKeyword,
                );
            const name = memberName(member.name);

            if (hidden !== true && name !== null && !name.startsWith("#")) {
                names.add(name);
            }
        }
    }

    return [...names];
}

/**
 * Reads the modules and original names a code block imports.
 *
 * @param code - The code block source.
 * @returns Each imported module with the export names taken from it.
 */
function importsOf(code: string): Map<string, Set<string>> {
    const result = new Map<string, Set<string>>();
    const source = ts.createSourceFile(
        "block.ts",
        code,
        ts.ScriptTarget.ES2022,
        true,
    );

    for (const statement of source.statements) {
        if (
            !ts.isImportDeclaration(statement) ||
            !ts.isStringLiteral(statement.moduleSpecifier)
        ) {
            continue;
        }

        const module = statement.moduleSpecifier.text;
        const names = result.get(module) ?? new Set<string>();
        const bindings = statement.importClause?.namedBindings;

        if (bindings !== undefined && ts.isNamedImports(bindings)) {
            for (const element of bindings.elements) {
                names.add((element.propertyName ?? element.name).text);
            }
        }

        result.set(module, names);
    }

    return result;
}

/**
 * Collects, per tab title, the names a tab imports from the package it is titled after.
 *
 * @param markdown - The page source.
 * @returns A map from `@tolki/x` to the names imported from `"@tolki/x"` in tabs with that title.
 */
export function importedNames(markdown: string): Map<string, Set<string>> {
    const result = new Map<string, Set<string>>();

    for (const fence of parseFences(markdown)) {
        if (fence.title === null || !fence.title.startsWith("@tolki/")) {
            continue;
        }

        const names = result.get(fence.title) ?? new Set<string>();

        for (const name of importsOf(fence.code).get(fence.title) ?? []) {
            names.add(name);
        }

        result.set(fence.title, names);
    }

    return result;
}

/**
 * Finds in-page links whose anchor has no heading.
 *
 * @param markdown - The page source.
 * @param page - The page path to put in each issue.
 * @returns One issue per broken link.
 */
export function brokenAnchors(markdown: string, page: string): CoverageIssue[] {
    const slugs = new Set(
        parseHeadings(markdown).map((heading) => heading.slug),
    );
    const inFence = new Set<number>();
    const issues: CoverageIssue[] = [];

    for (const fence of parseFences(markdown)) {
        const count = fence.code === "" ? 0 : fence.code.split("\n").length;

        for (let line = fence.line; line <= fence.line + count + 1; line++) {
            inFence.add(line);
        }
    }

    for (const [index, text] of markdown.split("\n").entries()) {
        if (inFence.has(index + 1)) {
            continue;
        }

        for (const match of text.matchAll(/\]\(#([^)\s]*)\)/g)) {
            const slug = match[1] as string;

            if (!slugs.has(slug) && !slugs.has(decodeURIComponent(slug))) {
                issues.push({ kind: "anchor", page, slug, line: index + 1 });
            }
        }
    }

    return issues;
}

/**
 * Finds package tabs that import from a different `@tolki/*` module.
 *
 * @param markdown - The page source.
 * @param page - The page path to put in each issue.
 * @returns One issue per foreign module a tab imports.
 */
export function mismatchedVariantFences(
    markdown: string,
    page: string,
): CoverageIssue[] {
    const issues: CoverageIssue[] = [];

    for (const fence of parseFences(markdown)) {
        if (fence.title === null || !fence.title.startsWith("@tolki/")) {
            continue;
        }

        for (const module of importsOf(fence.code).keys()) {
            if (module.startsWith("@tolki/") && module !== fence.title) {
                issues.push({
                    kind: "fence",
                    page,
                    title: fence.title,
                    module,
                    line: fence.line,
                });
            }
        }
    }

    return issues;
}

/**
 * Reads a docs page.
 *
 * @param page - The page path relative to `docs/vitepress/`.
 * @returns The source, or null when the page does not exist yet.
 */
function readPage(page: string): string | null {
    const file = path.join(DOCS_ROOT, page);

    return existsSync(file) ? readFileSync(file, "utf8") : null;
}

/**
 * Tells whether `--only` selects a name: the export itself, or for data the name without its prefix.
 *
 * @param only - The requested names, or undefined for all.
 * @param owner - The package short name or `collection`.
 * @param name - The export or member name.
 * @returns True when the name is in scope.
 */
function selected(
    only: string[] | undefined,
    owner: string,
    name: string,
): boolean {
    if (only === undefined) {
        return true;
    }

    if (only.includes(name)) {
        return true;
    }

    return (
        owner === "data" &&
        name.startsWith("data") &&
        only.includes(name.charAt(4).toLowerCase() + name.slice(5))
    );
}

/**
 * Checks both list pages, their anchors and their tabs.
 *
 * @param options - `only` limits `missing` issues to those names.
 * @returns Every issue found.
 */
export function coverageReport(
    options: { only?: string[] } = {},
): CoverageIssue[] {
    const issues: CoverageIssue[] = [];
    const utilities = readPage(UTILITIES_PAGE);
    const methods = readPage(METHODS_PAGE);
    const documented =
        utilities === null
            ? new Map<string, Set<string>>()
            : importedNames(utilities);
    const headings = new Set(
        methods === null
            ? []
            : parseHeadings(methods)
                  .filter((heading) => heading.level === 3)
                  .map((heading) => heading.text),
    );

    for (const pkg of PACKAGES) {
        for (const name of listPackageExports(pkg)) {
            if (
                selected(options.only, pkg, name) &&
                !documented.get(`@tolki/${pkg}`)?.has(name)
            ) {
                issues.push({
                    kind: "missing",
                    page: UTILITIES_PAGE,
                    owner: pkg,
                    name,
                });
            }
        }
    }

    for (const name of listCollectionMembers()) {
        if (selected(options.only, "collection", name) && !headings.has(name)) {
            issues.push({
                kind: "missing",
                page: METHODS_PAGE,
                owner: "collection",
                name,
            });
        }
    }

    for (const [page, markdown] of [
        [UTILITIES_PAGE, utilities],
        [METHODS_PAGE, methods],
    ] as const) {
        if (markdown !== null) {
            issues.push(
                ...brokenAnchors(markdown, page),
                ...mismatchedVariantFences(markdown, page),
            );
        }
    }

    return issues;
}

/**
 * Formats an issue as one CLI line.
 *
 * @param issue - The issue.
 * @returns The line to print.
 */
function formatIssue(issue: CoverageIssue): string {
    switch (issue.kind) {
        case "missing":
            return `missing ${issue.page} ${issue.owner} ${issue.name}`;
        case "anchor":
            return `anchor ${issue.page}:${issue.line} #${issue.slug}`;
        case "fence":
            return `fence ${issue.page}:${issue.line} ${issue.title} imports ${issue.module}`;
    }
}

/**
 * Runs the CLI: prints one line per issue and exits 1 if there were any.
 *
 * @param argv - The arguments after the script path.
 */
function main(argv: string[]): void {
    const flag = argv.indexOf("--only");
    const only =
        flag === -1
            ? undefined
            : (argv[flag + 1] ?? "").split(",").filter((name) => name !== "");
    const issues = coverageReport({ only });

    for (const issue of issues) {
        console.log(formatIssue(issue));
    }

    process.exitCode = issues.length > 0 ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main(process.argv.slice(2));
}
