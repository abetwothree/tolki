// @vitest-environment node
import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
async function buildFixture(ssr: boolean): Promise<Rollup.OutputChunk[]> {
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
                  rollupOptions: {
                      input: path.join(root, ENTRY),
                      preserveEntrySignatures: "exports-only",
                  },
              },
    })) as Rollup.RollupOutput | Rollup.RollupOutput[];
    const outputs = Array.isArray(result) ? result : [result];

    return outputs.flatMap((output) => output.output) as Rollup.OutputChunk[];
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
            (item) => item.type === "chunk",
        );
        const entry = chunks.find((chunk) => chunk.isEntry);
        const holders = chunks.filter((chunk) =>
            chunk.code.includes("Bienvenido"),
        );

        expect(entry?.code).not.toContain("Bienvenido");
        expect(holders).toHaveLength(1);
        expect(holders[0]?.isEntry).toBe(false);
    });

    it("keeps the manifest out of the client build", async () => {
        const output = await buildFixture(false);
        const text = output
            .map((item) => (item.type === "chunk" ? item.code : ""))
            .join("\n");

        expect(text).not.toContain("fixture-fingerprint");
        expect(text).not.toContain("/srv/secret");
    });

    it("builds a server entry whose load is synchronous", async () => {
        const output = await buildFixture(true);

        expect(output).toHaveLength(1);

        const file = path.join(scratch, "server.mjs");

        await writeFile(file, output[0]?.code ?? "");

        const mod = (await import(pathToFileURL(file).href)) as {
            load: (locale: string) => Record<string, string>;
        };

        expect(mod.load("es")["Welcome"]).toBe("Bienvenido");
        expect(() => mod.load("xx")).toThrow(
            /No exported lines for locale "xx"/,
        );
    });
});
