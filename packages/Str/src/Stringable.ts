export { Str } from './Str.js'

export class Stringable {
    constructor(private value: string) {

    }

    toString(): string {
        return this.value;
    }
}
