import type {
    Arrayable,
    IteratorAggregate,
    Jsonable,
    JsonSerializable,
} from "@laravel-js/types";

/**
 * Test class that implements Arrayable interface
 */
export class TestArrayableObject implements Arrayable<unknown> {
    toArray(): unknown[] {
        return [{ foo: "bar" }];
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
export class TestJsonSerializeWithScalarValueObject
    implements JsonSerializable
{
    jsonSerialize(): string {
        return "foo";
    }
}

/**
 * Test class that implements both IteratorAggregate and JsonSerializable interfaces
 */
export class TestTraversableAndJsonSerializableObject
    implements IteratorAggregate<unknown, number>, JsonSerializable
{
    public items: unknown[];

    constructor(items: unknown[] = []) {
        this.items = items;
    }

    *getIterator(): IterableIterator<[number, unknown]> {
        for (let i = 0; i < this.items.length; i++) {
            yield [i, this.items[i]];
        }
    }

    jsonSerialize(): unknown {
        return JSON.parse(JSON.stringify(this.items));
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