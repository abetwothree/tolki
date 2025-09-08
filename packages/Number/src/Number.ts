export class Number {
    /**
     * The current default locale.
     */
    protected static locale: string = "en";

    /**
     * The current default currency.
     */
    protected static currency: string = "USD";

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
        locale = locale ?? this.locale;

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
        locale = locale ?? this.locale;

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
     */
    static spell(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _number: number | string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _locale: string | null = null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _after: number | null = null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _until: number | null = null,
    ): string {
        // TODO
        return "";
    }

    /**
     * Set the default locale.
     */
    static useLocale(locale: string): void {
        this.locale = locale;
    }

    /**
     * Set the default currency.
     */
    static useCurrency(currency: string): void {
        this.currency = currency;
    }

    /**
     * Get the default locale.
     */
    static defaultLocale(): string | null {
        return this.locale;
    }

    /**
     * Get the default currency.
     */
    static defaultCurrency(): string | null {
        return this.currency;
    }
}
