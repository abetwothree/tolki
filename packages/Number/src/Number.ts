export class Number {
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
     * Number.format(1234.5678, 2); // "1,234.57"
     * Number.format(1234.5678, 2, 4); // "1,234.5678"
     * Number.format(1234.5678, 2, 4, "de"); // "1.234,5678"
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
     * Number.parse("1,234.57"); // 1234.57
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
     * Number.parseInt("1,234", "en"); // 1234
     */
    static parseInt(
        value: string,
        locale: string | null = null,
    ): number | false {
        const parsed = Number.parse(value, locale);

        if (globalThis.Number.isNaN(parsed)) {
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
        return Number.parse(value, locale);
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
     * Number.ordinal(1); // "1st"
     * Number.ordinal(2); // "2nd"
     * Number.ordinal(3); // "3rd"
     * Number.ordinal(13); // "13th"
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
     * Number.spellOrdinal(1); // "first"
     * Number.spellOrdinal(2); // "second"
     * Number.spellOrdinal(3); // "third"
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
     * Number.percentage(1); // "1%"
     * Number.percentage(1.75, 2); // "1.75%"
     * Number.percentage(0.12345, 4); // "0.1235%"
     */
    static percentage(
        number: number | string,
        precision: number = 0,
        maxPrecision: number | null = null,
        locale: string | null = null,
    ): string | false {
        const loc = locale ?? this._locale;
        const value =
            typeof number === "string" ? Number.parse(number, loc) : number;

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
     * Number.currency(5.00); // "$5.00"
     * Number.currency(-5); // "-$5.00"
     * Number.currency(10, 'EUR'); // "€10.00"
     */
    static currency(
        amount: number | string,
        currencyCode: string = "",
        locale: string | null = null,
        precision: number | null = null,
    ): string | false {
        const loc = locale ?? this._locale;
        const value =
            typeof amount === "string" ? Number.parse(amount, loc) : amount;
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
    static defaultLocale(): string | null {
        return this._locale;
    }

    /**
     * Get the default currency.
     */
    static defaultCurrency(): string | null {
        return this._currency;
    }
}
