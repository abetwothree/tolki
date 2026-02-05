import { random, randomInt, randomString } from "@tolki/str";
import { afterEach, describe, expect, it, vi } from "vitest";

const NodeBuffer = globalThis.Buffer;
const realCeil = Math.ceil;

describe("Random utilities", () => {
    describe("randomString", () => {
        afterEach(() => {
            vi.restoreAllMocks();
            vi.unstubAllGlobals();
        });

        it("defaults to 16 characters when no length is specified", () => {
            const r = randomString();
            expect(r).toHaveLength(16);
            expect(/^[A-Za-z0-9]+$/.test(r)).toBe(true);
        });

        it("returns empty string for non-positive or non-finite length", () => {
            expect(randomString(0)).toBe("");
            expect(randomString(-5)).toBe("");
            expect(randomString(NaN)).toBe("");
            expect(randomString(Infinity)).toBe("");
            expect(randomString(-Infinity)).toBe("");
            // @ts-expect-error non-number input
            expect(randomString("not-a-number")).toBe("");
        });

        it("generates alpha-numeric string of given length using default Buffer path", () => {
            const r = randomString(24);
            expect(r).toHaveLength(24);
            expect(/^[A-Za-z0-9]+$/.test(r)).toBe(true);
        });

        it("uses btoa fallback when Buffer is unavailable", () => {
            const bytes = new Uint8Array([65, 66, 67, 68, 69, 70]);
            vi.stubGlobal("Buffer", undefined);
            vi.stubGlobal("btoa", (v: string) =>
                NodeBuffer.from(v, "binary").toString("base64"),
            );
            vi.stubGlobal("crypto", {
                getRandomValues: vi.fn().mockReturnValue(bytes),
            });

            const r = randomString(5);
            expect(r).toHaveLength(5);
            expect(/^[A-Za-z0-9]+$/.test(r)).toBe(true);
        });

        it("uses manual base64 fallback when neither Buffer nor btoa exist", () => {
            const bytes = new Uint8Array([1]);
            vi.stubGlobal("Buffer", undefined);
            vi.stubGlobal("btoa", undefined);
            vi.stubGlobal("crypto", {
                getRandomValues: vi.fn().mockReturnValue(bytes),
            });

            const r = randomString(1);
            expect(r).toHaveLength(1);
            expect(/^[A-Za-z0-9]+$/.test(r)).toBe(true);
        });

        it("uses manual base64 fallback with full triplet bytes", () => {
            const bytes = new Uint8Array([0, 1, 2]);
            vi.stubGlobal("Buffer", undefined);
            vi.stubGlobal("btoa", undefined);
            vi.stubGlobal("crypto", {
                getRandomValues: vi.fn().mockReturnValue(bytes),
            });

            const r = randomString(3);
            expect(r).toHaveLength(3);
            expect(/^[A-Za-z0-9]+$/.test(r)).toBe(true);
        });

        it("handles initial zero-byte request then completes", () => {
            const ceilSpy = vi
                .spyOn(Math, "ceil")
                .mockImplementationOnce(() => 0)
                .mockImplementation((value) => realCeil(value));

            vi.stubGlobal("crypto", {
                getRandomValues: vi
                    .fn()
                    .mockReturnValue(new Uint8Array([65, 66, 67])),
            });

            const r = randomString(3);
            expect(r).toHaveLength(3);
            expect(/^[A-Za-z0-9]+$/.test(r)).toBe(true);
            expect(ceilSpy).toHaveBeenCalled();
        });

        it("throws when secure randomness is unavailable", () => {
            vi.stubGlobal("crypto", undefined);
            expect(() => randomString(8)).toThrow(
                /Secure randomness not available/i,
            );
        });
    });

    describe("random", () => {
        it("delegates Str.random to Random.string", () => {
            const r = random(24);
            expect(r).toHaveLength(24);
            expect(/^[A-Za-z0-9]+$/.test(r)).toBe(true);
        });
    });

    describe("randomInt", () => {
        afterEach(() => {
            vi.restoreAllMocks();
            vi.unstubAllGlobals();
        });

        it("randomInt yields value in inclusive range with rejection sampling", () => {
            const queue = [new Uint8Array([0b11000000]), new Uint8Array([0])];
            vi.stubGlobal("crypto", {
                getRandomValues: vi
                    .fn()
                    .mockImplementation(() => queue.shift()!),
            });

            const v = randomInt(5, 7); // range size 2 -> bits=2 -> bytesNeeded=1
            expect(v).toBeGreaterThanOrEqual(5);
            expect(v).toBeLessThanOrEqual(7);
            expect(globalThis.crypto.getRandomValues).toHaveBeenCalledTimes(2);
        });

        it("randomInt skips bitmasking when bits align to full byte", () => {
            vi.stubGlobal("crypto", {
                getRandomValues: vi.fn().mockReturnValue(new Uint8Array([42])),
            });

            expect(randomInt(0, 255)).toBe(42);
        });

        it("randomInt same min max returns that value", () => {
            expect(randomInt(7, 7)).toBe(7);
        });

        it("throws TypeError when bounds are not integers", () => {
            expect(() => randomInt(1.2, 3)).toThrow(TypeError);
            expect(() => randomInt(1, 3.4)).toThrow(TypeError);
        });

        it("throws RangeError when min is greater than max", () => {
            expect(() => randomInt(10, 5)).toThrow(RangeError);
        });

        it("throws RangeError when bounds exceed MAX_SAFE_INTEGER", () => {
            expect(() => randomInt(Number.MAX_SAFE_INTEGER + 1, 5)).toThrow(
                RangeError,
            );
            expect(() => randomInt(5, Number.MAX_SAFE_INTEGER + 2)).toThrow(
                RangeError,
            );
        });

        it("throws when secure randomness is unavailable", () => {
            vi.stubGlobal("crypto", undefined);
            expect(() => randomInt(1, 3)).toThrow(
                /Secure randomness not available/i,
            );
        });
    });
});
