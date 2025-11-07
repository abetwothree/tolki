import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const packageFiles = {
    arr: {
        "Arr.php": "src/Illuminate/Collections/Arr.php",
        "ArrTest.php": "tests/Support/SupportArrTest.php",
    },
    collection: {
        "CanBeEscapedWhenCastToString.php":
            "src/Illuminate/Contracts/Support/CanBeEscapedWhenCastToString.php",
        "Collection.php": "src/Illuminate/Collections/Collection.php",
        "CollectionTest.php": "tests/Support/SupportCollectionTest.php",
        "Conditionable.php":
            "src/Illuminate/Conditionable/Traits/Conditionable.php",
        "Enumerable.php": "src/Illuminate/Collections/Enumerable.php",
        "EnumeratesValues.php":
            "src/Illuminate/Collections/Traits/EnumeratesValues.php",
        "HigherOrderCollectionProxy.php":
            "src/Illuminate/Collections/HigherOrderCollectionProxy.php",
        "Jsonable.php": "src/Illuminate/Contracts/Support/Jsonable.php",
    },
    num: {
        "Number.php": "src/Illuminate/Support/Number.php",
        "NumberTest.php": "tests/Support/SupportNumberTest.php",
    },
    str: {
        "Str.php": "src/Illuminate/Support/Str.php",
        "StrTest.php": "tests/Support/SupportStrTest.php",
        "Stringable.php": "src/Illuminate/Support/Stringable.php",
        "StringableTest.php": "tests/Support/SupportStringableTest.php",
    },
} as const;

/**
 * Copy framework files to package stubs folders
 */
function copyFrameworkFiles(): void {
    const frameworkPath = process.env.FRAMEWORK_PATH;

    if (!frameworkPath) {
        throw new Error("FRAMEWORK_PATH not found in .env file");
    }

    if (!fs.existsSync(frameworkPath)) {
        throw new Error(`Framework path does not exist: ${frameworkPath}`);
    }

    console.log(`Using Laravel framework path: ${frameworkPath}\n`);

    let totalCopied = 0;
    let totalErrors = 0;

    // Loop through each package
    for (const [packageName, files] of Object.entries(packageFiles)) {
        console.log(`Processing package: ${packageName}`);

        // Create stubs directory if it doesn't exist
        const stubsDir = path.join(
            __dirname,
            "..",
            "packages",
            packageName,
            "stubs",
        );

        if (!fs.existsSync(stubsDir)) {
            fs.mkdirSync(stubsDir, { recursive: true });
            console.log(`  Created directory: ${stubsDir}`);
        }

        // Copy each file
        for (const [fileName, sourcePath] of Object.entries(files)) {
            const sourceFile = path.join(frameworkPath, sourcePath);
            const destFile = path.join(stubsDir, fileName);

            try {
                if (!fs.existsSync(sourceFile)) {
                    console.error(`  ❌ Source file not found: ${sourceFile}`);
                    totalErrors++;
                    continue;
                }

                fs.copyFileSync(sourceFile, destFile);
                console.log(`  ✅ Copied: ${fileName}`);
                totalCopied++;
            } catch (error) {
                console.error(
                    `  ❌ Error copying ${fileName}: ${error instanceof Error ? error.message : String(error)}`,
                );
                totalErrors++;
            }
        }

        console.log("");
    }

    console.log("═".repeat(50));
    console.log(`Summary:`);
    console.log(`  Files copied: ${totalCopied}`);
    console.log(`  Errors: ${totalErrors}`);
    console.log("═".repeat(50));
}

// Run the script
try {
    copyFrameworkFiles();
} catch (error) {
    console.error(
        `Fatal error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
}
