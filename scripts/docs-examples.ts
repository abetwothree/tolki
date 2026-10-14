/**
 * Compiles the `// =>` assertions in documented examples and runs them against the real packages.
 *
 * Grammar: a `// => <expression>` comment right after an expression statement asserts that
 * statement's value; `// => throws <ErrorName>` asserts the thrown error's `name`. Further
 * `//` lines directly below continue the expected value.
 */
import ts from "typescript";
import { expect } from "vitest";

import type { MarkdownFence } from "./docs-markdown.ts";

export type Shape =
    | { type: "primitive"; value: string }
    | { type: "array"; items: Shape[] }
    | { type: "object"; entries: [string, Shape][] }
    | { type: "map"; entries: [Shape, Shape][] }
    | { type: "set"; values: Shape[] }
    | { type: "date"; iso: string };

export interface CompiledExample {
    file: string;
    line: number;
    body: string;
    modules: string[];
}

const RUNNABLE_LANGS = new Set(["js", "javascript", "ts", "typescript"]);
const ARROW = "// =>";

type AsyncRunner = new (
    ...args: string[]
) => (...values: unknown[]) => Promise<void>;

const AsyncFunction = Object.getPrototypeOf(async () => undefined)
    .constructor as AsyncRunner;

/**
 * Describes a value with everything `toEqual` would ignore: entry order, `-0`, `NaN` and the type of a primitive.
 *
 * @param value - A plain value, array, Map, Set or Date, nested to any depth.
 * @returns A shape that two values share only when they print alike.
 */
export function orderedShape(value: unknown): Shape {
    if (value instanceof Date) {
        return {
            type: "date",
            iso: Number.isNaN(value.getTime())
                ? "Invalid Date"
                : value.toISOString(),
        };
    }

    if (Array.isArray(value)) {
        return { type: "array", items: value.map(orderedShape) };
    }

    if (value instanceof Map) {
        return {
            type: "map",
            entries: [...value].map(([key, item]) => [
                orderedShape(key),
                orderedShape(item),
            ]),
        };
    }

    if (value instanceof Set) {
        return { type: "set", values: [...value].map(orderedShape) };
    }

    if (typeof value === "object" && value !== null) {
        const prototype = Object.getPrototypeOf(value) as unknown;

        if (prototype !== Object.prototype && prototype !== null) {
            throw new TypeError(
                `Cannot compare an instance of ${(value as object).constructor.name}; call .all() or .toArray() first`,
            );
        }

        return {
            type: "object",
            entries: Object.entries(value).map(([key, item]) => [
                key,
                orderedShape(item),
            ]),
        };
    }

    if (typeof value === "function") {
        throw new TypeError(
            "Cannot compare a function; call it and compare the result, or use .all() or .toArray()",
        );
    }

    return { type: "primitive", value: primitiveText(value) };
}

/**
 * Prints a primitive with its type, so `1` and `"1"` differ.
 *
 * @param value - A primitive.
 * @returns The typed text.
 */
function primitiveText(value: unknown): string {
    if (typeof value === "string") {
        return `string:${JSON.stringify(value)}`;
    }

    if (typeof value === "number") {
        return `number:${Object.is(value, -0) ? "-0" : String(value)}`;
    }

    return `${typeof value}:${String(value)}`;
}

/**
 * The 1-based line of a position inside a fence's code.
 *
 * @param code - The fence body.
 * @param position - A character offset in the body.
 * @param fence - The fence, whose opening line precedes the body.
 * @returns The line in the Markdown file.
 */
function fileLine(
    code: string,
    position: number,
    fence: MarkdownFence,
): number {
    return fence.line + code.slice(0, position).split("\n").length;
}

/**
 * Rewrites an import declaration into a read from the loaded-module table.
 *
 * @param node - The import declaration.
 * @returns The replacement statement, or an empty string for a type-only import.
 */
function importStatement(node: ts.ImportDeclaration): string {
    const spec = JSON.stringify(
        (node.moduleSpecifier as ts.StringLiteral).text,
    );
    const clause = node.importClause;

    if (clause === undefined) {
        return "";
    }

    if (clause.isTypeOnly) {
        return "";
    }

    const parts: string[] = [];

    if (clause.name !== undefined) {
        parts.push(`const ${clause.name.text} = __m[${spec}].default;`);
    }

    const bindings = clause.namedBindings;

    if (bindings !== undefined && ts.isNamespaceImport(bindings)) {
        parts.push(`const ${bindings.name.text} = __m[${spec}];`);
    } else if (bindings !== undefined) {
        const named = bindings.elements
            .filter((element) => !element.isTypeOnly)
            .map((element) =>
                element.propertyName === undefined
                    ? element.name.text
                    : `${element.propertyName.text}: ${element.name.text}`,
            );

        if (named.length > 0) {
            parts.push(`const { ${named.join(", ")} } = __m[${spec}];`);
        }
    }

    return parts.join(" ");
}

