export class Number {
    static format(
        _number: number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _precision: number | null = null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _maxPrecision: number | null = null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _locale: string | null = null,
    ): string {
        // return new Intl.NumberFormat().format(value);
        return "";
    }

    static parse(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _value: string,
    ): number {
        // return Number(value.replace(/,/g, ""));
        return 0;
    }
}
