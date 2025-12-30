/**
 * Random utilities mirroring Laravel's Str::random and PHP's random_int.
 *
 * Uses a cryptographically secure RNG when available (Web Crypto / Node crypto).
 */

import { bytesToBase64 } from "@aid/str";

/**
 * Generate a more truly "random" alpha-numeric string (Laravel compatible algorithm).
 *
 * @param length - The length of the random string to generate. Default is 16.
 * @returns A random alpha-numeric string of the specified length.
 *
 * @example
 * Random.string(); // 16 chars
 * Random.string(40); // 40 chars
 */
export function randomString(length = 16): string {
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
 *
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (inclusive).
 * @returns A cryptographically secure random integer between min and max (inclusive).
 * @throws TypeError if bounds are not safe integers.
 * @throws RangeError if min > max or bounds exceed MAX_SAFE_INTEGER.
 */
export function randomInt(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new TypeError("randomInt bounds must be safe integers");
    }

    if (min > max) {
        throw new RangeError("randomInt min must be <= max");
    }

    if (min === max) {
        return min;
    }

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
 * secureRandomBytes(16); -> Uint8Array(16) [random bytes]
 * secureRandomBytes(0); -> Uint8Array(0) []
 */
function secureRandomBytes(size: number): Uint8Array {
    if (size <= 0) return new Uint8Array();
    // Browser / Deno / Edge runtime
    if (typeof globalThis.crypto?.getRandomValues === "function") {
        return globalThis.crypto.getRandomValues(new Uint8Array(size));
    }
    throw new Error("Secure randomness not available in this environment");
}
