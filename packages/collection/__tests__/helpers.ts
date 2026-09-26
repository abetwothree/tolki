/**
 * Shared helpers for `@tolki/collection`'s specs and type-level tests. This file matches neither Vitest include
 * pattern, so it is never collected as a test.
 */

import type { Collection, CollectionItems } from "@tolki/collection";
import { expect } from "vitest";

/** The items a collection's type arguments declare: a list, a record, or a record that may lack some keys. */
export type ItemsOf<C> =
    C extends Collection<infer V, infer K, infer S>
        ? CollectionItems<V, K, S>
        : never;

/** The shape names a collection's all() type allows: "list" for a list, "keyed" for a record, either for a union. */
type ShapeOf<TCollection> = TCollection extends { all(): infer TItems }
    ? TItems extends readonly unknown[]
        ? "list"
        : "keyed"
    : never;

/**
 * Assert a collection's runtime backing matches its declared shape.
 *
 * @param collection - The collection to check
 * @param shape - The shape its type declares; a name its all() type rules out is a compile error
 */
export function expectShape<TCollection extends { all(): unknown }>(
    collection: TCollection,
    shape: NoInfer<ShapeOf<TCollection>>,
): void {
    expect(Array.isArray(collection.all())).toBe(shape === "list");
}
