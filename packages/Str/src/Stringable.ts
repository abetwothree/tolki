export { Str } from "./Str.js";

export class Stringable {
    constructor(private value: string) {}

    toString(): string {
        return String(this.value);
    }
}
