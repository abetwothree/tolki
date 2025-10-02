import type { DataItems, ObjectKey, Arrayable } from "@laravel-js/types";

export function lazyCollect<
    TValue = unknown,
    TKey extends ObjectKey = ObjectKey,
>(items?: TValue[] | DataItems<TValue> | null) {
    return new LazyCollection<TValue, TKey>(items);
}

export class LazyCollection<TValue, TKey extends ObjectKey = ObjectKey> {
    /**
     * The items contained in the collection.
     */
    protected items: DataItems<TValue, TKey>;

    /**
     * Create a new collection.
     *
     * @param items - The items to initialize the collection with
     */
    constructor(
        items?: TValue[] | DataItems<TValue, TKey> | Arrayable<TValue> | null,
    ) {
        // this.items = this.getArrayableItems(items ?? []);
        // @ts-expect-error To be implemented in future
        this.items = items ?? ([] as DataItems<TValue, TKey>);
    }
}
