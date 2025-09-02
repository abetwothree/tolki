import { Stringable } from "./Stringable.js";
import { transliterate } from 'transliteration';
import anyAscii from 'any-ascii';

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
        if (search === '') {
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
    static ascii(value: string): string
    {
        return transliterate(value);
    }

     /**
     * Transliterate a string to its closest ASCII representation.
     * 
     * @example
     * 
     * Str.transliterate('ⓣⓔⓢⓣ@ⓛⓐⓡⓐⓥⓔⓛ.ⓒⓞⓜ') returns 'test@laravel.com'
     */
    static transliterate(value: string): string
    {
        return anyAscii(value);
    }

    /**
     * Get the portion of a string before the first occurrence of a given value.
     *
     * @example
     * 
     * Str.before('hannah', 'nah') returns 'han'
     */
    static before(subject: string, search: string | number): string
    {
        if (search === '') {
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
    static beforeLast(subject: string, search: string | number): string
    {
        if (search === '') {
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
    static between(subject: string, from: string | number, to: string | number): string
    {
        if (from === '' || to === '') {
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
    static betweenFirst(subject: string, from: string | number, to: string | number): string
    {
        if (from === '' || to === '') {
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
    static camel(value: string): string
    {
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
    static charAt(subject: string, index: number): string | false
    {
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
}
