/**
 * Shared typed fixtures for `@tolki/collection` type-level tests. They exist for their inferred types;
 * this file matches neither Vitest include pattern, so it is never collected as a test.
 */

import { collect, Collection } from "@tolki/collection";
import type { DataItems } from "@tolki/types";

/** A list: the backing a list collection holds. */
export const numberList = [1, 2, 3];

/** A read-only list: `TValue[]` rejects it, `readonly TValue[]` accepts it. */
export const readonlyNumbers: readonly number[] = [1, 2, 3];

/** A record with literal keys: the backing a keyed collection holds. */
export const abc = { a: 1, b: 2, c: 3 };

/** The row type the list of rows holds. */
export interface Row {
    id: number;
    name: string;
}

/** A list of rows, for the methods that read an item's fields. */
export const rows: Row[] = [
    { id: 1, name: "Ada" },
    { id: 2, name: "Grace" },
];

/** A row whose name may be null, as a nullable column's value is. */
export interface NullableRow {
    id: number;
    name: string | null;
}

/** A list of rows whose name may be null. */
export const nullableRows: NullableRow[] = [
    { id: 1, name: "Ada" },
    { id: 2, name: null },
];

/** A list of lists, for the methods that collapse or flatten it. */
export const nestedLists = [[1, 2], [3]];

/** A record of lists, for the same methods over a keyed backing. */
export const recordOfLists = { a: [1, 2], b: [3] };

/** A list of values of several types, null among them. */
export const mixed = [1, "x", null];

/** A Map whose integer keys are not in ascending order: an order a plain object cannot keep. */
export const mapBuilt = new Map([
    [2, "c"],
    [0, "a"],
    [1, "b"],
]);

/** A value of `DataItems`, the data packages' input type: a list or a record, as generic code hands one over. */
export const unionItems: DataItems<number, string> = [1, 2, 3];

/** A collection as generic code sees one, typed `Collection<number, string | number>`: no literal keys. */
export const generic = new Collection<number, string | number>({ a: 1, 0: 2 });

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

/** A class whose instances have no index signature: a `Record` constraint rejects one, `T extends object` takes it. */
export class Box {
    a = 1;
    b = 2;
}

/** An instance of `Box`. */
export const box = new Box();

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
