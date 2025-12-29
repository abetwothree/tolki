import { bytesToBase64, fromBase64, toBase64 } from "@laravel-js/str";
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

    describe("bytesToBase64", () => {
        it("uses Buffer fast-path when available", () => {
            const bytes = new Uint8Array([0x48, 0x69]);
            expect(bytesToBase64(bytes)).toBe("SGk=");
        });

        it("uses btoa when Buffer is absent", () => {
            g["Buffer"] = undefined;
            g["btoa"] = (bin: string) =>
                NodeBuffer.from(bin, "binary").toString("base64");

            const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
            expect(bytesToBase64(bytes)).toBe("3q2+7w==");
        });

        it("falls back to manual encoding without Buffer or btoa", () => {
            g["Buffer"] = undefined;
            g["btoa"] = undefined;

            const oneByte = new Uint8Array([0x61]);
            const twoBytes = new Uint8Array([0x61, 0x62]);

            expect(bytesToBase64(oneByte)).toBe("YQ==");
            expect(bytesToBase64(twoBytes)).toBe("YWI=");
        });

        it("uses nullish defaults in manual encoder when char codes are undefined", () => {
            g["Buffer"] = undefined;
            g["btoa"] = undefined;

            const originalCharCodeAt = String.prototype.charCodeAt;
            let calls = 0;
            (
                String.prototype as unknown as {
                    charCodeAt: (...args: [number]) => number;
                }
            ).charCodeAt = function (...args: [number]) {
                calls += 1;
                if (calls <= 3) {
                    // Force o1, o2, o3 to be undefined so ?? 0 branch executes
                    return undefined as unknown as number;
                }

                return originalCharCodeAt.apply(this, args);
            };

            try {
                expect(bytesToBase64(new Uint8Array([0x61]))).toBe("AA==");
            } finally {
                (
                    String.prototype as unknown as {
                        charCodeAt: typeof originalCharCodeAt;
                    }
                ).charCodeAt = originalCharCodeAt;
            }
        });

        it("returns empty string for empty input via manual path", () => {
            g["Buffer"] = undefined;
            g["btoa"] = undefined;

            expect(bytesToBase64(new Uint8Array([]))).toBe("");
        });
    });

    describe("toBase64/fromBase64", () => {
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
    });

    describe("toBase64/fromBase64 via browser fallbacks", () => {
        it("encodes/decodes via browser btoa/atob (no Buffer)", () => {
            g["Buffer"] = undefined;

            g["btoa"] = (bin: string) =>
                NodeBuffer.from(bin, "binary").toString("base64");
            g["atob"] = (b64: string) =>
                NodeBuffer.from(b64, "base64").toString("binary");

            const prevTD = g["TextDecoder"];
            g["TextDecoder"] = undefined;

            expect(toBase64("foo")).toBe("Zm9v");
            expect(toBase64("f")).toBe("Zg==");
            expect(toBase64("fo")).toBe("Zm8=");

            expect(fromBase64("Zm9v")).toBe("foo");

            g["TextDecoder"] =
                prevTD ??
                (globalThis as unknown as { TextDecoder?: typeof TextDecoder })
                    .TextDecoder;

            const s = "Latin: áéí — Emoji: 😄";
            const b64 = toBase64(s);
            expect(fromBase64(b64)).toBe(s);
        });

        it("uses btoa fallback branch when UTF-8 conversion throws", () => {
            g["Buffer"] = undefined;
            g["btoa"] = (bin: string) =>
                NodeBuffer.from(bin, "binary").toString("base64");
            const originalEncode = globalThis.encodeURIComponent;
            globalThis.encodeURIComponent = () => {
                throw new URIError("bad surrogate");
            };

            const s = "\uD800";
            try {
                expect(toBase64(s)).toBe(
                    NodeBuffer.from(s, "binary").toString("base64"),
                );
            } finally {
                globalThis.encodeURIComponent = originalEncode;
            }
        });

        it("returns false when atob throws", () => {
            g["Buffer"] = undefined;
            g["btoa"] = (bin: string) =>
                NodeBuffer.from(bin, "binary").toString("base64");
            g["atob"] = () => {
                throw new Error("decode fail");
            };

            expect(fromBase64("Zm9v")).toBe(false);
        });

        it("manual UTF-8 Base64 encoding when neither Buffer nor btoa exist", () => {
            g["Buffer"] = undefined;
            g["btoa"] = undefined;
            g["atob"] = (b64: string) =>
                NodeBuffer.from(b64, "base64").toString("binary");

            const prevTD = g["TextDecoder"];
            g["TextDecoder"] = undefined;

            const sample = "Hello, 世界 😃";
            const expected = NodeBuffer.from(sample, "utf8").toString("base64");
            expect(toBase64(sample)).toBe(expected);

            expect(fromBase64("Zm9v")).toBe("foo");

            g["TextDecoder"] =
                prevTD ??
                (globalThis as unknown as { TextDecoder?: typeof TextDecoder })
                    .TextDecoder;

            const s = "Latin: áéí — Emoji: 😄";
            const b64 = toBase64(s);
            expect(fromBase64(b64)).toBe(s);
        });
    });

    describe("fromBase64 strict mode", () => {
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

        it("returns false when Buffer decoding throws", () => {
            const originalBuffer = g["Buffer"];
            g["Buffer"] = {
                from() {
                    throw new Error("decode failure");
                },
            } as unknown;

            expect(fromBase64("aGVsbG8=")).toBe(false);

            g["Buffer"] = originalBuffer;
        });
    });

    describe("fromBase64 manual fallback", () => {
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

        it("manual UTF-8 decode path without TextDecoder", () => {
            g["Buffer"] = undefined;
            g["atob"] = undefined;
            g["btoa"] = undefined;
            g["TextDecoder"] = undefined;

            const sample = "ASCII é € 😁";
            const b64 = NodeBuffer.from(sample, "utf8").toString("base64");
            const res = fromBase64(b64);
            expect(res).toBe(sample);
        });

        it("handles padding cases when decoding manually", () => {
            g["Buffer"] = undefined;
            g["atob"] = undefined;
            g["btoa"] = undefined;
            g["TextDecoder"] = undefined;

            expect(fromBase64("TQ==")).toBe("M");
            expect(fromBase64("TWE=")).toBe("Ma");
        });

        it("decodes input with non-alphabet characters via manual map fallback", () => {
            g["Buffer"] = undefined;
            g["atob"] = undefined;
            g["btoa"] = undefined;
            g["TextDecoder"] = undefined;

            const res = fromBase64("!!!!");
            expect(typeof res === "string").toBe(true);
        });

        it("returns false when manual decoding throws", () => {
            g["Buffer"] = undefined;
            g["atob"] = undefined;
            g["btoa"] = undefined;
            const OriginalMap = Map;
            // Force manualBase64DecodeToBytes to throw

            (globalThis as any).Map = class MapThrows {
                constructor() {
                    throw new Error("map fail");
                }
            };

            expect(fromBase64("TQ==")).toBe(false);

            globalThis.Map = OriginalMap;
        });

        it("covers map.has false branches during manual decode", () => {
            g["Buffer"] = undefined;
            g["atob"] = undefined;
            g["btoa"] = undefined;
            g["TextDecoder"] = undefined;
            const OriginalMap = Map;

            (globalThis as any).Map = class AlwaysFalseMap {
                has(): boolean {
                    return false;
                }
                get(): undefined {
                    return undefined;
                }
                set(): this {
                    return this;
                }
            };

            const res = fromBase64("TQ==");
            expect(typeof res === "string").toBe(true);

            globalThis.Map = OriginalMap;
        });
    });
});
