import { isFunction } from "@tolki/utils";

/**
 * Convert the given string to Base64 encoding.
 *
 * @param value - The string to encode.
 * @returns The Base64 encoded string.
 */
export function toBase64(value: string): string {
    const g = getGlobal() as unknown as {
        Buffer?: {
            from(
                input: string | Uint8Array,
                encoding?: string,
            ): { toString(encoding: string): string };
        };
        btoa?: (data: string) => string;
        atob?: (data: string) => string;
        TextDecoder?: typeof TextDecoder;
    };

    // Node.js
    if (g.Buffer && isFunction(g.Buffer.from)) {
        return g.Buffer.from(value, "utf8").toString("base64");
    }

    // Browser
    if (isFunction(g.btoa)) {
        try {
            const binary = utf8ToBinary(value);
            return g.btoa(binary);
        } catch {
            return g.btoa(value);
        }
    }

    // Fallback: manual Base64 from UTF-8 bytes
    const utf8Binary = utf8ToBinary(value);

    return manualBase64Encode(utf8Binary);
}

/**
 * Convert raw bytes to a Base64 string using the same fallbacks as toBase64.
 *
 * @param bytes - The bytes to encode.
 * @returns The Base64 encoded string.
 */
export function bytesToBase64(bytes: Uint8Array): string {
    const g = getGlobal() as unknown as {
        Buffer?: {
            from(data: Uint8Array): { toString(encoding: string): string };
        };
        btoa?: (data: string) => string;
    };

    if (g.Buffer && isFunction(g.Buffer.from)) {
        return g.Buffer.from(bytes).toString("base64");
    }

    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i] as number);
    }

    if (isFunction(g.btoa)) {
        return g.btoa(binary);
    }

    return manualBase64Encode(binary);
}

/**
 * Decode the given Base64 encoded string.
 *
 * @param value - The Base64 encoded string to decode.
 * @param strict - Whether to enforce strict Base64 validation.
 * @returns The decoded string or false if decoding fails.
 */
export function fromBase64(
    value: string,
    strict: boolean = false,
): string | false {
    const g = getGlobal() as unknown as {
        Buffer?: {
            from(
                input: string,
                encoding: "base64",
            ): { toString(encoding: string): string };
        };
        atob?: (data: string) => string;
        TextDecoder?: typeof TextDecoder;
    };

    let input = String(value);

    if (strict) {
        // Only allow valid Base64 alphabet with correct padding when strict.
        const cleaned = input.replace(/\s+/g, "");
        const base64Re =
            /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
        if (!base64Re.test(cleaned)) {
            return false;
        }
        input = cleaned;
    } else {
        // Be forgiving in non-strict mode: strip non-base64 characters.
        input = input.replace(/[^A-Za-z0-9+/=]/g, "");
    }

    // Node.js fast-path
    if (g.Buffer && isFunction(g.Buffer.from)) {
        try {
            return g.Buffer.from(input, "base64").toString("utf8");
        } catch {
            return false;
        }
    }

    // Browser path
    if (isFunction(g.atob)) {
        try {
            const binary = g.atob(input);

            if (typeof g.TextDecoder === "function") {
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                return new g.TextDecoder("utf-8").decode(bytes);
            }

            // Fallback UTF-8 decode via percent-encoding
            let percentEncoded = "";
            for (let i = 0; i < binary.length; i++) {
                percentEncoded +=
                    "%" + binary.charCodeAt(i).toString(16).padStart(2, "0");
            }
            return decodeURIComponent(percentEncoded);
        } catch {
            return false;
        }
    }

    // Final fallback: manual Base64 decode and UTF-8 decode
    try {
        const bytes = manualBase64DecodeToBytes(input);
        return bytesToUtf8(bytes);
    } catch {
        return false;
    }
}

/**
 * Get the global object in a way that works in all environments.
 *
 * @returns The global object.
 */
function getGlobal(): typeof globalThis {
    return globalThis;
}

/**
 * Convert a UTF-8 string to a binary string (bytes).
 *
 * @param value - The UTF-8 string to convert.
 * @returns The binary string.
 */
