export class Num {
    /**
     * The current default locale.
     */
    protected static _locale: string = "en";

    /**
     * The current default currency.
     */
    protected static _currency: string = "USD";

    /**
     * Format the given number according to the current locale.
     *
     * @example
     *
     * Num.format(1234.5678, 2); // "1,234.57"
     * Num.format(1234.5678, 2, 4); // "1,234.5678"
     * Num.format(1234.5678, 2, 4, "de"); // "1.234,5678"
     */
    static format(
        number: number,
        precision: number | null = null,
        maxPrecision: number | null = null,
        locale: string | null = null,
    ): string | false {
        locale = locale ?? this._locale;

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
     * @example
     *
     * Num.parse("1,234.57"); // 1234.57
     */
    static parse(value: string, locale: string | null = null): number {
        locale = locale ?? this._locale;

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
            if (sym) {
                const re = new RegExp(
                    sym.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
                    "g",
                );
                normalized = normalized.replace(re, "");
            }
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
     * @example
     *
     * Num.parseInt("1,234", "en"); // 1234
     */
    static parseInt(
        value: string,
        locale: string | null = null,
    ): number | false {
        const parsed = Num.parse(value, locale);

        if (Number.isNaN(parsed)) {
            return false;
        }

        return parsed < 0 ? Math.ceil(parsed) : Math.floor(parsed);
    }

    /**
     * Parse a string into a float according to the specified locale.
     *
     * @param  string  $string
     * @param  string|null  $locale
     * @return float|false
     */
    static parseFloat(
        value: string,
        locale: string | null = null,
    ): number | false {
        return Num.parse(value, locale);
    }

    /**
     * Spell out the given number in the given locale.
     * TODO
     */
    static spell(
        _number: number | string,
        _locale: string | null = null,
        _after: number | null = null,
        _until: number | null = null,
    ): string {
        void _number;
        void _locale;
        void _after;
        void _until;
        return "";
    }

    /**
     * Convert the given number to ordinal form.
     *
     * @example
     *
     * Num.ordinal(1); // "1st"
     * Num.ordinal(2); // "2nd"
     * Num.ordinal(3); // "3rd"
     * Num.ordinal(13); // "13th"
     */
    static ordinal(value: number, locale: string | null = null): string {
        const loc = locale ?? this._locale;

        // Prefer Intl.PluralRules with ordinal type when available; otherwise, fallback to English rules.
        try {
            const pr = new Intl.PluralRules(loc, { type: "ordinal" });
            const rule = pr.select(value);
            const lang = (loc || "en").split("-")[0] || "en";

            const suffixes: Record<string, Record<string, string>> = {
                en: { one: "st", two: "nd", few: "rd", other: "th" },
            };

            const map = suffixes[lang] ?? suffixes["en"];
            const suffix = map?.[rule] ?? map?.["other"] ?? "th";

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
     * Spell out the given number in the given locale in ordinal form.
     * TODO
     *
     * @example
     *
     * Num.spellOrdinal(1); // "first"
     * Num.spellOrdinal(2); // "second"
     * Num.spellOrdinal(3); // "third"
     */
    static spellOrdinal(_value: number, _locale: string | null = null): string {
        void _value;
        void _locale;
        return "";
    }

    /**
     * Convert the given number to its percentage equivalent.
     *
     * @example
     *
     * Num.percentage(1); // "1%"
     * Num.percentage(1.75, 2); // "1.75%"
     * Num.percentage(0.12345, 4); // "0.1235%"
     */
    static percentage(
        number: number | string,
        precision: number = 0,
        maxPrecision: number | null = null,
        locale: string | null = null,
    ): string | false {
        const loc = locale ?? this._locale;
        const value =
            typeof number === "string" ? Num.parse(number, loc) : number;

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
        const formatted = new Intl.NumberFormat(loc, options).format(
            value / 100,
        );

        return formatted;
    }

    /**
     * Convert the given number to its currency equivalent.
     *
     * @example
     *
     * Num.currency(5.00); // "$5.00"
     * Num.currency(-5); // "-$5.00"
     * Num.currency(10, 'EUR'); // "€10.00"
     */
    static currency(
        amount: number | string,
        currencyCode: string = "",
        locale: string | null = null,
        precision: number | null = null,
    ): string | false {
        const loc = locale ?? this._locale;
        const value =
            typeof amount === "string" ? Num.parse(amount, loc) : amount;
        const code =
            currencyCode && currencyCode.length ? currencyCode : this._currency;

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
     * @example
     *
     * Num.fileSize(1024); // "1 KB"
     * Num.fileSize(2048); // "2 KB"
     * Num.fileSize(1264.12345, 3); // "1.234 KB"
     */
    static fileSize(
        bytes: number | string,
        precision: number = 0,
        maxPrecision: number | null = null,
    ): string {
        // Normalize input to a number
        let value = typeof bytes === "string" ? Number(bytes) : bytes;
        if (!Number.isFinite(value)) value = 0;

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

        const formatted = Num.format(value, precision, maxPrecision) as string;
        return `${formatted} ${units[i]}`;
    }

    /**
     * Convert the number to its human-readable equivalent.
     *
     * @example
     *
     * Num.forHumans(1234); // "1.234 thousand"
     * Num.forHumans(1234567); // "1.234 million"
     * Num.forHumans(1234567890); // "1.234 billion"
     */
    static forHumans(
        value: number,
        precision: number = 0,
        maxPrecision: number | null = null,
        abbreviate: boolean = false,
    ): string | false {
        return Num.summarize(
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
     * @example
     *
     * Num.summarize(1234); // "1.234 K"
     * Num.summarize(1234567); // "1.234 M"
     * Num.summarize(1234567890); // "1.234 B"
     */
    static summarize(
        value: number,
        precision: number = 0,
        maxPrecision: number | null = null,
        units: Record<number, string> = {},
    ): string | false {
        // Default units if none provided (abbreviated form)
        if (!units || Object.keys(units).length === 0) {
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
                ? (Num.format(0, precision, maxPrecision) as string)
                : "0";
        }

        // Negative numbers
        if (value < 0) {
            const inner = Num.summarize(
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
            let lastSuffix = "";
            if (keys.length > 0) {
                const lastKey = keys[keys.length - 1];
                if (typeof lastKey === "number") {
                    lastSuffix = units[lastKey] ?? "";
                }
            }
            const inner = Num.summarize(
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
            formatted = Num.format(scaled, null, maxPrecision) as string;
        } else if (precision > 0) {
            formatted = Num.format(scaled, precision, null) as string;
        } else {
            // Default behavior:
            // - For values in thousands and scaled < 10, show one decimal when the original value is a multiple of 10.
            // - Otherwise, no decimals.
            const absValue = Math.abs(value);
            const useOneDecimal =
                displayExponent === 3 && scaled < 10 && absValue % 10 === 0;
            formatted = useOneDecimal
                ? (Num.format(scaled, null, 1) as string)
                : (Num.format(scaled, 0, null) as string);
        }
        const suffix = units[displayExponent] ?? "";

        return `${formatted}${suffix}`.trim();
    }

    /**
     * Clamp the given number between the given minimum and maximum.
     *
     * @example
     *
     * Num.clamp(5, 1, 10); // 5
     * Num.clamp(0, 1, 10); // 1
     * Num.clamp(15, 1, 10); // 10
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Split the given number into pairs of min/max values.
     *
     * @example
     *
     * Num.pairs(25, 10, 1, 1); // [[1, 11], [11, 21], [21, 25]]
     */
    static pairs(
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
     * @example
     *
     * Num.trim(12.3456789); // 12.3456789
     * Num.trim(12.34567890000); // 12.3456789
     */
    static trim(value: number): number {
        return JSON.parse(JSON.stringify(value));
    }

    /**
     * Execute the given callback using the given locale.
     *
     * @example
     *
     * Num.withLocale("fr", () => {
     *     return Num.format(1234.56);
     * }); // "1 234,56"
     */
    static withLocale(locale: string, callback: () => unknown): unknown {
        const previousLocale = this._locale;

        this.useLocale(locale);

        try {
            return callback();
        } finally {
            this.useLocale(previousLocale);
        }
    }

    /**
     * Execute the given callback using the given currency.
     *
     * @example
     *
     * Num.withCurrency("EUR", () => {
     *     return Num.format(1234.56);
     * }); // "€1,234.56"
     */
    static withCurrency(currency: string, callback: () => unknown): unknown {
        const previousCurrency = this._currency;

        this.useCurrency(currency);

        try {
            return callback();
        } finally {
            this.useCurrency(previousCurrency);
        }
    }

    /**
     * Set the default locale.
     */
    static useLocale(locale: string): void {
        this._locale = locale;
    }

    /**
     * Set the default currency.
     */
    static useCurrency(currency: string): void {
        this._currency = currency;
    }

    /**
     * Get the default locale.
     */
    static defaultLocale(): string {
        return this._locale;
    }

    /**
     * Get the default currency.
     */
    static defaultCurrency(): string {
        return this._currency;
    }
}
