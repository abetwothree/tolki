import * as Arr from "@laravel-js/arr";

export declare type Items<
    TKey extends string | number | symbol, 
    TValue
> = TValue[] | Record<TKey, TValue>;

export class Collection<Items> {

    private _items: Items;

    constructor(items?: Items) {
        this._items = this.getArrayableItems(items ?? []) as Items;
    }

    /**
     * Create a collection with the given range.
     *
     * @param  from - Starting number of the range
     * @param  to - Ending number of the range
     * @param  step - Step size for the range
     * @return A new Collection instance containing the range of numbers
     * 
     * @example
     * 
     * const range = Collection.range(1, 10);
     */
    static range(from: number, to: number, step: number = 1): Collection<number[]> {
        const rangeArray: number[] = [];
        for (let i = from; i <= to; i += step) {
            rangeArray.push(i);
        }

        return new Collection(rangeArray);
    }

    /**
     * Get all of the items in the collection.
     * 
     * @return The underlying array of items in the collection
     * 
     * @example
     * 
     * const collection = new Collection([1, 2, 3]);
     * console.log(collection.all()); // [1, 2, 3]
     */
    all(): Items {
        return this._items;
    }

    /**
     * Results array of items from Collection or Arrayable.
     *
     * @param items - The items to convert to an array
     * @return The items as an array
     */
    protected getArrayableItems(items: unknown): Items {
        if (items === null || typeof items !== 'object') {
            return Arr.wrap(items) as Items;
        }

        return Arr.from(items) as Items;
    }
}
