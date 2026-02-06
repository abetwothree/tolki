/**
 * The current default locale.
 */
let _locale: string = "en";

/**
 * The current default currency.
 */
let _currency: string = "USD";

/**
 * Convert the number to its human-readable equivalent.
 *
 * @param number - The number to convert.
 * @param precision - The number of decimal places to use.
 * @param maxPrecision - The maximum number of decimal places to use.
 * @returns The human-readable number string.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#abbreviate
 */
export function abbreviate(
    number: number,
    precision: number = 0,
    maxPrecision: number | null = null,
): string | false {
    return forHumans(number, precision, maxPrecision, true);
}

/**
 * Format the given number according to the current locale.
 *
 * @param number - The number to format.
 * @param precision - The number of decimal places to use.
 * @param maxPrecision - The maximum number of decimal places to use.
 * @param locale - The locale to use for formatting.
 * @returns The formatted number string.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#format
 */
export function format(
    number: number,
    precision: number | null = null,
    maxPrecision: number | null = null,
    locale: string | null = null,
): string | false {
    locale = locale ?? _locale;

    const options: Intl.NumberFormatOptions = {
        style: "decimal",
        useGrouping: true,
    };

    if (maxPrecision != null) {
        options.maximumFractionDigits = maxPrecision;
        // For max precision, don't force trailing zeros.
        options.minimumFractionDigits = 0;
    } else if (precision != null) {
        // Force exact precision (both min and max) like PHP NumberFormatter::FRACTION_DIGITS
        options.minimumFractionDigits = precision;
        options.maximumFractionDigits = precision;
    }

    return new Intl.NumberFormat(locale, options).format(number);
}

/**
 * Parse the given string according to the specified format type.
 *
 * @param value - The string to parse.
 * @param locale - The locale to use for parsing.
 * @returns The parsed number.
 *
 * @example
 *
 * parse("1,234.57"); // 1234.57
 */
export function parse(value: string, locale: string | null = null): number {
    locale = locale ?? _locale;

    // Derive locale-specific decimal and group separators using formatToParts
    const sample = 12345.6;
    const parts = new Intl.NumberFormat(locale).formatToParts(sample);

    const groupSymbols = new Set<string>();
    let decimalSymbol = ".";

    for (const p of parts) {
        if (p.type === "group") {
            groupSymbols.add(p.value);
        } else if (p.type === "decimal") {
            decimalSymbol = p.value;
        }
    }

    // Some locales use narrow no-break space or no-break space for grouping
    // Always treat common Unicode spaces as grouping as well
    const extraGroupSpaces = ["\u00A0", "\u202F", "\u2009"]; // NBSP, NNBSP, thin space
    for (const s of extraGroupSpaces) groupSymbols.add(s);

    // Build a normalized numeric string:
    // 1) Remove all grouping symbols
    // 2) Replace locale decimal symbol with '.'
    // 3) Trim spaces
    let normalized = value;
    for (const sym of groupSymbols) {
        const re = new RegExp(
            sym.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
            "g",
        );
        normalized = normalized.replace(re, "");
    }

    if (decimalSymbol !== ".") {
        const decRe = new RegExp(
            decimalSymbol.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
            "g",
        );
        // Only replace the first occurrence that acts as decimal separator; if multiple, last one typically is decimal in locales
        // But a safe approach: replace the last occurrence to '.'
        const lastIndex = normalized.lastIndexOf(decimalSymbol);
        if (lastIndex !== -1) {
            normalized =
                normalized.slice(0, lastIndex).replace(decRe, "") +
                "." +
                normalized.slice(lastIndex + decimalSymbol.length);
        }
    }

    // Remove any remaining spaces
    normalized = normalized.replace(/[\s\u00A0\u202F\u2009]+/g, "").trim();

    // Handle leading plus and minus signs, parentheses are not handled
    const result = globalThis.Number(normalized);

    return result;
}

/**
 * Parse a string into an integer according to the specified locale.
 *
 * @param value - The string to parse.
 * @param locale - The locale to use for parsing.
 * @returns The parsed integer or false if parsing fails.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#parseint
 */
export function parseInt(
    value: string,
    locale: string | null = null,
): number | false {
    const parsed = parse(value, locale);

    if (Number.isNaN(parsed)) {
        return false;
    }

    return parsed < 0 ? Math.ceil(parsed) : Math.floor(parsed);
}

