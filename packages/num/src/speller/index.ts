import type { ToWords as ToWordsType } from "to-words";
import { ToWords } from "to-words";

export class Speller {
    protected toWords: ToWordsType | undefined;

    protected getToWords(): ToWords {
        if (!this.toWords) {
            this.toWords = new ToWords();
        }
        return this.toWords;
    }

    public spellNumber(num: number): string {
        return this.getToWords().convert(num);
    }
}

/**
 * Spell out the given number in the given locale.
 * @todo
 */
export function spell(
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
 * Spell out the given number in the given locale in ordinal form.
 * @todo
 *
 * @example
 *
 * spellOrdinal(1); // "first"
 * spellOrdinal(2); // "second"
 * spellOrdinal(3); // "third"
 */
export function spellOrdinal(
    _value: number,
    _locale: string | null = null,
): string {
    void _value;
    void _locale;
    return "";
}
