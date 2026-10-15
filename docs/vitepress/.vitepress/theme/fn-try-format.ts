/**
 * Formats a value the way a JavaScript console would show it, compactly.
 *
 * @param value - The value a playground function returned.
 * @returns The display text.
 */
export function formatResult(value: unknown): string {
    return format(value, []);
}

/**
 * Formats a thrown value, naming the error class when it is not a plain Error.
 *
 * @param error - The thrown value.
 * @returns The display text.
 */
export function formatError(error: unknown): string {
    if (error instanceof Error) {
        return error.name === "Error"
            ? error.message
            : `${error.name}: ${error.message}`;
    }

    return String(error);
}

/**
 * Sizes a JSON textarea to its text, between 2 rows and a maximum.
 *
 * @param text - The textarea's current text.
 * @param max - The most rows the box may grow to.
 * @returns The row count.
 */
export function jsonRows(text: string, max = 8): number {
    return Math.min(max, Math.max(2, text.split("\n").length));
}

/**
 * Runs a playground call and formats its outcome, catching a failure in either step.
 *
 * @param run - The call to run.
 * @returns Whether it succeeded, and the display text of the result or error.
 */
export function runForDisplay(run: () => unknown): {
    ok: boolean;
    value: string;
} {
    try {
        return { ok: true, value: formatResult(run()) };
    } catch (error) {
        return { ok: false, value: formatError(error) };
    }
}

/**
 * Formats one value, tracking its ancestors to detect cycles.
 *
 * @param value - The value to format.
 * @param ancestors - The objects currently being formatted above this value.
 * @returns The display text.
 */
function format(value: unknown, ancestors: object[]): string {
    if (typeof value === "string") {
        return JSON.stringify(value);
    }

    if (typeof value === "number") {
        return Object.is(value, -0) ? "-0" : String(value);
    }

    if (typeof value === "bigint") {
        return `${value}n`;
    }

    if (typeof value === "function") {
        return `[Function ${value.name || "(anonymous)"}]`;
    }

    if (typeof value !== "object" || value === null) {
        return String(value);
    }

    if (ancestors.includes(value)) {
        return "[Circular]";
    }

    const path = [...ancestors, value];

    if ("toJSON" in value && typeof value.toJSON === "function") {
        return format(value.toJSON(), path);
    }

    if (Array.isArray(value)) {
        return `[${value.map((item) => format(item, path)).join(",")}]`;
    }

    if (value instanceof Map) {
        const pairs = [...value].map(
            ([key, item]) => `${format(key, path)} => ${format(item, path)}`,
        );

        return `Map(${value.size}) {${pairs.join(", ")}}`;
    }

    if (value instanceof Set) {
        const items = [...value].map((item) => format(item, path));

        return `Set(${value.size}) {${items.join(", ")}}`;
    }

    const entries = Object.entries(value).map(
        ([key, item]) => `${JSON.stringify(key)}:${format(item, path)}`,
    );
    const prototype: unknown = Object.getPrototypeOf(value);
    const body = `{${entries.join(",")}}`;

    if (prototype === null || prototype === Object.prototype) {
        return body;
    }

    return `${value.constructor.name} ${body}`;
}
