import { isInteger, isNull } from "./guards";

/**
 * The half-open `[start, end)` window `array_slice($items, $offset, $length)`
 * selects, expressed for `Array.prototype.slice`.
 */
export type SliceRange = { start: number; end: number | undefined };

/**
 * Resolve `array_slice`'s offset/length pair into a slice window.
 *
 * A negative offset is normalised against the item count BEFORE it is
 * combined with the length, matching `array_slice` — a raw negative offset
 * fed straight into `Array.prototype.slice` combines the two differently.
 *
 * @param count - The number of items being sliced.
 * @param offset - The starting index, negative to count back from the end.
 * @param length - How many items to take, negative to stop that many from
 * the end, or `null` to run to the end.
 * @returns The `start` and `end` bounds to slice with.
 */
export function resolveSliceRange(
    count: number,
    offset: number,
    length: number | null,
): SliceRange {
    const start = offset < 0 ? Math.max(count + offset, 0) : offset;
    const end = isNull(length)
        ? undefined
        : length >= 0
          ? start + length
          : Math.max(start, count + length);

    return { start, end };
}

/**
 * Resolve how many items Laravel's `shift()` and `pop()` take: one per item of `range(1, min($count, $size))`.
 *
 * PHP's `min()` answers `$size` over a `NAN` count, so `NAN` takes every item, and a fraction is dropped.
 *
 * @param count - How many items the caller asked for, above 0
 * @param size - How many items there are
 * @returns The number of items to take
 * @throws Error for a fractional count below 2 that the items do not cap, as PHP's range() throws its ValueError
 *
 * @example
 * resolveTakeCount(2.5, 4); -> 2
 * resolveTakeCount(NaN, 4); -> 4
 * resolveTakeCount(1.5, 4); -> throws Error
 */
export function resolveTakeCount(count: number, size: number): number {
    const end = Number.isNaN(count) ? size : Math.min(count, size);

    // range() refuses a float end less than its step of 1 away from its start of 1.
    if (!isInteger(end) && end < 2) {
        throw new Error(
            "range(): Argument #3 ($step) must be less than the range spanned by argument #1 ($start) and argument #2 ($end)",
        );
    }

    return Math.floor(end);
}