/**
 * Parse a string into a float according to the specified locale.
 *
 * @param value - The string to parse.
 * @param locale - The locale to use for parsing.
 * @returns The parsed float or false if parsing fails.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#parsefloat
 */
export function parseFloat(
    value: string,
    locale: string | null = null,
): number | false {
    return parse(value, locale);
}

/**
 * Convert the given number to ordinal form.
 *
 * @param value - The number to convert.
 * @param locale - The locale to use for determining ordinal rules.
 * @returns The number in ordinal form.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#ordinal
 */
export function ordinal(value: number, locale: string | null = null): string {
    const loc = locale ?? _locale;

    // Prefer Intl.PluralRules with ordinal type when available; otherwise, fallback to English rules.
    try {
        const pr = new Intl.PluralRules(loc, { type: "ordinal" });
        const rule = pr.select(value);
        // loc is guaranteed to be a valid locale here (invalid ones throw above)
        const lang = String(loc.split("-")[0]);

        const enSuffixes: Record<string, string> = {
            one: "st",
            two: "nd",
            few: "rd",
            other: "th",
        };
        const suffixes: Record<string, Record<string, string>> = {
            en: enSuffixes,
        };

        // Use English suffixes as fallback for unsupported languages
        const map = suffixes[lang] ?? enSuffixes;
        // Fall back to "other" suffix if specific rule not found
        const suffix = map[rule] ?? map["other"];

        return `${value}${suffix}`;
    } catch {
        const v = Math.abs(value);
        const mod100 = v % 100;
        if (mod100 >= 11 && mod100 <= 13) {
            return `${value}th`;
        }
        switch (v % 10) {
            case 1:
                return `${value}st`;
            case 2:
                return `${value}nd`;
            case 3:
                return `${value}rd`;
            default:
                return `${value}th`;
        }
    }
}

/**
 * Convert the given number to its percentage equivalent.
 *
 * @param number - The number to convert.
 * @param precision - The number of decimal places to use.
 * @param maxPrecision - The maximum number of decimal places to use.
 * @param locale - The locale to use for formatting.
 * @returns The formatted percentage string.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#percentage
 */
export function percentage(
    number: number | string,
    precision: number = 0,
    maxPrecision: number | null = null,
    locale: string | null = null,
): string | false {
    const loc = locale ?? _locale;
    const value = typeof number === "string" ? parse(number, loc) : number;

    const options: Intl.NumberFormatOptions = {
        style: "percent",
        useGrouping: true,
    };

    if (maxPrecision != null) {
        options.maximumFractionDigits = maxPrecision;
        options.minimumFractionDigits = 0;
    } else {
        options.minimumFractionDigits = precision;
        options.maximumFractionDigits = precision;
    }

    // Intl percent multiplies by 100; we divide to match Laravel behavior
    const formatted = new Intl.NumberFormat(loc, options).format(value / 100);

    return formatted;
}

/**
 * Convert the given number to its currency equivalent.
 *
 * @param amount - The amount to convert.
 * @param currencyCode - The currency code to use (e.g. "USD", "EUR").
 * @param locale - The locale to use for formatting.
 * @param precision - The number of decimal places to use.
 * @returns The formatted currency string.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#currency
 */
export function currency(
    amount: number | string,
    currencyCode: string = "",
    locale: string | null = null,
    precision: number | null = null,
): string | false {
    const loc = locale ?? _locale;
    const value = typeof amount === "string" ? parse(amount, loc) : amount;
    const code = currencyCode && currencyCode.length ? currencyCode : _currency;

    const options: Intl.NumberFormatOptions = {
        style: "currency",
        currency: code,
        useGrouping: true,
    };

    if (precision != null) {
        options.minimumFractionDigits = precision;
        options.maximumFractionDigits = precision;
    }

    return new Intl.NumberFormat(loc, options).format(value);
}

/**
 * Convert the given number to its file size equivalent.
 *
 * @param bytes - The number of bytes.
 * @param precision - The number of decimal places to use.
 * @param maxPrecision - The maximum number of decimal places to use.
 * @returns The formatted file size string.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#filesize
 */
export function fileSize(
    bytes: number | string,
    precision: number = 0,
    maxPrecision: number | null = null,
): string {
    // Normalize input to a number
    let value = typeof bytes === "string" ? Number(bytes) : bytes;
    if (!Number.isFinite(value)) {
        value = 0;
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB",
        "TB",
        "PB",
        "EB",
        "ZB",
        "YB",
    ] as const;
    const unitCount = units.length;

    let i = 0;
    // Scale bytes up to the largest appropriate unit, matching Laravel's 0.9 threshold
    while (value / 1024 > 0.9 && i < unitCount - 1) {
        value /= 1024;
        i++;
    }

    const formatted = format(value, precision, maxPrecision) as string;
    return `${formatted} ${units[i]}`;
}

