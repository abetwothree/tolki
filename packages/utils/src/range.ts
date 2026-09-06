import { isNull } from "./guards";

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
