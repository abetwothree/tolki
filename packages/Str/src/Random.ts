/**
 * Random utilities mirroring Laravel's Str::random and PHP's random_int.
 *
 * Uses a cryptographically secure RNG when available (Web Crypto / Node crypto).
 */
export class Random {
    /**
     * Generate a more truly "random" alpha-numeric string (Laravel compatible algorithm).
     *
     * @example
     * Random.string(); // 16 chars
     * Random.string(40); // 40 chars
     */
    static string(length = 16): string {
        if (!Number.isFinite(length) || length <= 0) {
            return "";
        }

        let out = "";
        while (out.length < length) {
            const remaining = length - out.length;
            const bytesSize = Math.ceil(remaining / 3) * 3; // multiple of 3 like Laravel implementation
            const bytes = secureRandomBytes(bytesSize);
            const base64 = bytesToBase64(bytes).replace(/[/+=]/g, "");
            out += base64.slice(0, remaining);
        }
        return out;
    }

    /**
     * Cryptographically secure uniform random integer in [min, max] (inclusive).
     * Mirrors PHP's random_int rejection sampling approach.
     */
    static int(min: number, max: number): number {
        if (!Number.isInteger(min) || !Number.isInteger(max)) {
            throw new TypeError("randomInt bounds must be safe integers");
        }
        if (min > max) {
            throw new RangeError("randomInt min must be <= max");
        }
        if (min === max) return min;
        if (
            Math.abs(min) > Number.MAX_SAFE_INTEGER ||
            Math.abs(max) > Number.MAX_SAFE_INTEGER
        ) {
            throw new RangeError("Bounds exceed MAX_SAFE_INTEGER");
        }

        const range = max - min;
        // Determine number of bits needed.
        const bits = Math.floor(Math.log2(range)) + 1;
        const bytesNeeded = Math.ceil(bits / 8);

        while (true) {
            const randomBytes = secureRandomBytes(bytesNeeded);
            let value = 0;
            for (let i = 0; i < bytesNeeded; i++) {
                value = (value << 8) | (randomBytes[i] as number);
            }
            // Apply mask to highest bits if bits not multiple of 8
            if (bits % 8 !== 0) {
                const shift = 8 - (bits % 8);
                value = (value >> shift) & ((1 << bits) - 1);
            }
            if (value <= range) {
                return min + value;
            }
            // else reject and retry
        }
    }
}

function secureRandomBytes(size: number): Uint8Array {
    if (size <= 0) return new Uint8Array();
    // Browser / Deno / Edge runtime
    if (typeof globalThis.crypto?.getRandomValues === "function") {
        return globalThis.crypto.getRandomValues(new Uint8Array(size));
    }
    throw new Error("Secure randomness not available in this environment");
}

function bytesToBase64(bytes: Uint8Array): string {
    const B: any = (globalThis as any).Buffer;
    if (B && typeof B.from === "function") {
        return B.from(bytes).toString("base64");
    }
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i] as number);
    }
    // btoa available in browsers
    if (typeof btoa === "function") {
        return btoa(binary);
    }
    // Fallback (very unlikely path) – manual base64 encoding
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let result = "";
    for (let i = 0; i < binary.length; i += 3) {
        const c1 = binary.charCodeAt(i);
        const c2 = binary.charCodeAt(i + 1);
        const c3 = binary.charCodeAt(i + 2);
        const e1 = c1 >> 2;
        const e2 = ((c1 & 3) << 4) | (c2 >> 4);
        const e3 = isNaN(c2) ? 64 : ((c2 & 15) << 2) | (c3 >> 6);
        const e4 = isNaN(c2) || isNaN(c3) ? 64 : c3 & 63;
        result +=
            chars.charAt(e1) +
            chars.charAt(e2) +
            chars.charAt(e3) +
            chars.charAt(e4);
    }
    return result;
}

/** Convenience alias matching PHP name */
export const random_int = (min: number, max: number) => Random.int(min, max);
