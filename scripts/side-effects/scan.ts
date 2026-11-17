import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import ts from "typescript";

import {
    aliasExportOf,
    localFunctionNames,
    unwrapAliasTarget,
} from "./alias.ts";

export type SideEffectCategory =
    | "mutates"
    | "state"
    | "callback"
    | "asserts"
    | "io";

export const SIDE_EFFECT_CATEGORIES: readonly SideEffectCategory[] = [
    "mutates",
    "state",
    "callback",
    "asserts",
    "io",
];

export type ExportKind = "pure" | "impure" | "class" | "unclassified";

export interface ExportEntry {
    pkg: string;
    file: string;
    name: string;
    line: number;
    kind: ExportKind;
    category: SideEffectCategory | null;
}

export type PlacementProblemKind =
    | "annotation-on-overload"
    | "annotation-in-jsdoc"
    | "annotation-not-adjacent"
    | "annotated-and-tagged"
    | "unknown-category"
    | "annotated-arrow";

export type ModuleScopeProblemKind =
    | "unannotated-call"
    | "spread-argument"
    | "top-level-statement";

export interface Problem<TKind extends string> {
    file: string;
    line: number;
    name: string;
    kind: TKind;
}

export interface SourceScan {
    exports: ExportEntry[];
    placement: Problem<PlacementProblemKind>[];
    moduleScope: Problem<ModuleScopeProblemKind>[];
}

