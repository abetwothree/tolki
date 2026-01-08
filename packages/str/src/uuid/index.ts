import { isString } from "@zinaid/utils";
import {
    MAX as UUID_MAX,
    NIL as UUID_NIL,
    v4 as uuidv4,
    v7 as uuidv7,
    validate as uuidValidate,
    version as uuidVersion,
} from "uuid";

/**
 * The callback that should be used to generate UUIDs.
 */
let uuidFactory: (() => string) | null = null;

/**
 * Generate a UUID (version 4).
 *
 * @example
 *
 * uuid(); -> "550e8400-e29b-41d4-a716-446655440000"
 */
export function uuid(): string {
    return uuidFactory ? uuidFactory() : uuidv4();
}

/**
 * Generate a UUID (version 7).
 *
 * @example
 *
 * uuid7(); -> "550e8400-e29b-41d4-a716-446655440000"
 */
export function uuid7() {
    return uuidFactory ? uuidFactory() : uuidv7();
}

/**
 * Set the callable that will be used to generate UUIDs.
 *
 * @example
 *
 * createUuidsUsing(() => "custom-uuid");
 */
export function createUuidsUsing(factory: (() => string) | null = null): void {
    uuidFactory = factory;
}

/**
 * Set the sequence that will be used to generate UUIDs.
 *
 * @example
 *
 * createUuidsUsingSequence(["uuid1", "uuid2"], () => "custom-uuid");
 */
export function createUuidsUsingSequence(
    sequence: string[],
    whenMissing: (() => string) | null = null,
): void {
    let next = 0;

    whenMissing ??= function () {
        const factoryCache = uuidFactory;

        uuidFactory = null;

        const value = uuid();

        uuidFactory = factoryCache;

        next++;

        return value;
    };

    createUuidsUsing(function () {
        if (next < sequence.length) {
            return sequence[next++]!;
        }

        return whenMissing();
    });
}

/**
 * Always return the same UUID when generating new UUIDs.
 *
 * @example
 *
 * freezeUuids();
 */
export function freezeUuids(
    callback: ((value: string) => string) | null = null,
): string {
    const value = uuid();

    createUuidsUsing(() => value);

    if (callback !== null) {
        try {
            callback(value);
        } finally {
            createUuidsNormally();
        }
    }

    return value;
}

/**
 * Indicate that UUIDs should be created normally and not using a custom factory.
 *
 * @example
 *
 * createUuidsNormally();
 */
export function createUuidsNormally(): void {
    uuidFactory = null;
}

/**
 * Determine if a given value is a valid UUID.
 *
 * @example
 *
 * isUuid("550e8400-e29b-41d4-a716-446655440000", 4); -> true
 * isUuid("550e8400-e29b-41d4-a716-446655440000", 5); -> false
 */
export function isUuid(
    value: string | unknown,
    version: number | "nil" | "max" | null = null,
): boolean {
    if (!isString(value)) {
        return false;
    }

    // Quick fail if not a valid UUID at all when version is specified (or will be needed).
    // When version is null we keep Laravel's looser regex behavior (already close to validate())
    if (version !== null && !uuidValidate(value)) {
        return false;
    }

    if (version === null) {
        // Keep original regex (Laravels simple UUID format check) instead of uuidValidate for parity
        return /^[\da-fA-F]{8}-[\da-fA-F]{4}-[\da-fA-F]{4}-[\da-fA-F]{4}-[\da-fA-F]{12}$/.test(
            value,
        );
    }

    // Normalize special versions
    if (version === 0 || version === "nil") {
        return value.toLowerCase() === UUID_NIL;
    }

    if (version === "max") {
        return value.toLowerCase() === UUID_MAX;
    }

    // Numeric version bounds (Laravel supports 1..8 currently). Reject out of range.
    if (version < 1 || version > 8) {
        return false;
    }

    // Ensure it's a valid UUID string (already validated above for non-null) and compare versions.
    return uuidVersion(value) === version;
}
