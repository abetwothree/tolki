import type {
    IteratorAggregate,
    Jsonable,
    JsonSerializable,
} from "@tolki/types";
import { isArray } from "@tolki/utils";

/**
 * Test class that implements Arrayable interface
 */
export class TestArrayableObject {
    toArray(): Record<string, string> {
        return { foo: "bar" };
    }
}

/**
 * Test class that implements Jsonable interface
 */
export class TestJsonableObject implements Jsonable {
    toJson(): string {
        return '{"foo":"bar"}';
    }
}

/**
 * Test class that implements JsonSerializable interface with object return
 */
export class TestJsonSerializeObject implements JsonSerializable {
    jsonSerialize(): Record<string, string> {
        return { foo: "bar" };
    }
}

/**
 * Test class that implements JsonSerializable interface with scalar return
 */
export class TestJsonSerializeWithScalarValueObject implements JsonSerializable {
    jsonSerialize(): string {
        return "foo";
    }
}

/**
 * Test class that implements both IteratorAggregate and JsonSerializable interfaces
 */
export class TestTraversableAndJsonSerializableObject
    implements
        IteratorAggregate<unknown, PropertyKey>,
        Iterable<unknown>,
        JsonSerializable
{
    public items: unknown[] | Record<string, unknown>;

    constructor(items: unknown[] | Record<string, unknown> = []) {
        this.items = items;
    }

    *getIterator(): IterableIterator<[PropertyKey, unknown]> {
        yield* isArray(this.items)
            ? this.items.entries()
            : Object.entries(this.items);
    }

    *[Symbol.iterator](): IterableIterator<unknown> {
        yield* Object.values(this.items);
    }

    jsonSerialize(): unknown {
        return JSON.parse(JSON.stringify(this.items));
    }
}

/**
 * Test class whose iteration and jsonSerialize() disagree, so a collection built from it shows which one won
 */
export class TestIterableWithDifferentJsonSerializeObject
    implements Iterable<string>, JsonSerializable
{
    *[Symbol.iterator](): IterableIterator<string> {
        yield "iterated";
    }

    jsonSerialize(): string[] {
        return ["serialized"];
    }
}

/**
 * Test class that implements JsonSerializable interface returning a string
 */
export class TestJsonSerializeToStringObject implements JsonSerializable {
    jsonSerialize(): string {
        return "foobar";
    }
}

/**
 * Test class for Collection mapInto method
 */
export class TestCollectionMapIntoObject<T> {
    public value: T;

    constructor(value: T) {
        this.value = value;
    }
}
