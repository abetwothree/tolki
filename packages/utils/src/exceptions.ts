/**
 * Thrown when a lookup that must match exactly one item matches none.
 *
 * Laravel's `Illuminate\Support\ItemNotFoundException` extends `RuntimeException`
 * without a constructor, so it carries no message at all — probed as
 * `docs/php-parity/task-24-data-release-readiness.json`, "sole-empty-no-callback"
 * and `task-23-obj-release-readiness.json`, "sole-none".
 */
export class ItemNotFoundException extends Error {
    /**
     * Create a new exception instance.
     */
    constructor() {
        super("");

        this.name = "ItemNotFoundException";
    }
}

/**
 * Thrown when a lookup that must match exactly one item matches several.
 *
 * The message is Laravel's `"{$count} items were found."` — probed as
 * `docs/php-parity/task-24-data-release-readiness.json`, "sole-multi-no-callback"
 * and `task-23-obj-release-readiness.json`, "sole-multi-list".
 */
export class MultipleItemsFoundException extends Error {
    /** The number of items found, as Laravel's public `$count`. */
    readonly count: number;

    /**
     * Create a new exception instance.
     *
     * @param count - The number of items the lookup matched
     */
    constructor(count: number) {
        super(`${count} items were found.`);

        this.name = "MultipleItemsFoundException";
        this.count = count;
    }
}
