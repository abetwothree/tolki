/**
 * This script finds all PHP files in stub folders within packages and generates
 * function list files for each one using the functions-list.ts script.
 *
 * Usage:
 *   npx ts-node scripts/stubs-function-list-create.ts
 *   node scripts/stubs-function-list-create.js
 *
 * For each PHP file found in packages/[package]/stubs/[file].php, it will:
 * 1. Run the functions-list.ts script on that file
 * 2. Save the output to a new file with "-Function-List" suffix in the same directory
 *
 * Example:
 *   packages/arr/stubs/Arr.php -> packages/arr/stubs/Arr-Function-List.txt
 *   packages/str/stubs/Str.php -> packages/str/stubs/Str-Function-List.txt
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

interface StubFile {
    fullPath: string;
    packageName: string;
    fileName: string;
    baseName: string; // filename without extension
}

/**
 * Find all PHP files in stub folders within packages
 */
function findStubFiles(): StubFile[] {
    const packagesDir = path.join(process.cwd(), "packages");
    const stubFiles: StubFile[] = [];

    if (!fs.existsSync(packagesDir)) {
        throw new Error(`Packages directory not found: ${packagesDir}`);
    }

    const packages = fs.readdirSync(packagesDir).filter((item) => {
        const packagePath = path.join(packagesDir, item);
        return fs.statSync(packagePath).isDirectory();
    });

    for (const packageName of packages) {
        const stubsDir = path.join(packagesDir, packageName, "stubs");

        if (fs.existsSync(stubsDir)) {
            const files = fs
                .readdirSync(stubsDir)
                .filter((file) => file.endsWith(".php"));

            for (const fileName of files) {
                const fullPath = path.join(stubsDir, fileName);
                const baseName = path.basename(fileName, ".php");

                stubFiles.push({
                    fullPath,
                    packageName,
                    fileName,
                    baseName,
                });
            }
        }
    }

    return stubFiles;
}

/**
 * Generate function list for a single stub file
 */
function generateFunctionList(stubFile: StubFile): void {
    const outputFileName = `${stubFile.baseName}-Function-List.txt`;
    const outputPath = path.join(
        path.dirname(stubFile.fullPath),
        outputFileName,
    );

    console.log(`Processing: ${stubFile.packageName}/${stubFile.fileName}`);
    console.log(`  Input:  ${stubFile.fullPath}`);
    console.log(`  Output: ${outputPath}`);

    try {
        // Run the functions-list.ts script and capture output
        const command = `npx ts-node scripts/functions-list.ts "${stubFile.fullPath}"`;
        const output = execSync(command, {
            encoding: "utf-8",
            cwd: process.cwd(),
        });

        // Write the output to the function list file
        fs.writeFileSync(outputPath, output);

        console.log(`  ✅ Successfully created ${outputFileName}\n`);
    } catch (error) {
        console.error(`  ❌ Error processing ${stubFile.fileName}:`);
        console.error(
            `     ${error instanceof Error ? error.message : error}\n`,
        );
    }
}

/**
 * Main function to process all stub files
 */
function main(): void {
    console.log("🔍 Searching for PHP stub files...\n");

    try {
        const stubFiles = findStubFiles();

        if (stubFiles.length === 0) {
            console.log(
                "No PHP stub files found in packages/*/stubs/ directories.",
            );
            return;
        }

        console.log(`Found ${stubFiles.length} PHP stub file(s):\n`);

        // List all files that will be processed
        stubFiles.forEach((stubFile) => {
            console.log(`  📄 ${stubFile.packageName}/${stubFile.fileName}`);
        });

        console.log(`\n📝 Generating function lists...\n`);

        // Process each file
        let successCount = 0;
        let errorCount = 0;

        for (const stubFile of stubFiles) {
            try {
                generateFunctionList(stubFile);
                successCount++;
            } catch (error) {
                console.error(`Failed to process ${stubFile.fileName}:`);
                console.error(error instanceof Error ? error.message : error);
                errorCount++;
            }
        }

        // Summary
        console.log("📊 Summary:");
        console.log(`  ✅ Successfully processed: ${successCount} files`);
        if (errorCount > 0) {
            console.log(`  ❌ Failed to process: ${errorCount} files`);
        }
        console.log(`  📁 Total function list files created: ${successCount}`);

        if (errorCount > 0) {
            process.exit(1);
        }
    } catch (error) {
        console.error(
            "❌ Error:",
            error instanceof Error ? error.message : error,
        );
        process.exit(1);
    }
}

// Export the main function for use in other modules
export { findStubFiles, generateFunctionList,main };

// Call main if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
