import {
    InvalidArgumentException,
    ItemNotFoundException,
    MultipleItemsFoundException,
    UnexpectedValueException,
} from "@tolki/utils";
import { describe, expect, it } from "vitest";

describe("exceptions", () => {
    it("InvalidArgumentException carries the message Laravel throws it with", () => {
        // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-shift-negative-on-empty-throws"
        const error = new InvalidArgumentException(
            "Number of shifted items may not be less than zero.",
        );

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe("InvalidArgumentException");
        expect(error.message).toBe(
            "Number of shifted items may not be less than zero.",
        );
    });

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
        // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-multiple-items-found-count"
        expect([error.count, error.getCount()]).toEqual([2, 2]);

        expect(new MultipleItemsFoundException(3).message).toBe(
            "3 items were found.",
        );
    });

    it("UnexpectedValueException carries the message Laravel throws it with", () => {
        // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-scalar-message"
        const error = new UnexpectedValueException(
            "Collection should only include [int] items, but 'string' found at position 3.",
        );

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe("UnexpectedValueException");
        expect(error.message).toBe(
            "Collection should only include [int] items, but 'string' found at position 3.",
        );
    });
});
