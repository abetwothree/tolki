import { Stringable } from "./Stringable.js";
import { transliterate } from 'transliteration';
import anyAscii from 'any-ascii';

export class Str {
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
     * @param  string  $subject
     * @param  string  $search
     * @return string
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
}
