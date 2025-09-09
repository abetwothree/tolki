export class Collection<T extends unknown[]> {
    /**
     * Create a new instance of the class.
     */
    private _items: T;

    constructor(items?: T) {
        this._items = items ?? ([] as unknown as T);
    }

    /**
     * Get all of the items in the collection.
     */
    all(): T {
        return this._items;
    }
}
