import {
    ItemNotFoundException,
    MultipleItemsFoundException,
} from "@tolki/utils";
import { describe, expect, it } from "vitest";

describe("exceptions", () => {
    it("ItemNotFoundException carries Laravel's empty message", () => {
        // docs/php-parity/task-24-data-release-readiness.json, "sole-empty-no-callback";
        // task-23-obj-release-readiness.json, "sole-none"
        const error = new ItemNotFoundException();

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("");
        expect(error.name).toBe("ItemNotFoundException");
    });

    it("MultipleItemsFoundException reports the count Laravel reports", () => {
        // docs/php-parity/task-24-data-release-readiness.json, "sole-multi-no-callback";
        // task-23-obj-release-readiness.json, "sole-multi-list", "sole-assoc-multi-callback"
        const error = new MultipleItemsFoundException(2);

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("2 items were found.");
        expect(error.name).toBe("MultipleItemsFoundException");
        expect(error.count).toBe(2);

        expect(new MultipleItemsFoundException(3).message).toBe(
            "3 items were found.",
        );
    });
});