const ANNOTATION = /^\/\*\s*[@#]__NO_SIDE_EFFECTS__\s*\*\/$/;
const ANNOTATION_MENTION = /[@#]__NO_SIDE_EFFECTS__/;

interface TagReading {
    present: boolean;
    category: SideEffectCategory | null;
    unknown: boolean;
}

interface Analysis {
    kind: ExportKind;
    category: SideEffectCategory | null;
    line: number;
    problems: PlacementProblemKind[];
}

function hasExportModifier(node: ts.Node): boolean {
    return (
        ts.canHaveModifiers(node) &&
        (ts.getModifiers(node) ?? []).some(
            (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        )
    );
}

function lineOf(sourceFile: ts.SourceFile, node: ts.Node): number {
    return (
        sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
            .line + 1
    );
}

function leadingComments(
    sourceFile: ts.SourceFile,
    node: ts.Node,
): { text: string; isJsDoc: boolean }[] {
    const text = sourceFile.text;

    return (ts.getLeadingCommentRanges(text, node.getFullStart()) ?? []).map(
        (range) => {
            const comment = text.slice(range.pos, range.end);

            return { text: comment, isJsDoc: comment.startsWith("/**") };
        },
    );
}

/**
 * Reads the `@sideEffects` tag of a declaration's docblock.
 */
function readTag(node: ts.Node): TagReading {
    const tag = ts
        .getJSDocTags(node)
        .find((candidate) => candidate.tagName.text === "sideEffects");

    if (tag === undefined) {
        return { present: false, category: null, unknown: false };
    }

    const word =
        (ts.getTextOfJSDocComment(tag.comment) ?? "").trim().split(/\s+/)[0] ??
        "";
    const category = SIDE_EFFECT_CATEGORIES.find((known) => known === word);

    return {
        present: true,
        category: category ?? null,
        unknown: category === undefined,
    };
}

/**
 * Classifies one function name from all of its declarations.
 */
function analyzeFunction(
    sourceFile: ts.SourceFile,
    declarations: ts.FunctionDeclaration[],
): Analysis {
    const [first] = declarations as [ts.FunctionDeclaration];
    const implementation =
        declarations.find((declaration) => declaration.body !== undefined) ??
        first;
    const problems: PlacementProblemKind[] = [];

    for (const declaration of declarations) {
        const comments = leadingComments(sourceFile, declaration);
        const last = comments.at(-1);
        const isImplementation = declaration === implementation;

        if (
            comments.some(
                (comment) =>
                    comment.isJsDoc && ANNOTATION_MENTION.test(comment.text),
            )
        ) {
            problems.push("annotation-in-jsdoc");
        }

        if (
            !isImplementation &&
            last !== undefined &&
            ANNOTATION.test(last.text)
        ) {
            problems.push("annotation-on-overload");
        }

        if (
            isImplementation &&
            last !== undefined &&
            !ANNOTATION.test(last.text) &&
            comments.some((comment) => ANNOTATION.test(comment.text))
        ) {
            problems.push("annotation-not-adjacent");
        }
    }

    const implementationLast = leadingComments(sourceFile, implementation).at(
        -1,
    );
    const annotated =
        implementationLast !== undefined &&
        ANNOTATION.test(implementationLast.text);
    const tag = readTag(first);
    const line = lineOf(sourceFile, implementation);

    if (tag.unknown) {
        problems.push("unknown-category");
    }

    if (annotated && tag.present) {
        problems.push("annotated-and-tagged");
    }

    if (problems.length > 0) {
        return { kind: "unclassified", category: null, line, problems };
    }

    if (annotated) {
        return { kind: "pure", category: null, line, problems };
    }

    if (tag.present) {
        return { kind: "impure", category: tag.category, line, problems };
    }

    return { kind: "unclassified", category: null, line, problems };
}

const PURE_ANNOTATION = /^\/\*\s*[@#]__PURE__\s*\*\/$/;

function isPureAnnotated(sourceFile: ts.SourceFile, node: ts.Node): boolean {
    // Bundlers apply the annotation to the outermost call at that position only.
    const start = node.getStart(sourceFile);

    for (
        let parent = node.parent;
        parent.getStart(sourceFile) === start;
        parent = parent.parent
    ) {
        if (
            ts.isCallExpression(parent) ||
            ts.isNewExpression(parent) ||
            ts.isTaggedTemplateExpression(parent)
        ) {
            return false;
        }
    }

    // Same-line comments are trailing trivia of the previous token, so read the raw gap.
    const gap = sourceFile.text.slice(
        node.getFullStart(),
        node.getStart(sourceFile),
    );
    const trimmed = gap.trimEnd();
    const last = trimmed.endsWith("*/")
        ? trimmed.slice(trimmed.lastIndexOf("/*"))
        : "";

    return PURE_ANNOTATION.test(last);
}

/**
 * Finds every call evaluated while the module loads, never entering function bodies.
 */
function scanModuleScope(
    file: string,
    sourceFile: ts.SourceFile,
    report: Problem<ModuleScopeProblemKind>[],
): void {
    const add = (node: ts.Node, kind: ModuleScopeProblemKind): void => {
        report.push({
            file,
            line: lineOf(sourceFile, node),
            name: node.getText(sourceFile).split("\n")[0]!.slice(0, 60),
            kind,
        });
    };

    const visitClass = (node: ts.ClassLikeDeclaration): void => {
        for (const clause of node.heritageClauses ?? []) {
            for (const type of clause.types) {
                visit(type.expression);
            }
        }

        for (const member of node.members) {
            if (
                member.name !== undefined &&
                ts.isComputedPropertyName(member.name)
            ) {
                visit(member.name);
            }

            if (ts.isClassStaticBlockDeclaration(member)) {
                visit(member.body);
            } else if (
                ts.isPropertyDeclaration(member) &&
                member.initializer !== undefined &&
                ts
                    .getModifiers(member)
                    ?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword)
            ) {
                visit(member.initializer);
            }
        }
    };

    const visit = (node: ts.Node): void => {
        if (ts.isTypeNode(node)) {
            return;
        }

        if (ts.isClassLike(node)) {
            visitClass(node);

            return;
        }

        if (ts.isFunctionLike(node)) {
            if (
                node.name !== undefined &&
                ts.isComputedPropertyName(node.name)
            ) {
                visit(node.name);
            }

            return;
        }

        if (
            ts.isCallExpression(node) ||
            ts.isNewExpression(node) ||
            ts.isTaggedTemplateExpression(node)
        ) {
            if (!isPureAnnotated(sourceFile, node)) {
                add(node, "unannotated-call");
            }

            const args =
                ts.isCallExpression(node) || ts.isNewExpression(node)
                    ? (node.arguments ?? [])
                    : [];

            if (args.some((argument) => ts.isSpreadElement(argument))) {
                add(node, "spread-argument");
            }
        }

        ts.forEachChild(node, visit);
    };

    for (const statement of sourceFile.statements) {
        if (ts.isVariableStatement(statement)) {
            for (const declaration of statement.declarationList.declarations) {
                if (declaration.initializer !== undefined) {
                    visit(declaration.initializer);
                }
            }
        } else if (ts.isExpressionStatement(statement)) {
            add(statement, "top-level-statement");
        } else if (ts.isExportAssignment(statement)) {
            visit(statement.expression);
        } else if (ts.isClassDeclaration(statement)) {
            visitClass(statement);
        } else if (ts.isEnumDeclaration(statement)) {
            for (const member of statement.members) {
                if (member.initializer !== undefined) {
                    visit(member.initializer);
                }
            }
        } else if (
            ts.isIfStatement(statement) ||
            ts.isBlock(statement) ||
            ts.isTryStatement(statement) ||
            ts.isForStatement(statement) ||
            ts.isForOfStatement(statement) ||
            ts.isForInStatement(statement) ||
            ts.isWhileStatement(statement) ||
            ts.isSwitchStatement(statement)
        ) {
            add(statement, "top-level-statement");
        }
    }
}

/**
 * Scans one source file for exported functions and their side-effect marks.
 *
 * @param file - Path reported on every entry and problem.
 * @param source - The file's text.
 * @param pkg - Name of the package that owns the file.
 * @returns The classified exports and any placement problems.
 */
export function scanFile(
    file: string,
    source: string,
    pkg: string,
): SourceScan {
    const sourceFile = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );
    const result: SourceScan = { exports: [], placement: [], moduleScope: [] };
    const groups = new Map<string, ts.FunctionDeclaration[]>();
    const localFunctions = localFunctionNames(sourceFile);

    for (const statement of sourceFile.statements) {
        if (ts.isFunctionDeclaration(statement) && statement.name) {
            const group = groups.get(statement.name.text) ?? [];

            group.push(statement);
            groups.set(statement.name.text, group);
        }
    }

    const analyses = new Map<string, Analysis>();
    const problemReported = new Set<string>();

    const analysisOf = (name: string): Analysis | undefined => {
        const declarations = groups.get(name);

        if (declarations === undefined) {
            return undefined;
        }

        let analysis = analyses.get(name);

        if (analysis === undefined) {
            analysis = analyzeFunction(sourceFile, declarations);
            analyses.set(name, analysis);
        }

        if (!problemReported.has(name)) {
            problemReported.add(name);

            for (const kind of analysis.problems) {
                result.placement.push({
                    file,
                    line: analysis.line,
                    name,
                    kind,
                });
            }
        }

        return analysis;
    };

    const push = (
        name: string,
        line: number,
        kind: ExportKind,
        category: SideEffectCategory | null,
    ): void => {
        result.exports.push({ pkg, file, name, line, kind, category });
    };

    const pushListed = (exported: string, local: string): void => {
        const analysis = analysisOf(local);

        if (analysis !== undefined) {
            push(exported, analysis.line, analysis.kind, analysis.category);
        }
    };

    for (const statement of sourceFile.statements) {
        if (
            ts.isExportDeclaration(statement) &&
            statement.moduleSpecifier === undefined &&
            !statement.isTypeOnly &&
            statement.exportClause !== undefined &&
            ts.isNamedExports(statement.exportClause)
        ) {
            for (const specifier of statement.exportClause.elements) {
                if (!specifier.isTypeOnly) {
                    pushListed(
                        specifier.name.text,
                        (specifier.propertyName ?? specifier.name).text,
                    );
                }
            }

            continue;
        }

        if (
            ts.isExportAssignment(statement) &&
            !statement.isExportEquals &&
            ts.isIdentifier(statement.expression)
        ) {
            pushListed("default", statement.expression.text);

            continue;
        }

        if (!hasExportModifier(statement)) {
            continue;
        }

        if (ts.isClassDeclaration(statement) && statement.name) {
            push(
                statement.name.text,
                lineOf(sourceFile, statement),
                "class",
                null,
            );
        } else if (ts.isFunctionDeclaration(statement) && statement.name) {
            const name = statement.name.text;
            const first = groups.get(name)?.[0];

            if (first === statement) {
                const analysis = analysisOf(name)!;

                push(name, analysis.line, analysis.kind, analysis.category);
            }
        } else if (ts.isVariableStatement(statement)) {
            scanVariableStatement(statement);
        }
    }

    function scanVariableStatement(statement: ts.VariableStatement): void {
        for (const declaration of statement.declarationList.declarations) {
            if (
                !ts.isIdentifier(declaration.name) ||
                !declaration.initializer
            ) {
                continue;
            }

            const name = declaration.name.text;
            const line = lineOf(sourceFile, declaration);
            const initializer = unwrapAliasTarget(declaration.initializer);

            if (
                ts.isArrowFunction(initializer) ||
                ts.isFunctionExpression(initializer)
            ) {
                if (
                    leadingComments(sourceFile, statement).some((comment) =>
                        ANNOTATION.test(comment.text),
                    )
                ) {
                    result.placement.push({
                        file,
                        line,
                        name,
                        kind: "annotated-arrow",
                    });
                }

                push(name, line, "unclassified", null);
            } else if (ts.isIdentifier(initializer)) {
                // Only the alias shape the data build rewrites ships its declaration, and with it the annotation.
                if (aliasExportOf(statement, localFunctions) === null) {
                    push(name, line, "unclassified", null);
                } else {
                    scanAlias(statement, name, line, initializer.text);
                }
            } else if (
                ts.isCallExpression(initializer) &&
                ts.isIdentifier(initializer.expression) &&
                initializer.expression.text === "dispatch"
            ) {
                push(name, line, "unclassified", null);
            }
        }
    }

    function scanAlias(
        statement: ts.VariableStatement,
        name: string,
        line: number,
        target: string,
    ): void {
        // aliasExportOf accepts only a local function with a body, which `groups` holds.
        const analysis = analysisOf(target)!;
        const aliasTag = readTag(statement);

        if (aliasTag.unknown) {
            result.placement.push({
                file,
                line,
                name,
                kind: "unknown-category",
            });
            push(name, line, "unclassified", null);

            return;
        }

        if (analysis.kind === "pure" && aliasTag.present) {
            result.placement.push({
                file,
                line,
                name,
                kind: "annotated-and-tagged",
            });
            push(name, line, "unclassified", null);

            return;
        }

        if (analysis.kind === "unclassified" && aliasTag.present) {
            push(name, line, "impure", aliasTag.category);

            return;
        }

        push(name, line, analysis.kind, analysis.category);
    }

    scanModuleScope(file, sourceFile, result.moduleScope);

    return result;
}

/**
 * Lists the directories of the packages that publish to npm.
 *
 * @param repoRoot - Absolute path of the repository root.
 * @returns Sorted absolute package directories that are not private and have a build script.
 */
export function publishedPackageDirs(repoRoot: string): string[] {
    const packagesDir = join(repoRoot, "packages");

    return readdirSync(packagesDir)
        .sort()
        .map((entry) => join(packagesDir, entry))
        .filter((dir) => {
            const manifest = join(dir, "package.json");

            if (!existsSync(manifest)) {
                return false;
            }

            const parsed = JSON.parse(readFileSync(manifest, "utf8")) as {
                private?: boolean;
                scripts?: Record<string, string>;
            };

            return (
                parsed.private !== true && parsed.scripts?.build !== undefined
            );
        });
}

function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name))
        .flatMap((entry) => {
            const full = join(dir, entry.name);

            if (entry.isDirectory()) {
                return entry.name === "__tests__" ? [] : sourceFiles(full);
            }

            return entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")
                ? [full]
                : [];
        });
}

/**
 * Scans every `src/**` TypeScript file of every published package.
 *
 * @param repoRoot - Absolute path of the repository root.
 * @returns The merged scan of all published sources.
 */
export function scanPublishedSources(repoRoot: string): SourceScan {
    const merged: SourceScan = { exports: [], placement: [], moduleScope: [] };

    for (const dir of publishedPackageDirs(repoRoot)) {
        const { name } = JSON.parse(
            readFileSync(join(dir, "package.json"), "utf8"),
        ) as { name: string };
        const srcDir = join(dir, "src");

        if (!existsSync(srcDir)) {
            continue;
        }

        for (const file of sourceFiles(srcDir)) {
            const scanned = scanFile(
                relative(repoRoot, file).split("\\").join("/"),
                readFileSync(file, "utf8"),
                name,
            );

            merged.exports.push(...scanned.exports);
            merged.placement.push(...scanned.placement);
            merged.moduleScope.push(...scanned.moduleScope);
        }
    }

    return merged;
}
