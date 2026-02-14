import { execSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const repos = {
    "Laravel Framework": process.env.FRAMEWORK_PATH,
    "Laravel Docs": process.env.FRAMEWORK_DOCS_PATH,
};

let totalErrors = 0;

for (const [name, repoPath] of Object.entries(repos)) {
    if (!repoPath) {
        console.error(`  ❌ ${name}: path not set in .env`);
        totalErrors++;
        continue;
    }

    try {
        console.log(`Pulling ${name} (${repoPath})...`);
        const output = execSync("git pull", {
            cwd: repoPath,
            encoding: "utf-8",
        });
        console.log(`  ✅ ${output.trim()}\n`);
    } catch (error) {
        console.error(
            `  ❌ ${name}: ${error instanceof Error ? error.message : String(error)}`,
        );
        totalErrors++;
    }
}

if (totalErrors > 0) {
    process.exit(1);
}
