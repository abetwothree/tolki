/**
 * This file receives a file path and returns a list of functions defined in that file.
 * It can receive either JavaScript, TypeScript, or PHP files.
 *
 * Usage:
 *   npx ts-node scripts/functions-list.ts <file-path>
 *   node scripts/functions-list.js <file-path>
 *
 * Examples:
 *   npx ts-node scripts/functions-list.ts packages/path/src/path.ts
 *   npx ts-node scripts/functions-list.ts some-file.php
 *   npx ts-node scripts/functions-list.ts my-script.js
 *
 * Write output to a file:
 *  npx ts-node scripts/functions-list.ts <file-path> > output.txt
 *
 * Supported file types:
 *   - .js, .jsx (JavaScript)
 *   - .ts, .tsx (TypeScript)
 *   - .php (PHP)
 *
 * Output includes:
 *   - Function name
 *   - Function type (export, function, arrow, method)
 *   - Line number
 *   - Whether it's async (JS/TS only)
 *   - Whether it's exported
 *   - Parameter list
 *   - Return type (if specified)
 *   - Visibility (PHP methods only)
 */

import fs from "fs";
import path from "path";

interface FunctionInfo {
    name: string;
    type: "function" | "method" | "arrow" | "export";
    line: number;
    isAsync: boolean;
    isExported: boolean;
    parameters: string[];
    returnType?: string;
    visibility?: "public" | "private" | "protected"; // For PHP
}

/**
 * Parse JavaScript/TypeScript files to extract function information
 */
function parseJsTs(content: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;

        // Skip comments and empty lines
        if (
            line.startsWith("//") ||
            line.startsWith("/*") ||
            line.startsWith("*") ||
            !line
        ) {
            continue;
        }

        // Multi-line function declarations (export function name)
        const exportFunctionMatch = line.match(
            /^export\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/,
        );
        if (exportFunctionMatch) {
            const [, functionName] = exportFunctionMatch;

            // Look ahead to find the full function signature
            let fullSignature = line;
            let j = i;
            while (
                j < lines.length &&
                !fullSignature.includes("{") &&
                !fullSignature.includes(";")
            ) {
                j++;
                if (j < lines.length) {
                    fullSignature += " " + lines[j].trim();
                }
            }

            // Extract parameters and return type from full signature
            const paramMatch = fullSignature.match(/\(([^)]*)\)/);
            const returnTypeMatch = fullSignature.match(/\):\s*([^{;]+)/);
            const asyncMatch = fullSignature.match(/async\s+function/);

            functions.push({
                name: functionName,
                type: "export",
                line: lineNumber,
                isAsync: !!asyncMatch,
                isExported: true,
                parameters: paramMatch ? parseParameters(paramMatch[1]) : [],
                returnType: returnTypeMatch
                    ? returnTypeMatch[1].trim()
                    : undefined,
            });
            continue;
        }

        // Single-line function declarations
        const functionMatch = line.match(
            /^(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?/,
        );
        if (functionMatch) {
            const [, asyncKeyword, functionName, params, returnType] =
                functionMatch;
            functions.push({
                name: functionName,
                type: "function",
                line: lineNumber,
                isAsync: !!asyncKeyword,
                isExported: false,
                parameters: parseParameters(params),
                returnType: returnType?.trim(),
            });
            continue;
        }

        // Arrow functions (const/let/var functionName = ...)
        const arrowMatch = line.match(
            /^(export\s+)?(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(async\s+)?\(([^)]*)\)\s*=>/,
        );
        if (arrowMatch) {
            const [, exportKeyword, , functionName, asyncKeyword, params] =
                arrowMatch;
            functions.push({
                name: functionName,
                type: "arrow",
                line: lineNumber,
                isAsync: !!asyncKeyword,
                isExported: !!exportKeyword,
                parameters: parseParameters(params),
            });
            continue;
        }

        // Function expressions (const/let/var functionName = function...)
        const functionExpressionMatch = line.match(
            /^(export\s+)?(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(async\s+)?function\s*\(([^)]*)\)/,
        );
        if (functionExpressionMatch) {
            const [, exportKeyword, , functionName, asyncKeyword, params] =
                functionExpressionMatch;
            functions.push({
                name: functionName,
                type: "function",
                line: lineNumber,
                isAsync: !!asyncKeyword,
                isExported: !!exportKeyword,
                parameters: parseParameters(params),
            });
            continue;
        }

        // Export default function
        const exportDefaultMatch = line.match(
            /^export\s+default\s+(async\s+)?function\s*([a-zA-Z_$][a-zA-Z0-9_$]*)?\s*\(([^)]*)\)/,
        );
        if (exportDefaultMatch) {
            const [, asyncKeyword, functionName, params] = exportDefaultMatch;
            functions.push({
                name: functionName || "default",
                type: "export",
                line: lineNumber,
                isAsync: !!asyncKeyword,
                isExported: true,
                parameters: parseParameters(params),
            });
            continue;
        }
    }

    return functions;
}

/**
 * Parse PHP files to extract function information
 */
