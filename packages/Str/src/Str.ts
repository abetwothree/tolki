import { Stringable } from "./Stringable.js";
import { transliterate } from "transliteration";
import anyAscii from "any-ascii";
import { ConvertCase, type ConvertCaseMode, CaseTypes } from "./ConvertCase.js";
import { max } from "lodash-es";

export class Str {
    private static $camelCache = new Map<string, string>();

    static of(value: string): Stringable {
        return new Stringable(value);
    }

    /**
     * Return the remainder of a string after the last occurrence of a given value.
     *
     * @example
     *
     * Str.after('A house on a lake', 'house ') returns 'on a lake'
     */
    static after(subject: string, search: string | number): string {
        if (search === "") {
            return subject;
        }

        const needle = String(search);
        const index = subject.indexOf(needle);

        if (index === -1) {
            return subject;
        }

        return subject.slice(index + needle.length);
    }

    /**
     * Return the remainder of a string after the last occurrence of a given value.
     *
     * @example
     *
     * Str.afterLast('A house on a lake', 'a') returns ' lake'
     */
    static afterLast(subject: string, search: string | number): string {
        if (search === "") {
            return subject;
        }

        const position = subject.lastIndexOf(String(search));

        if (position === -1) {
            return subject;
        }

        return subject.slice(position + String(search).length);
    }

    /**
     * Transliterate a UTF-8 value to ASCII.
     *
     * @example
     *
     * Str.ascii('Héllo Wörld') returns 'Hello World'
     */
    static ascii(value: string): string {
        return transliterate(value);
    }

    /**
     * Transliterate a string to its closest ASCII representation.
     *
     * @example
     *
     * Str.transliterate('ⓣⓔⓢⓣ@ⓛⓐⓡⓐⓥⓔⓛ.ⓒⓞⓜ') returns 'test@laravel.com'
     */
    static transliterate(value: string): string {
        return anyAscii(value);
    }

    /**
     * Get the portion of a string before the first occurrence of a given value.
     *
     * @example
     *
     * Str.before('hannah', 'nah') returns 'han'
     */
    static before(subject: string, search: string | number): string {
        if (search === "") {
            return subject;
        }

        const result = subject.indexOf(String(search));

        return result === -1 ? subject : subject.slice(0, result);
    }

    /**
     * Get the portion of a string before the last occurrence of a given value.
     *
     * @example
     *
     * Str.beforeLast('yvette', 'tte') returns 'yve'
     */
    static beforeLast(subject: string, search: string | number): string {
        if (search === "") {
            return subject;
        }

        const pos = subject.lastIndexOf(String(search));

        if (pos === -1) {
            return subject;
        }

        return subject.slice(0, pos);
    }

    /**
     * Get the portion of a string between two given values.
     *
     * @example
     *
     * Str.between('foofoobar', 'foo', 'bar') returns 'foo'
     */
    static between(
        subject: string,
        from: string | number,
        to: string | number,
    ): string {
        if (from === "" || to === "") {
            return subject;
        }

        return Str.beforeLast(Str.after(subject, from), to);
    }

    /**
     * Get the smallest possible portion of a string between two given values.
     *
     * @example
     *
     * Str.betweenFirst('foofoobar', 'foo', 'bar') returns 'foo'
     */
    static betweenFirst(
        subject: string,
        from: string | number,
        to: string | number,
    ): string {
        if (from === "" || to === "") {
            return subject;
        }

        return Str.before(Str.after(subject, from), to);
    }

    /**
     * Convert a value to camel case.
     *
     * @example
     *
     * Str.camel('foo_bar') returns 'fooBar'
     */
    static camel(value: string): string {
        if (this.$camelCache.has(value)) {
            return this.$camelCache.get(value)!;
        }

        // TODO
        // return this.$camelCache.set(value, lcfirst(this.studly(value)));
    }

    /**
     * Get the character at the specified index.
     *
     * @example
     *
     * Str.charAt('hello', 1) returns 'e'
     */
    static charAt(subject: string, index: number): string | false {
        const length = subject.length;

        if (index < 0 ? index < -length : index > length - 1) {
            return false;
        }

        // if index is a negative number, we need to adjust it
        if (index < 0) {
            index += length;
        }

        return subject.charAt(index);
    }

    /**
     * Remove the given string(s) if it exists at the start of the haystack.
     *
     * @example
     *
     * Str.chopStart('foobar', 'foo') returns 'bar'
     */
    static chopStart(subject: string, needle: string | string[]): string {
        for (const n of Array.isArray(needle) ? needle : [needle]) {
            if (subject.startsWith(n)) {
                return subject.slice(n.length);
            }
        }

        return subject;
    }

