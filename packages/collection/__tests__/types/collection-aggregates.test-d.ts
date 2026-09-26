import { collect } from "@tolki/collection";
import { describe, it } from "vitest";

import { numberList } from "./fixtures";

describe("collection aggregate type tests", () => {
    describe("reduceSpread", () => {
        it("rejects a reducer that returns no list, which PHP throws UnexpectedValueException for", () => {
            collect(numberList).reduceSpread(
                // @ts-expect-error - the reducer's return is spread into its next call, so it must be a list
                () => false,
                null,
            );
        });
    });
});