function utf8ToBinary(value: string): string {
    return encodeURIComponent(value).replace(
        /%([0-9A-F]{2})/g,
        (_: string, p1: string) => String.fromCharCode(parseInt(p1, 16)),
    );
}

// Manually encode a binary string (bytes) to Base64
function manualBase64Encode(binary: string): string {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let output = "";
    for (let i = 0; i < binary.length; i += 3) {
        const o1 = binary.charCodeAt(i);
        const o2 = binary.charCodeAt(i + 1);
        const o3 = binary.charCodeAt(i + 2);
        const triplet = ((o1 ?? 0) << 16) | ((o2 ?? 0) << 8) | (o3 ?? 0);
        const b1 = (triplet >> 18) & 0x3f;
        const b2 = (triplet >> 12) & 0x3f;
        const b3 = (triplet >> 6) & 0x3f;
        const b4 = triplet & 0x3f;

        if (isNaN(o2)) {
            output += chars.charAt(b1) + chars.charAt(b2) + "==";
        } else if (isNaN(o3)) {
            output +=
                chars.charAt(b1) + chars.charAt(b2) + chars.charAt(b3) + "=";
        } else {
            output +=
                chars.charAt(b1) +
                chars.charAt(b2) +
                chars.charAt(b3) +
                chars.charAt(b4);
        }
    }

    return output;
}

/**
 * Manually decode a Base64 string to bytes.
 *
 * @param input - The Base64 encoded string.
 * @returns The decoded bytes.
 */
function manualBase64DecodeToBytes(input: string): number[] {
    const alphabet =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const map = new Map<string, number>();
    for (let i = 0; i < alphabet.length; i++) {
        map.set(alphabet[i]!, i);
    }

    const clean = input.replace(/=+$/g, "");
    const bytes: number[] = [];

    for (let i = 0; i < clean.length; i += 4) {
        const c1 = map.has(clean[i]!) ? map.get(clean[i]!)! : 64;
        const c2 = map.has(clean[i + 1]!) ? map.get(clean[i + 1]!)! : 64;
        const c3 = map.has(clean[i + 2]!) ? map.get(clean[i + 2]!)! : 64;
        const c4 = map.has(clean[i + 3]!) ? map.get(clean[i + 3]!)! : 64;

        const triplet = (c1 << 18) | (c2 << 12) | ((c3 & 63) << 6) | (c4 & 63);

        const b1 = (triplet >> 16) & 0xff;
        const b2 = (triplet >> 8) & 0xff;
        const b3 = triplet & 0xff;

        bytes.push(b1);
        if (c3 !== 64) bytes.push(b2);
        if (c4 !== 64) bytes.push(b3);
    }

    return bytes;
}

/**
 * Decode UTF-8 bytes to a string.
 *
 * @param bytes - The UTF-8 bytes to decode.
 * @returns The decoded string.
 */
function bytesToUtf8(bytes: number[]): string {
    const g = getGlobal();
    if (typeof g.TextDecoder === "function") {
        return new g.TextDecoder("utf-8").decode(new Uint8Array(bytes));
    }

    // Manual UTF-8 decode
    let out = "";
    for (let i = 0; i < bytes.length; ) {
        const b1 = bytes[i++]!;
        if (b1 < 0x80) {
            out += String.fromCharCode(b1);
        } else if (b1 < 0xe0) {
            const b2 = bytes[i++]!;
            out += String.fromCharCode(((b1 & 0x1f) << 6) | (b2 & 0x3f));
        } else if (b1 < 0xf0) {
            const b2 = bytes[i++]!;
            const b3 = bytes[i++]!;
            out += String.fromCharCode(
                ((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f),
            );
        } else {
            const b2 = bytes[i++]!;
            const b3 = bytes[i++]!;
            const b4 = bytes[i++]!;
            const codepoint =
                ((b1 & 0x07) << 18) |
                ((b2 & 0x3f) << 12) |
                ((b3 & 0x3f) << 6) |
                (b4 & 0x3f);
            const offset = codepoint - 0x10000;
            out += String.fromCharCode(
                0xd800 + ((offset >> 10) & 0x3ff),
                0xdc00 + (offset & 0x3ff),
            );
        }
    }
    return out;
}