/**
 * Convert the number to its human-readable equivalent.
 *
 * @param value - The number to convert.
 * @param precision - The number of decimal places to use.
 * @param maxPrecision - The maximum number of decimal places to use.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#forhumans
 */
export function forHumans(
    value: number,
    precision: number = 0,
    maxPrecision: number | null = null,
    abbreviate: boolean = false,
): string | false {
    return summarize(
        value,
        precision,
        maxPrecision,
        abbreviate
            ? {}
            : {
                  3: " thousand",
                  6: " million",
                  9: " billion",
                  12: " trillion",
                  15: " quadrillion",
              },
    );
}

/**
 * Convert the number to its human-readable equivalent.
 *
 * @param value - The number to convert.
 * @param precision - The number of decimal places to use.
 * @param maxPrecision - The maximum number of decimal places to use.
 * @param units - Custom units mapping (exponent to suffix).
 * @returns The summarized number string.
 *
 * @example
 *
 * summarize(1234); // "1.234 K"
 * summarize(1234567); // "1.234 M"
 * summarize(1234567890); // "1.234 B"
 */
export function summarize(
    value: number,
    precision: number = 0,
    maxPrecision: number | null = null,
    units: Record<number, string> = {},
): string | false {
    // Default units if none provided (abbreviated form)
    if (Object.keys(units).length === 0) {
        units = {
            3: "K",
            6: "M",
            9: "B",
            12: "T",
            15: "Q",
        };
    }

    // Zero handling
    if (Number(value) === 0) {
        return precision > 0
            ? (format(0, precision, maxPrecision) as string)
            : "0";
    }

    // Negative numbers
    if (value < 0) {
        const inner = summarize(
            Math.abs(value),
            precision,
            maxPrecision,
            units,
        ) as string;
        return `-${inner}`;
    }

    // Extremely large numbers: recurse on quadrillions and append the last unit (Laravel-style)
    if (value >= 1e15) {
        const keys = Object.keys(units)
            .map((k) => Number(k))
            .filter((k) => !Number.isNaN(k))
            .sort((a, b) => a - b);
        // At this point, units is guaranteed to have at least the default keys (3, 6, 9, 12, 15)
        // so keys array will always have elements and lastKey will always be a number
        const lastKey = keys[keys.length - 1] as number;
        const lastSuffix = units[lastKey];
        const inner = summarize(
            value / 1e15,
            precision,
            maxPrecision,
            units,
        ) as string;
        return `${inner}${lastSuffix}`.trim();
    }

    // Determine the display exponent (multiple of 3)
    const numberExponent = Math.floor(Math.log10(value));
    const displayExponent = numberExponent - (numberExponent % 3);
    const scaled = value / Math.pow(10, displayExponent);

    // Precision behavior: mirror Laravel
    // - If maxPrecision provided: set only maximumFractionDigits
    // - Otherwise use exact precision (default 0)
    let formatted: string;
    if (maxPrecision != null) {
        formatted = format(scaled, null, maxPrecision) as string;
    } else if (precision > 0) {
        formatted = format(scaled, precision, null) as string;
    } else {
        // Default behavior:
        // - For values in thousands and scaled < 10, show one decimal when the original value is a multiple of 10.
        // - Otherwise, no decimals.
        const absValue = Math.abs(value);
        const useOneDecimal =
            displayExponent === 3 && scaled < 10 && absValue % 10 === 0;
        formatted = useOneDecimal
            ? (format(scaled, null, 1) as string)
            : (format(scaled, 0, null) as string);
    }
    const suffix = units[displayExponent] ?? "";

    return `${formatted}${suffix}`.trim();
}

/**
 * Clamp the given number between the given minimum and maximum.
 *
 * @param value - The number to clamp.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns The clamped number.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#clamp
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Split the given number into pairs of min/max values.
 *
 * @param to - The maximum value.
 * @param by - The size of each pair.
 * @param start - The starting value.
 * @param offset - The offset to apply to the upper bound of each pair.
 * @returns An array of [min, max] pairs.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#pairs
 */
