// @vitest-environment node
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { laravelLangExport } from "@tolki/lang/vite-laravel";
import type { Rollup } from "vite";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = path.resolve(
    fileURLToPath(import.meta.url),
    "../fixtures/laravel-app",
);

const ENTRY = "resources/js/app.js";

let scratch = "";

/**
 * Run Vite's real build against the fixture app.
 *
 * @param ssr - Whether to build the server entry.
 * @returns The output chunks and assets.
 */
async function buildFixture(
    ssr: boolean,
): Promise<(Rollup.OutputChunk | Rollup.OutputAsset)[]> {
    const result = (await build({
        root,
        configFile: false,
        logLevel: "silent",
        cacheDir: path.join(scratch, "cache"),
        plugins: [laravelLangExport({ runOnBuildStart: false })],
        build: ssr
            ? { write: false, ssr: ENTRY }
            : {
                  write: false,
                  rolldownOptions: {
                      input: path.join(root, ENTRY),
                      preserveEntrySignatures: "exports-only",
                  },
              },
    })) as Rollup.RollupOutput | Rollup.RollupOutput[];
    const outputs = Array.isArray(result) ? result : [result];

    return outputs.flatMap((output) => output.output);
}

/**
 * Write a build's files to a fresh directory, so its entry can be imported.
 *
 * @param output - The build output.
 * @param name - The directory name under the scratch directory.
 * @returns The absolute path of every written file, entry first.
 */
async function writeBuild(
    output: (Rollup.OutputChunk | Rollup.OutputAsset)[],
    name: string,
): Promise<string> {
    const dir = path.join(scratch, name);

    let entry = "";

    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "package.json"), '{"type":"module"}');

    for (const item of output) {
        await mkdir(path.dirname(path.join(dir, item.fileName)), {
            recursive: true,
        });
        await writeFile(
            path.join(dir, item.fileName),
            item.type === "chunk" ? item.code : item.source,
        );

        if (item.type === "chunk" && item.isEntry) {
            entry = path.join(dir, item.fileName);
        }
    }

    return entry;
}

describe("virtual:tolki-lang build", () => {
    beforeAll(async () => {
        scratch = await mkdtemp(path.join(os.tmpdir(), "tolki-lang-build-"));
    });

    afterAll(async () => {
        await rm(scratch, { recursive: true, force: true });
    });

    it("emits one chunk per locale, outside the entry", async () => {
        const chunks = (await buildFixture(false)).filter(
            (item): item is Rollup.OutputChunk => item.type === "chunk",
        );
        const entry = chunks.find((chunk) => chunk.isEntry);
        const holders = chunks.filter((chunk) =>
            chunk.code.includes("Bienvenido"),
        );

        expect(entry?.code).not.toContain("Bienvenido");
        expect(holders).toHaveLength(1);
        expect(holders[0]?.isEntry).toBe(false);
    }, 30_000);

    it("keeps the manifest out of the client build", async () => {
        const output = await buildFixture(false);
        const text = output
            .map((item) =>
                item.type === "chunk" ? item.code : String(item.source),
            )
            .join("\n");

        expect(text).not.toContain("fixture-fingerprint");
        expect(text).not.toContain("/srv/secret");
    }, 30_000);

    it("builds a server entry whose load is synchronous", async () => {
        const output = await buildFixture(true);

        expect(output).toHaveLength(1);

        const file = await writeBuild(output, "server");
        const mod = (await import(pathToFileURL(file).href)) as {
            load: (locale: string) => Record<string, string>;
        };

        expect(mod.load("es")["Welcome"]).toBe("Bienvenido");
        expect(() => mod.load("xx")).toThrow(
            /No exported lines for locale "xx"/,
        );
        expect(() => mod.load("__proto__")).toThrow(
            /No exported lines for locale "__proto__"/,
        );
        expect(() => mod.load("constructor")).toThrow(
            /No exported lines for locale "constructor"/,
        );
    }, 30_000);

    it("builds a client entry whose load rejects an unknown locale", async () => {
        const file = await writeBuild(await buildFixture(false), "client");
        const mod = (await import(pathToFileURL(file).href)) as {
            load: (locale: string) => Promise<Record<string, string>>;
        };

        expect((await mod.load("es"))["Welcome"]).toBe("Bienvenido");
        await expect(mod.load("xx")).rejects.toThrow(
            /No exported lines for locale "xx"/,
        );
        await expect(mod.load("__proto__")).rejects.toThrow(
            /No exported lines for locale "__proto__"/,
        );
        await expect(mod.load("constructor")).rejects.toThrow(
            /No exported lines for locale "constructor"/,
        );
    }, 30_000);
});