    /**
     * Remove the given string(s) if it exists at the end of the haystack.
     *
     * @example
     *
     * Str.chopEnd('foobar', 'bar') returns 'foo'
     */
    static chopEnd(subject: string, needle: string | string[]): string {
        for (const n of Array.isArray(needle) ? needle : [needle]) {
            if (subject.endsWith(n)) {
                return subject.slice(0, -n.length);
            }
        }

        return subject;
    }

    /**
     * Determine if a given string contains a given substring.
     *
     * @example
     *
     * Str.contains('Minion', 'ni') returns true
     * Str.contains('Minion', 'Ni', true) returns true
     * Str.contains('Minion', 'Ni', false) returns false
     */
    static contains(
        haystack: string,
        needles: string | Iterable<string>,
        ignoreCase = false,
    ): boolean {
        if (ignoreCase) {
            haystack = haystack.toLowerCase();
        }

        let needlesArray: string[];
        if (typeof needles === "string") {
            needlesArray = [needles];
        } else {
            needlesArray = Array.from(needles);
        }

        for (let needle of needlesArray) {
            if (ignoreCase) {
                needle = needle.toLowerCase();
            }

            if (needle !== "" && haystack.includes(needle)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine if a given string contains all array values.
     *
     * @example
     *
     * Str.containsAll('Taylor Otwell', ['taylor', 'otwell'], false) returns true
     * Str.containsAll('Taylor Otwell', ['taylor', 'xxx'], true) returns false
     */
    static containsAll(
        haystack: string,
        needles: Iterable<string>,
        ignoreCase = false,
    ): boolean {
        for (const needle of needles) {
            if (!Str.contains(haystack, needle, ignoreCase)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Determine if a given string doesn't contain a given substring.
     *
     * @example
     *
     * Str.doesntContain('Minion', 'ni') returns false
     * Str.doesntContain('Minion', 'Ni', true) returns false
     * Str.doesntContain('Minion', 'Ni', false) returns true
     */
    static doesntContain(
        haystack: string,
        needles: string | Iterable<string>,
        ignoreCase = false,
    ): boolean {
        return !Str.contains(haystack, needles, ignoreCase);
    }

    /**
     * Convert the case of a string.
     *
     * @example
     *
     * Str.convertCase('hello', CaseTypes.upper) returns 'HELLO'
     */
    static convertCase(value: string, mode: ConvertCaseMode = CaseTypes.fold) {
        return new ConvertCase(value, mode).convert();
    }

    /**
     * Replace consecutive instances of a given character with a single character in the given string.
     *
     * @example
     *
     * Str.deduplicate('hello  world') returns 'hello world'
     * Str.deduplicate('hello---world', '-') returns 'hello-world'
     * Str.deduplicate('hello___world', '_') returns 'hello-world'
     * Str.deduplicate('hello  world', ' ') returns 'hello world'
     */
    static deduplicate(value: string, character: string | string[] = " ") {
        if (Array.isArray(character)) {
            character.forEach((char) => {
                value = value.replace(new RegExp(`${char}+`, "g"), char);
            });
            return value;
        }

        return value.replace(new RegExp(`${character}+`, "g"), character);
    }

    /**
     * Extracts an excerpt from text that matches the first instance of a phrase.
     *
     * @example
     */
    static excerpt(
        text: string,
        phrase: string = "",
        options: Record<string, any> = {},
    ): string | null {
        const radius = options["radius"] ?? 100;
        const omission = options["omission"] ?? "...";

        const matches = text.match(/^(.*?)(\$\{phrase\})(.*)$/iu);

        if (!matches) {
            return null;
        }

        const start = matches[1]?.trim();

        // TODO

        // start = Str.of(start, max(start?.length - radius, 0), radius.length)->ltrim()->unless(
        //     (startWithRadius) => startWithRadius.exactly(start),
        //     (startWithRadius) => startWithRadius.prepend(omission),
        // );

        // const end = rtrim(matches[3]);

        // end = Str.of(mb_substr(end, 0, radius, 'UTF-8'))->rtrim()->unless(
        //     (endWithRadius) => endWithRadius.exactly(end),
        //     (endWithRadius) => endWithRadius.append(omission),
        // );

        // return start.append(matches[2], end).toString();
    }

    /**
     * Cap a string with a single instance of a given value.
     *
     * @example
     *
     * Str.finish('hello', '!') returns 'hello!'
     */
    static finish(value: string, cap: string): string {
        const quoted = cap.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        return value.replace(new RegExp(`(?:${quoted})+$`, "u"), "") + cap;
    }

    /**
     * Wrap the string with the given strings.
     *
     * @example
     *
     * Str.wrap('hello', '[', ']') returns '[hello]'
     */
    static wrap(
        value: string,
        before: string,
        after: string | null = null,
    ): string {
        return before + value + (after ?? before);
    }
}