export function pairs(
    to: number,
    by: number,
    start: number = 0,
    offset: number = 1,
): [number, number][] {
    const output: [number, number][] = [];

    for (let lower = start; lower < to; lower += by) {
        let upper = lower + by - offset;

        if (upper > to) {
            upper = to;
        }

        output.push([lower, upper]);
    }

    return output;
}

/**
 * Remove any trailing zero digits after the decimal point of the given number.
 *
 * @param value - The number to trim.
 * @returns The trimmed number.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#trim
 */
export function trim(value: number): number {
    return JSON.parse(JSON.stringify(value));
}

/**
 * Convert a duration in minutes to a human-readable format.
 *
 * @param minutes - The duration in minutes.
 * @param round - Whether to round to the nearest unit.
 * @returns The human-readable duration string.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#minutestohuman
 */
export function minutesToHuman(
    minutes: number | string,
    round: boolean = true,
): string {
    const seconds = Number(minutes) * 60;

    return secondsToHuman(seconds, round);
}

/**
 * Convert a duration in seconds to a human-readable format.
 *
 * @param seconds The duration in seconds.
 * @param round Whether to round to the nearest unit.
 * @returns The human-readable duration string.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#secondstohuman
 */
export function secondsToHuman(
    seconds: number | string,
    round: boolean = true,
): string {
    // When round = true: choose the single most appropriate unit, rounding to nearest.
    // Threshold to promote to a larger unit is half of that unit (e.g. 30s -> 1 minute).
    // When round = false: return a full breakdown (e.g. "1 hour, 2 minutes, 5 seconds").
    let totalSeconds = Number(seconds);
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
        totalSeconds = 0;
    }

    if (totalSeconds === 0) return "0 seconds";

    const SECOND = 1;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;
    const MONTH = 4 * WEEK; // consistent with earlier logic (4-week months)
    const YEAR = 12 * MONTH; // 48 weeks

    const units: [name: string, seconds: number][] = [
        ["year", YEAR],
        ["month", MONTH],
        ["week", WEEK],
        ["day", DAY],
        ["hour", HOUR],
        ["minute", MINUTE],
        ["second", SECOND],
    ];

    if (round) {
        // Pick first unit where ratio >= 0.5 (nearest unit heuristic)
        for (const [name, unitSeconds] of units) {
            const ratio = totalSeconds / unitSeconds;
            if (ratio >= 0.5 || unitSeconds === SECOND) {
                const count = Math.round(ratio);
                return `${count} ${name}${count === 1 ? "" : "s"}`;
            }
        }
    }

    // Detailed breakdown
    let remaining = totalSeconds;
    const parts: string[] = [];
    for (const [name, unitSeconds] of units) {
        if (remaining >= unitSeconds) {
            const count = Math.floor(remaining / unitSeconds);
            remaining -= count * unitSeconds;
            parts.push(`${count} ${name}${count === 1 ? "" : "s"}`);
        }
    }

    return parts.join(", ");
}

/**
 * Execute the given callback using the given locale.
 *
 * @param locale - The locale to use.
 * @param callback - The callback to execute.
 * @returns The result of the callback.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#withlocale
 */
export function withLocale<TReturn>(
    locale: string,
    callback: () => TReturn,
): TReturn | void {
    const previousLocale = _locale;

    useLocale(locale);

    try {
        return callback();
    } finally {
        useLocale(previousLocale);
    }
}

/**
 * Execute the given callback using the given currency.
 *
 * @param currency - The currency to use.
 * @param callback - The callback to execute.
 * @returns The result of the callback.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#withcurrency
 */
export function withCurrency<TReturn>(
    currency: string,
    callback: () => TReturn,
): TReturn | void {
    const previousCurrency = _currency;

    useCurrency(currency);

    try {
        return callback();
    } finally {
        useCurrency(previousCurrency);
    }
}

/**
 * Set the default locale.
 *
 * @param locale - The locale to set.
 * @returns void
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#uselocale
 */
export function useLocale(locale: string): void {
    _locale = locale;
}

/**
 * Set the default currency.
 *
 * @param currency - The currency to set.
 * @returns void
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#usecurrency
 */
export function useCurrency(currency: string): void {
    _currency = currency;
}

/**
 * Get the configured default locale.
 *
 * @returns The default locale.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#defaultlocale
 */
export function defaultLocale(): string {
    return _locale;
}

/**
 * Get the configured default currency.
 *
 * @returns The default currency.
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#defaultcurrency
 */
export function defaultCurrency(): string {
    return _currency;
}
