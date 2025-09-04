export class Number {
    static format(
        number: number,
        precision: number | null = null,
        maxPrecision: number | null = null,
        locale: string | null = null,
    ): string {
        // return new Intl.NumberFormat().format(value);
    }

    static parse(value: string): number {
        // return Number(value.replace(/,/g, ""));
    }
}
