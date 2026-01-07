import type { ToWords as ToWordsType } from "to-words";
import { ToWords } from 'to-words';

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
