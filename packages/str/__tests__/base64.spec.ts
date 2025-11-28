import { fromBase64, toBase64 } from "@laravel-js/str";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// We will temporarily modify globals to simulate different environments
const g = globalThis as unknown as Record<string, unknown>;
const NodeBuffer = (
    globalThis as unknown as {
        Buffer: {
            from(input: string, enc: string): { toString(enc: string): string };
        };
    }
).Buffer;

const saveGlobals = () => ({
    Buffer: g["Buffer"],
    btoa: g["btoa"],
    atob: g["atob"],
    TextDecoder: g["TextDecoder"],
});

const restoreGlobals = (snap: ReturnType<typeof saveGlobals>) => {
    g["Buffer"] = snap.Buffer;
    g["btoa"] = snap.btoa;
    g["atob"] = snap.atob;
    g["TextDecoder"] = snap.TextDecoder;
};

describe("Str/Base64", () => {
    let snapshot: ReturnType<typeof saveGlobals>;

    beforeEach(() => {
        snapshot = saveGlobals();
    });

    afterEach(() => {
        restoreGlobals(snapshot);
    });

    it("encodes/decodes via Node Buffer fast-path", () => {
        // Ensure Buffer exists
        const hasBuffer =
            !!(g["Buffer"] as { from?: unknown }) &&
            typeof (g["Buffer"] as { from?: unknown }).from === "function";
        expect(hasBuffer).toBe(true);

        expect(toBase64("hello")).toBe("aGVsbG8=");
        expect(fromBase64("aGVsbG8=")).toBe("hello");

        // Unicode content
        const s = "Hello, 😊 Привет 你好";
        const b64 = toBase64(s);
        expect(typeof b64).toBe("string");
        expect(fromBase64(b64)).toBe(s);
    });

    it("encodes/decodes via browser btoa/atob (no Buffer)", () => {
        // Remove Buffer so code uses btoa/atob path
        g["Buffer"] = undefined;

        // Provide btoa/atob shims that operate on binary strings
        g["btoa"] = (bin: string) =>
            NodeBuffer.from(bin, "binary").toString("base64");
        g["atob"] = (b64: string) =>
            NodeBuffer.from(b64, "base64").toString("binary");

        // Without TextDecoder, fromBase64 should use percent-decoding fallback
        const prevTD = g["TextDecoder"];
        g["TextDecoder"] = undefined;

        expect(toBase64("foo")).toBe("Zm9v");
        expect(toBase64("f")).toBe("Zg==");
        expect(toBase64("fo")).toBe("Zm8=");

        expect(fromBase64("Zm9v")).toBe("foo");

        // Restore TextDecoder to cover that branch too
        g["TextDecoder"] =
            prevTD ??
            (globalThis as unknown as { TextDecoder?: typeof TextDecoder })
                .TextDecoder;

        const s = "Latin: áéí — Emoji: 😄";
        const b64 = toBase64(s);
        expect(fromBase64(b64)).toBe(s);
    });

    it("strict vs non-strict decoding", () => {
        // Force Node Buffer path to be available for deterministic decoding
        const hasBuffer2 =
            !!(g["Buffer"] as { from?: unknown }) &&
            typeof (g["Buffer"] as { from?: unknown }).from === "function";
        expect(hasBuffer2).toBe(true);

        // Spaced base64 is valid in our strict mode (whitespace ignored then validated)
        const spaced = " aG V sb G8= ";
        expect(fromBase64(spaced, false)).toBe("hello");
        expect(fromBase64(spaced, true)).toBe("hello");

        // Invalid alphabet characters
        expect(fromBase64("Zm9v!!", true)).toBe(false);

        // Non-strict should salvage and decode
        expect(fromBase64("Zm9v!!", false)).toBe("foo");
    });

    it("manual fallback decode when no Buffer or atob", () => {
        // Remove Buffer and atob to trigger final fallback
        g["Buffer"] = undefined;
        g["atob"] = undefined;
        g["btoa"] = undefined;

        // Generate a unicode sample and ensure manual fallback decodes it
        const sample = "Hello, 世界 ☺☻♥";
        const b64 = NodeBuffer.from(sample, "utf8").toString("base64");
        const res = fromBase64(b64);
        expect(res).toBe(sample);
    });
});
