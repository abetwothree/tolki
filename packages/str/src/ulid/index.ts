import { ulid as createUlid } from "ulid";

/**
 * The callback that should be used to generate ULIDs.
 */
let ulidFactory: (() => string) | null = null;

/**
 * Generate a ULID.
 *
 * @example
 *
 * ulid(); -> "01F8MECHZX2D7J8F8C8D4B8F8C"
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
 * @example
 *
 * createUlidsNormally();
 */
export function createUlidsNormally(): void {
    ulidFactory = null;
}

/**
 * Set the callable that will be used to generate ULIDs.
 *
 * @example
 *
 * createUlidsUsing(() => of("1234").toString());
 */
export function createUlidsUsing(factory: (() => string) | null = null): void {
    ulidFactory = factory;
}

/**
 * Set the sequence that will be used to generate ULIDs.
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
