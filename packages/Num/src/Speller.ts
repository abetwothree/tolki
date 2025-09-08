import { ToWords } from "to-words";

export class Speller {
    protected toWords: ToWords;

    constructor() {
        this.toWords = new ToWords();
    }

    public spellNumber(num: number): string {
        return this.toWords.convert(num);
    }
}
