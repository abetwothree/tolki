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

/**
 * Generate cryptographically secure random bytes.
 * Uses Web Crypto API when available, throws error otherwise.
 *
 * @param size - The number of bytes to generate.
 * @returns A Uint8Array containing cryptographically secure random bytes.
 * @throws Error if secure randomness is not available.
 *
 * @example
 *
 * secureRandomBytes(16); // -> Uint8Array(16) [random bytes]
 * secureRandomBytes(0); // -> Uint8Array(0) []
 */
function secureRandomBytes(size: number): Uint8Array {
    if (size <= 0) return new Uint8Array();
    // Browser / Deno / Edge runtime
    if (typeof globalThis.crypto?.getRandomValues === "function") {
        return globalThis.crypto.getRandomValues(new Uint8Array(size));
    }
    throw new Error("Secure randomness not available in this environment");
}

/**
 * Convert a Uint8Array to a base64 string.
 * Uses Node.js Buffer when available, falls back to btoa, or manual encoding.
 *
 * @param bytes - The bytes to convert to base64.
 * @returns The base64 encoded string.
 *
 * @example
 *
 * bytesToBase64(new Uint8Array([72, 101, 108, 108, 111])); // -> "SGVsbG8="
 * bytesToBase64(new Uint8Array([])); // -> ""
 */
function bytesToBase64(bytes: Uint8Array): string {
    const B = (
        globalThis as unknown as {
            Buffer?: {
                from(data: Uint8Array): { toString(encoding: string): string };
            };
        }
    ).Buffer;
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

/**
 * Convenience alias matching PHP's random_int function name.
 * Generates a cryptographically secure uniform random integer in [min, max] range (inclusive).
 *
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (inclusive).
 * @returns A cryptographically secure random integer between min and max (inclusive).
 * @throws TypeError if bounds are not safe integers.
 * @throws RangeError if min > max or bounds exceed MAX_SAFE_INTEGER.
 *
 * @example
 *
 * random_int(1, 10); // -> random integer between 1 and 10
 * random_int(0, 0); // -> 0
 * random_int(-5, 5); // -> random integer between -5 and 5
 */
export const random_int = (min: number, max: number) => Random.int(min, max);
