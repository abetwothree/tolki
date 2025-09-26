import { isArray } from "@laravel-js/utils";

export class Replacer {
    // Compute [start, end) range on code points with PHP-like semantics for offset/length
    private static computeRange(
        size: number,
        offset: number,
        length: number | null | undefined,
    ): { start: number; end: number } {
        // Normalize start (offset may be negative)
        let start = offset >= 0 ? offset : size + offset;
        if (start < 0) start = 0;
        if (start > size) start = size;

        // Determine end
        let end: number;
        if (length === null || length === undefined) {
            end = size;
        } else if (length < 0) {
            end = size + length; // omit characters from the end
        } else {
            end = start + length;
        }

        // Clamp
        end = Math.max(0, Math.min(end, size));

        return { start, end };
    }

    private static countNonOverlapping(
        haystack: string,
        needle: string,
    ): number {
        if (needle === "") return 0;
        let count = 0;
        let pos = 0;
        while (true) {
            const idx = haystack.indexOf(needle, pos);
            if (idx === -1) break;
            count++;
            pos = idx + needle.length;
        }
        return count;
    }

    static substr(
        string: string,
        start: number,
        length: number | null = null,
    ): string {
        const chars = Array.from(string);
        const size = chars.length;

        const { start: s, end } = this.computeRange(size, start, length);

        if (s >= size || end <= s) {
            return "";
        }

        return chars.slice(s, end).join("");
    }

    static substrCount(
        haystack: string,
        needle: string,
        offset: number = 0,
        length: number | null = null,
    ): number {
        if (needle === "") {
            return 0; // safe behavior for empty needle
        }

        const chars = Array.from(haystack);
        const size = chars.length;
        const { start, end } = this.computeRange(size, offset, length);

        if (start >= size || end <= start) {
            return 0;
        }

        const segment = chars.slice(start, end).join("");
        return this.countNonOverlapping(segment, needle);
    }

    static substrReplace(
        value: string,
        replace: string | string[],
        offset: number | number[] = 0,
        length: number | number[] | null = null,
    ): string | string[] {
        const off: number = isArray(offset) ? (offset[0] ?? 0) : offset;
        const lenArg: number | null = isArray(length)
            ? ((length[0] as number) ?? null)
            : length;

        const doReplace = (rep: string): string => {
            const chars = Array.from(value);
            const size = chars.length;

            const { start, end } = this.computeRange(size, off, lenArg);
            const head = chars.slice(0, start).join("");
            const tail = chars.slice(end).join("");
            return head + rep + tail;
        };

        if (isArray(replace)) {
            return replace.map((r) => doReplace(String(r)));
        }

        return doReplace(String(replace));
    }
}
