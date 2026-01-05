import { optionalRequire } from "@zinaid/utils";
import type { ToWords } from "to-words";

export class Speller {
    protected toWords: ToWords | undefined;

    protected getToWords(): ToWords {
        if (!this.toWords) {
            const ToWordsClass = optionalRequire<typeof import("to-words")>(
                "to-words",
                'The "to-words" package is required for spelling numbers. Please install it: npm install to-words',
            ).ToWords;
            this.toWords = new ToWordsClass();
        }
        return this.toWords;
    }

    public spellNumber(num: number): string {
        return this.getToWords().convert(num);
    }
}