function parsePHP(content: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;

        // Skip comments and empty lines
        if (
            line.startsWith("//") ||
            line.startsWith("/*") ||
            line.startsWith("*") ||
            line.startsWith("#") ||
            !line
        ) {
            continue;
        }

        // Regular function declarations
        const functionMatch = line.match(
            /^function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/,
        );
        if (functionMatch) {
            const [, functionName, params] = functionMatch;
            functions.push({
                name: functionName,
                type: "function",
                line: lineNumber,
                isAsync: false,
                isExported: false,
                parameters: parsePHPParameters(params),
            });
            continue;
        }

        // Class method declarations
        const methodMatch = line.match(
            /^(public|private|protected)?\s*(static\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/,
        );
        if (methodMatch) {
            const [, visibility, , methodName, params] = methodMatch;
            functions.push({
                name: methodName,
                type: "method",
                line: lineNumber,
                isAsync: false,
                isExported: false,
                parameters: parsePHPParameters(params),
                visibility:
                    (visibility as "public" | "private" | "protected") ||
                    "public",
            });
            continue;
        }

        // Static method calls (for completeness)
        const staticMatch = line.match(
            /^(public|private|protected)\s+static\s+function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/,
        );
        if (staticMatch) {
            const [, visibility, methodName, params] = staticMatch;
            functions.push({
                name: methodName,
                type: "method",
                line: lineNumber,
                isAsync: false,
                isExported: false,
                parameters: parsePHPParameters(params),
                visibility: visibility as "public" | "private" | "protected",
            });
            continue;
        }
    }

    return functions;
}

/**
 * Parse parameters for JavaScript/TypeScript functions
 */
function parseParameters(paramString: string): string[] {
    if (!paramString.trim()) {
        return [];
    }

    return paramString
        .split(",")
        .map((param) => {
            // Remove type annotations and default values
            const cleanParam = param
                .trim()
                .replace(/:\s*[^=,]+/, "") // Remove type annotations
                .replace(/\s*=\s*[^,]+/, "") // Remove default values
                .replace(/\.\.\./g, ""); // Remove rest operator
            return cleanParam.trim();
        })
        .filter((param) => param.length > 0);
}

/**
 * Parse parameters for PHP functions
 */
function parsePHPParameters(paramString: string): string[] {
    if (!paramString.trim()) {
        return [];
    }

    return paramString
        .split(",")
        .map((param) => {
            // Remove type hints and default values
            const cleanParam = param
                .trim()
                .replace(/^[a-zA-Z_][a-zA-Z0-9_]*\s+/, "") // Remove type hints
                .replace(/\s*=\s*[^,]+/, "") // Remove default values
                .replace(/\.\.\./g, ""); // Remove variadic operator
            return cleanParam.trim();
        })
        .filter((param) => param.length > 0);
}

/**
 * Get file extension from file path
 */
function getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
}

/**
 * Main function to extract functions from a file
 */
export function extractFunctions(filePath: string): FunctionInfo[] {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const extension = getFileExtension(filePath);

    switch (extension) {
        case ".js":
        case ".jsx":
        case ".ts":
        case ".tsx":
            return parseJsTs(content);
        case ".php":
            return parsePHP(content);
        default:
            throw new Error(`Unsupported file type: ${extension}`);
    }
}

/**
 * Format function information for display
 */
function formatFunctionInfo(func: FunctionInfo): string {
    const asyncPrefix = func.isAsync ? "async " : "";
    const exportPrefix = func.isExported ? "export " : "";
    const visibilityPrefix = func.visibility ? `${func.visibility} ` : "";
    const params = func.parameters.join(", ");
    const returnTypeStr = func.returnType ? `: ${func.returnType}` : "";

    return `${exportPrefix}${visibilityPrefix}${asyncPrefix}${func.name}(${params})${returnTypeStr} [line ${func.line}]`;
}

/**
 * CLI function to process file path argument
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error("Usage: ts-node functions-list.ts <file-path>");
        console.error("       node functions-list.js <file-path>");
        process.exit(1);
    }

    const filePath = args[0];

    try {
        console.log(`\nAnalyzing file: ${filePath}\n`);

        const functions = extractFunctions(filePath);

        if (functions.length === 0) {
            console.log("No functions found in this file.");
            return;
        }

        console.log(`Found ${functions.length} function(s):\n`);

        // Group by type
        const grouped = functions.reduce(
            (acc, func) => {
                const key = func.type;
                if (!acc[key]) acc[key] = [];
                acc[key].push(func);
                return acc;
            },
            {} as Record<string, FunctionInfo[]>,
        );

        Object.entries(grouped).forEach(([type, funcs]) => {
            console.log(`${type.toUpperCase()} DECLARATIONS:`);
            funcs.forEach((func) => {
                console.log(`  ${formatFunctionInfo(func)}`);
            });
            console.log("");
        });
        
        const ext = getFileExtension(filePath);
        if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
            const packageName = path.basename(
                path.dirname(path.dirname(filePath)),
            );
            const importableFunctions = functions
                .filter((f) => f.isExported)
                .map((f) => f.name)
                .filter((name) => name !== "default");
            if (importableFunctions.length > 0) {
                console.log("You can import these functions like this:\n");
                console.log(
                    `import { ${importableFunctions.join(
                        ", ",
                    )} } from '@laravel-js/${packageName}';\n`,
                );
            }
        }
    } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

// Export the main function for use in other modules
export { main };

// Call main if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
