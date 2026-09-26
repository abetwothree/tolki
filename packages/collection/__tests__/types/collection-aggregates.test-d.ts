import { collect } from "@tolki/collection";
import { describe, it } from "vitest";

import { numberList } from "./fixtures";

describe("collection aggregate type tests", () => {
    describe("reduceSpread", () => {
        it("rejects a reducer that returns no list, which PHP throws UnexpectedValueException for", () => {
            // @ts-expect-error - the reducer's return is spread into its next call, so it must be a list
            collect(numberList).reduceSpread(() => false, null);
        });
    });
});
