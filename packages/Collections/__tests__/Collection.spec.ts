import { describe, it, expect } from "vitest";
import { Collection } from "@laravel-js/collections";

describe("Collection", () => {
    describe("format", () => {
        it.skip("should format a collection", () => {
            const collection = new Collection([1, 2, 3]);
            expect(collection.format()).toBe("[1, 2, 3]");
        });
    });
});
