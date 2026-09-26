import { phpIntArgument } from "./cast";
import { isFiniteNumber, isInteger, isNull, isUndefined } from "./guards";
import { isPhpArrayKey } from "./keys";

/** The most items a PHP array holds: HT_MAX_SIZE on a 64-bit build. */
const PHP_MAX_ARRAY_SIZE = 2 ** 30;

/**
 * The half-open `[start, end)` window `array_slice($items, $offset, $length)`
 * selects, expressed for `Array.prototype.slice`.
 */
export type SliceRange = { start: number; end: number | undefined };

/**
 * The index `array_splice($items, $offset, $length)` starts at and the number of items it removes.
 */
export type SpliceRange = { start: number; count: number };

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
 * Resolve `array_splice`'s offset/length pair into where it starts and how many items it removes.
 *
 * The offset and the length are read as PHP reads the int parameters, dropping a fraction first, so a
 * negative offset counts back from the end before it is combined with the length, as `array_splice` does.
 *
 * @param size - The number of items being spliced.
 * @param offset - The starting index, negative to count back from the end.
 * @param length - How many items to remove, negative to stop that many from the end, or `undefined` to run to the
 * end.
 * @returns The `start` index and the `count` of items to remove.
 * @throws TypeError when the offset or the length is NAN, infinite or outside PHP's int range, which array_splice()
 * refuses.
 */