/**
 * Reads the `// =>` comment run that follows a statement.
 *
 * @param code - The fence body.
 * @param end - Where the statement ends.
 * @returns The expected text and the comment's offset, or null when no assertion follows.
 */
function assertionAfter(
    code: string,
    end: number,
): { expected: string; position: number } | null {
    const ranges = ts.getLeadingCommentRanges(code, end) ?? [];
    const [first] = ranges;

    if (first === undefined || !code.startsWith(ARROW, first.pos)) {
        return null;
    }

    const lines = [code.slice(first.pos + ARROW.length, first.end).trim()];
    let previous = first;

    for (const range of ranges.slice(1)) {
        const gap = code.slice(previous.end, range.pos);

        if (
            range.kind !== ts.SyntaxKind.SingleLineCommentTrivia ||
            gap.split("\n").length !== 2 ||
            code.startsWith(ARROW, range.pos)
        ) {
            break;
        }

        lines.push(code.slice(range.pos + 2, range.end));
        previous = range;
    }

    return { expected: lines.join("\n"), position: first.pos };
}

/**
 * Turns a fence's `// =>` assertions into calls to the runner's helpers.
 *
 * @param fence - A parsed fence.
 * @param file - The Markdown file the fence came from.
 * @returns The compiled example, or null when the fence is not runnable code or holds no assertion.
 */
export function compileExample(
    fence: MarkdownFence,
    file: string,
): CompiledExample | null {
    const { code } = fence;

    if (!RUNNABLE_LANGS.has(fence.lang)) {
        return null;
    }

    const source = ts.createSourceFile(
        "example.ts",
        code,
        ts.ScriptTarget.ES2022,
        true,
    );
    const edits: { start: number; end: number; text: string }[] = [];
    const modules: string[] = [];

    for (const statement of source.statements) {
        if (ts.isImportDeclaration(statement)) {
            modules.push((statement.moduleSpecifier as ts.StringLiteral).text);
            edits.push({
                start: statement.getStart(source),
                end: statement.end,
                text: importStatement(statement),
            });
        }

        const assertion = assertionAfter(code, statement.end);

        if (assertion === null) {
            continue;
        }

        if (!ts.isExpressionStatement(statement)) {
            throw new Error(
                `\`// =>\` must follow an expression statement (${file}:${fileLine(code, assertion.position, fence)})`,
            );
        }

        const expression = statement.expression.getText(source);
        const line = fileLine(code, statement.getStart(source), fence);
        const thrown = /^throws\s+(\w+)$/.exec(assertion.expected);

        edits.push({
            start: statement.getStart(source),
            end: statement.end,
            text:
                thrown === null
                    ? `await __expect(() => (${expression}), () => (${assertion.expected}), ${line});`
                    : `await __throws(() => (${expression}), ${JSON.stringify(thrown[1])}, ${line});`,
        });
    }

    if (!edits.some(({ text }) => text.startsWith("await __"))) {
        return null;
    }

    let rewritten = code;

    for (const edit of edits.sort((a, b) => b.start - a.start)) {
        rewritten =
            rewritten.slice(0, edit.start) +
            edit.text +
            rewritten.slice(edit.end);
    }

    const { outputText } = ts.transpileModule(
        `async function __main(): Promise<void> {\n${rewritten}\n}`,
        { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
    );

    return {
        file,
        line: fence.line,
        body: `${outputText}\nreturn __main();`,
        modules: [...new Set(modules)],
    };
}

/**
 * Runs an example and fails on the first assertion that does not hold.
 *
 * @param example - The compiled example.
 * @param load - Loads a module by the specifier the example imports.
 * @returns Resolves when every assertion holds; rejects with the Markdown file and line otherwise.
 */
export async function runExample(
    example: CompiledExample,
    load: (specifier: string) => Promise<Record<string, unknown>>,
): Promise<void> {
    const loaded: Record<string, Record<string, unknown>> = {};

    for (const specifier of example.modules) {
        loaded[specifier] = await load(specifier);
    }

    const where = (line: number): string => `${example.file}:${line}`;

    const expectValue = async (
        actual: () => unknown,
        expected: () => unknown,
        line: number,
    ): Promise<void> => {
        try {
            expect(orderedShape(await actual())).toEqual(
                orderedShape(expected()),
            );
        } catch (error) {
            throw new Error(
                `${where(line)}: ${error instanceof Error ? error.message : String(error)}`,
                { cause: error },
            );
        }
    };

    const expectThrows = async (
        call: () => unknown,
        name: string,
        line: number,
    ): Promise<void> => {
        let thrown: unknown = null;

        try {
            await call();
        } catch (error) {
            thrown = error;
        }

        const actual = thrown instanceof Error ? thrown.name : null;

        if (actual !== name) {
            throw new Error(
                `${where(line)}: expected to throw ${name}, ${actual === null ? "nothing was thrown" : `got ${actual}`}`,
            );
        }
    };

    await new AsyncFunction("__m", "__expect", "__throws", example.body)(
        loaded,
        expectValue,
        expectThrows,
    );
}
