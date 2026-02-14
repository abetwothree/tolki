import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const packageDocsFiles = {
    helpers: 'helpers.md',
    collections: 'collections.md',
    strings: 'strings.md',
} as const;

/**
 * Copy framework docs files to docs/stubs/
 */
function copyFrameworkDocsFiles(): void {
    const frameworkDocsPath = process.env.FRAMEWORK_DOCS_PATH;

    if (!frameworkDocsPath) {
        throw new Error("FRAMEWORK_DOCS_PATH not found in .env file");
    }

    if (!fs.existsSync(frameworkDocsPath)) {
        throw new Error(
            `Framework docs path does not exist: ${frameworkDocsPath}`,
        );
    }

    console.log(`Using Laravel framework docs path: ${frameworkDocsPath}\n`);

    const stubsDir = path.join(__dirname, "..", "docs", "stubs");

    if (!fs.existsSync(stubsDir)) {
        fs.mkdirSync(stubsDir, { recursive: true });
        console.log(`Created directory: ${stubsDir}`);
    }

    let totalCopied = 0;
    let totalErrors = 0;

    for (const [name, fileName] of Object.entries(packageDocsFiles)) {
        const sourceFile = path.join(frameworkDocsPath, fileName);
        const destFile = path.join(stubsDir, fileName);

        try {
            if (!fs.existsSync(sourceFile)) {
                console.error(`  ❌ Source file not found: ${sourceFile}`);
                totalErrors++;
                continue;
            }

            fs.copyFileSync(sourceFile, destFile);
            console.log(`  ✅ Copied: ${fileName} (${name})`);
            totalCopied++;
        } catch (error) {
            console.error(
                `  ❌ Error copying ${fileName}: ${error instanceof Error ? error.message : String(error)}`,
            );
            totalErrors++;
        }
    }

    console.log("");
    console.log("═".repeat(50));
    console.log(`Summary:`);
    console.log(`  Files copied: ${totalCopied}`);
    console.log(`  Errors: ${totalErrors}`);
    console.log("═".repeat(50));
}

// Run the script
try {
    copyFrameworkDocsFiles();
} catch (error) {
    console.error(
        `Fatal error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
}