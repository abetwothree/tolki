/**
 * Shared typed fixtures for `@tolki/collection` type-level tests. They exist for their inferred types;
 * this file matches neither Vitest include pattern, so it is never collected as a test.
 */

import { collect, Collection } from "@tolki/collection";

/** A read-only list: `TValue[]` rejects it, `readonly TValue[]` accepts it. */
export const readonlyNumbers: readonly number[] = [1, 2, 3];

/** A list that may be missing, as an optional property's is. */
export const maybeNumbers: number[] | undefined = [1, 2];

/** An interface-typed record: an interface has no implicit index signature. */
export interface Settings {
    a: number;
    b: number;
}

/** A `Settings` value: rejected by a `Record` constraint, taken by `T extends object`. */
export const settings: Settings = { a: 1, b: 2 };

/** A list or a record, as a value typed by both backings is. */
export const listOrRecord: readonly number[] | Record<"a" | "b", number> = [
    1, 2,
];

/**
 * A generator of numbers: an iterable that is neither an array nor a Map.
 *
 * @returns A generator yielding 1 and 2
 */
export function* numbers(): Generator<number, void, unknown> {
    yield 1;
    yield 2;
}

/** A list collection. */
export const listCollection = collect([1, 2, 3]);

/** A keyed collection whose keys are numbers, which a list's default shape would misread. */
export const numberKeyedCollection = collect(
    new Map([
        [2, "b"],
        [1, "a"],
    ]),
);

/** A class instance, which the runtime reads as the record of its own fields. */
export class Point {
    x = 1;
    y = 2;
}

/** A class instance with a method, which the runtime's copy of its own fields leaves out. */
export class User {
    name = "Taylor";

    /**
     * Greet the user.
     *
     * @returns The greeting's length
     */
    greet(): number {
        return this.name.length;
    }
}

/** An Arrayable whose toArray() answers a list. */
export class ArrayableNumbers {
    /**
     * Get the instance as an array.
     *
     * @returns The numbers
     */
    toArray(): number[] {
        return [4, 5, 6];
    }
}

/** An Arrayable whose toArray() answers a record, as a PHP array with string keys. */
export class ArrayableRecord {
    /**
     * Get the instance as an array.
     *
     * @returns The record
     */
    toArray(): { foo: string } {
        return { foo: "bar" };
    }
}

/** A JsonSerializable whose jsonSerialize() answers a list. */
export class SerializesList {
    /**
     * Specify the data which should be serialized to JSON.
     *
     * @returns The list
     */
    jsonSerialize(): string[] {
        return ["a", "b"];
    }
}

/** A JsonSerializable whose jsonSerialize() answers a record. */
export class SerializesRecord {
    /**
     * Specify the data which should be serialized to JSON.
     *
     * @returns The record
     */
    jsonSerialize(): { foo: string } {
        return { foo: "bar" };
    }
}

/** A JsonSerializable whose jsonSerialize() answers a scalar, which the runtime wraps in a list. */
export class SerializesScalar {
    /**
     * Specify the data which should be serialized to JSON.
     *
     * @returns The scalar
     */
    jsonSerialize(): string {
        return "foo";
    }
}

/** A Jsonable, whose JSON text no type can read. */
export class JsonText {
    /**
     * Convert the object to its JSON representation.
     *
     * @returns The JSON text
     */
    toJson(): string {
        return '{"foo":"bar"}';
    }
}

/** A class with JavaScript's toJSON(), which an operand read never calls: the runtime copies its own field instead. */
export class ConvertsToJSON {
    c = 1;

    /**
     * Convert the object for JSON.stringify().
     *
     * @returns The JSON value
     */
    toJSON(): string {
        return "c";
    }
}

/** A subclass carrying state of its own, which passes its items on to the base constructor. */
export class Tagged extends Collection<number, number> {
    constructor(
        items?: readonly number[] | Collection<number, number> | null,
        readonly tag: string = "",
    ) {
        super(items);
    }
}