export function resolveSpliceRange(
    size: number,
    offset: number,
    length: number | undefined,
): SpliceRange {
    const from = phpIntArgument(
        offset,
        "array_splice(): Argument #2 ($offset) must be of type int, float given",
    );
    const start = from < 0 ? Math.max(size + from, 0) : Math.min(from, size);

    if (isUndefined(length)) {
        return { start, count: size - start };
    }

    const removed = phpIntArgument(
        length,
        "array_splice(): Argument #3 ($length) must be of type ?int, float given",
    );

    return {
        start,
        count: removed < 0 ? Math.max(size + removed - start, 0) : removed,
    };
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

/**
 * Resolve the length `array_pad()` pads to, reading it as PHP reads the int parameter.
 *
 * @param size - The length the caller passed, negative to pad at the beginning
 * @returns The length without its fraction
 * @throws TypeError when the length is NAN, infinite or outside PHP's int range
 * @throws Error when the length is past PHP's maximum array size, as its ValueError
 *
 * @example
 * resolvePadLength(7.5); -> 7
 * resolvePadLength(NaN); -> throws TypeError
 */
export function resolvePadLength(size: number): number {
    const length = phpIntArgument(
        size,
        "array_pad(): Argument #2 ($length) must be of type int, float given",
    );

    if (Math.abs(length) > PHP_MAX_ARRAY_SIZE) {
        throw new Error(
            "array_pad(): Argument #2 ($length) must not exceed the maximum allowed array size",
        );
    }

    return length;
}

/**
 * Resolve how many items PHP's `range()` builds from a start to an end by a step, refusing what `range()` refuses.
 *
 * A range whose bounds and step PHP holds as ints counts whole steps. Any other range rounds its size half up, and
 * `range()` then drops an item that rounding puts past the end.
 *
 * @param start - The first value
 * @param end - The value to stop at, counted down to when it is below the start
 * @param step - The distance between two values, negative only on a decreasing range
 * @returns The number of items `range()` makes room for
 * @throws Error when an argument is not a finite number, the step is 0, negative on an increasing range or longer
 * than the range, or when the range would hold 2^30 items or more, each with the message of PHP's ValueError
 *
 * @example
 * resolveRangeSize(1, 5, 1); -> 5
 * resolveRangeSize(0, 1, 0.25); -> 5
 * resolveRangeSize(1, 1e19, 1); -> throws Error
 */
export function resolveRangeSize(
    start: number,
    end: number,
    step: number,
): number {
    if (!isFiniteNumber(step)) {
        throw nonFiniteRangeArgument("#3 ($step)", step);
    }

    if (step === 0) {
        throw new Error("range(): Argument #3 ($step) cannot be 0");
    }

    if (!isFiniteNumber(start)) {
        throw nonFiniteRangeArgument("#1 ($start)", start);
    }

    if (!isFiniteNumber(end)) {
        throw nonFiniteRangeArgument("#2 ($end)", end);
    }

    if (end > start && step < 0) {
        throw new Error(
            "range(): Argument #3 ($step) must be greater than 0 for increasing ranges",
        );
    }

    const stride = Math.abs(step);
    const span = Math.abs(end - start);

    if (span !== 0 && span < stride) {
        throw new Error(
            "range(): Argument #3 ($step) must be less than the range spanned by argument #1 ($start) and argument #2 ($end)",
        );
    }

    const sized = span / stride + 1;
    // A number is one of PHP's ints exactly when PHP can store it as an array key, and PHP has no integer -0.
    const isFloatRange = ![start, end, step].every(
        (bound) => isPhpArrayKey(bound) && !Object.is(bound, -0),
    );

    if (sized >= PHP_MAX_ARRAY_SIZE) {
        throw rangeTooLarge(
            Math.min(start, end),
            Math.max(start, end),
            stride,
            isFloatRange,
        );
    }

    const whole = Math.floor(sized);

    // PHP rounds a float range's size half up, where an integer range's is floored.
    return isFloatRange && sized - whole >= 0.5 ? whole + 1 : whole;
}

/**
 * The ValueError PHP's range() throws for an argument that is NAN or INF, as a plain Error.
 *
 * @param argument - The argument's position and name, as PHP's message prints them
 * @param value - The argument, which is not a finite number
 * @returns The error to throw
 */
function nonFiniteRangeArgument(argument: string, value: number): Error {
    // PHP prints INF for either infinity.
    const provided = Number.isNaN(value) ? "NAN" : "INF";

    return new Error(
        `range(): Argument ${argument} must be a finite number, ${provided} provided`,
    );
}

/**
 * The ValueError PHP's range() throws for a range past the maximum array size, as a plain Error.
 *
 * @param low - The range's lower bound
 * @param high - The range's upper bound
 * @param stride - The step, without its sign
 * @param isFloatRange - Whether PHP holds a bound or the step as a float, which prints all three with a decimal
 * @returns The error to throw
 */
function rangeTooLarge(
    low: number,
    high: number,
    stride: number,
    isFloatRange: boolean,
): Error {
    if (isFloatRange) {
        const size = (high - low) / stride + 1;

        return new Error(
            `The supplied range exceeds the maximum array size by ${phpFixedPoint(size - PHP_MAX_ARRAY_SIZE)} elements: start=${phpFixedPoint(low)}, end=${phpFixedPoint(high)}, step=${phpFixedPoint(stride)}. Max size: ${PHP_MAX_ARRAY_SIZE}`,
        );
    }

    // Integer division, as PHP's is, exact past 2^53 where a double's would round.
    const calculated = (BigInt(high) - BigInt(low)) / BigInt(stride);

    return new Error(
        `The supplied range exceeds the maximum array size by ${calculated + 1n - BigInt(PHP_MAX_ARRAY_SIZE)} elements: start=${low}, end=${high}, step=${stride}. Calculated size: ${calculated}. Maximum size: ${PHP_MAX_ARRAY_SIZE}.`,
    );
}

/**
 * Print a number as `%.1f` prints it in PHP's messages: its exact value rounded to one decimal, an exact half to even.
 *
 * @param value - The number to print
 * @returns The number with one decimal, every digit of a large one included, or inf for a size that overflows
 */
function phpFixedPoint(value: number): string {
    // Only a range's size can overflow, and only upward.
    if (!isFiniteNumber(value)) {
        return "inf";
    }

    // Doubling is exact, so the magnitude is scaled / 2^places, and scaled * 10 / 2^places its exact tenths.
    let scaled = Math.abs(value);
    let places = 0;

    while (!isInteger(scaled)) {
        scaled *= 2;
        places++;
    }

    const divisor = 2n ** BigInt(places);
    const exact = BigInt(scaled) * 10n;
    const twiceRemainder = (exact % divisor) * 2n;
    let tenths = exact / divisor;

    if (
        twiceRemainder > divisor ||
        (twiceRemainder === divisor && tenths % 2n === 1n)
    ) {
        tenths += 1n;
    }

    // The sign follows the value, so -0.04 prints -0.0 while -0 prints 0.0.
    return `${value < 0 ? "-" : ""}${tenths / 10n}.${tenths % 10n}`;
}
