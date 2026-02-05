import { isString } from "@tolki/utils";
import { ulid as createUlid } from "ulid";

/**
 * The callback that should be used to generate ULIDs.
 */
let ulidFactory: (() => string) | null = null;

/**
 * Generate a ULID (Universally Unique Lexicographically Sortable Identifier).
 *
 * @param time - Optional time component as a Date or number of milliseconds since epoch.
 * @returns The generated ULID string.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#ulid
 *
 * @requires {@link https://www.npmjs.com/package/ulid ulid package}
 */
export function ulid(time: Date | number | null = null): string {
    if (ulidFactory) {
        return ulidFactory();
    }

    if (time === null || time === undefined) {
        return createUlid();
    }

    let ms: number;
    if (time instanceof Date) {
        ms = time.getTime();
    } else {
        ms = time;
    }

    // The ulid package only supports passing monotonic time indirectly; we can emulate by temporarily overriding Date.now
    const originalNow = Date.now;
    try {
        Date.now = () => ms; // force time component
        return createUlid();
    } finally {
        Date.now = originalNow;
    }
}

/**
 * Indicate that ULIDs should be created normally and not using a custom factory.
 *
 * @returns void.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#ulid
 *
 * @requires {@link https://www.npmjs.com/package/ulid ulid package}
 */
export function createUlidsNormally(): void {
    ulidFactory = null;
}

/**
 * Set the callable that will be used to generate ULIDs.
 *
 * @param factory - The callable ULID factory.
 * @returns void.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#ulid
 *
 * @requires {@link https://www.npmjs.com/package/ulid ulid package}
 */
export function createUlidsUsing(factory: (() => string) | null): void {
    ulidFactory = factory;
}

/**
 * Set the sequence that will be used to generate ULIDs.
 *
 * @param sequence - The sequence of ULID strings to return.
 * @param whenMissing - Optional callable to generate ULIDs when the sequence is exhausted.
 * @returns void.
 *
 * @requires {@link https://www.npmjs.com/package/ulid ulid package}
 *
 * @example
 *
 * createUlidsUsingSequence(["ulid1", "ulid2"], () => "custom-ulid");
 */
export function createUlidsUsingSequence(
    sequence: string[],
    whenMissing: (() => string) | null = null,
): void {
    let next = 0;

    whenMissing ??= function () {
        const factoryCache = ulidFactory;

        ulidFactory = null;

        const value = ulid();

        ulidFactory = factoryCache;

        next++;

        return value;
    };

    createUlidsUsing(function () {
        if (next < sequence.length) {
            return sequence[next++]!;
        }

        return whenMissing();
    });
}

/**
 * Always return the same ULID when generating new ULIDs.
 *
 * @param callback - Optional callable to execute while ULIDs are frozen.
 * @returns The frozen ULID string.
 *
 * @requires {@link https://www.npmjs.com/package/ulid ulid package}
 *
 * @example
 *
 * freezeUlids(() => "custom-ulid");
 */
export function freezeUlids(
    callback: ((value: string) => string) | null = null,
): string {
    const value = ulid();

    createUlidsUsing(() => value);

    if (callback !== null) {
        try {
            callback(value);
        } finally {
            createUlidsNormally();
        }
    }

    return value;
}

/**
 * Determine if a given value is a valid ULID.
 *
 * @param value - The value to check.
 * @returns True if the value is a valid ULID, false otherwise.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#isulid
 */
export function isUlid(value: unknown): boolean {
    if (!isString(value)) {
        return false;
    }

    const upper = value.toUpperCase();

    return /^[0-9A-HJKMNP-TV-Z]{26}$/.test(upper);
}
