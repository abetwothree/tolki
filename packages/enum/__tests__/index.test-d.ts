import * as Enum from "@tolki/enum";
import type {
    CaseKeys,
    CaseValue,
    MatchedCaseKey,
    MethodKeys,
    ToEnumResult,
} from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import * as Stubs from "./stubs";

type StatusEnum = typeof Stubs.Status;
type VisibilityEnum = typeof Stubs.Visibility;
type PriorityEnum = typeof Stubs.Priority;

describe("Enum type tests", () => {
    it("CaseKeys extracts case key names", () => {
        expectTypeOf<CaseKeys<StatusEnum>>().toEqualTypeOf<
            "Draft" | "Published"
        >();
        expectTypeOf<CaseKeys<VisibilityEnum>>().toEqualTypeOf<
            "Public" | "Private" | "Protected" | "Internal" | "Draft"
        >();
    });

    it("CaseValue extracts case values", () => {
        expectTypeOf<CaseValue<StatusEnum>>().toEqualTypeOf<0 | 1>();
        expectTypeOf<CaseValue<VisibilityEnum>>().toEqualTypeOf<
            "Public" | "Private" | "Protected" | "Internal" | "Draft"
        >();
    });

    it("MatchedCaseKey resolves to the correct case key", () => {
        expectTypeOf<MatchedCaseKey<StatusEnum, 0>>().toEqualTypeOf<"Draft">();
        expectTypeOf<
            MatchedCaseKey<StatusEnum, 1>
        >().toEqualTypeOf<"Published">();
        expectTypeOf<
            MatchedCaseKey<VisibilityEnum, "Public">
        >().toEqualTypeOf<"Public">();
    });

    it("MethodKeys extracts instance method names", () => {
        expectTypeOf<MethodKeys<StatusEnum>>().toEqualTypeOf<
            "icon" | "color"
        >();
        expectTypeOf<MethodKeys<PriorityEnum>>().toEqualTypeOf<
            "label" | "badgeColor" | "icon"
        >();
    });

    it("ToEnumResult resolves correctly when used directly", () => {
        type DraftResult = ToEnumResult<StatusEnum, 0>;
        expectTypeOf<DraftResult["value"]>().toEqualTypeOf<0>();
        expectTypeOf<DraftResult["icon"]>().toEqualTypeOf<"pencil">();
        expectTypeOf<DraftResult["color"]>().toEqualTypeOf<"gray">();
    });

    it("from infers correct types for Status Draft", () => {
        const result = Enum.from(Stubs.Status, 0);

        expectTypeOf(result.value).toEqualTypeOf<0>();
        expectTypeOf(result.icon).toEqualTypeOf<"pencil">();
        expectTypeOf(result.color).toEqualTypeOf<"gray">();
        expectTypeOf(result.valueLabelPair).toEqualTypeOf(
            Stubs.Status.valueLabelPair,
        );
        expectTypeOf(result.names).toEqualTypeOf(Stubs.Status.names);
        expectTypeOf(result.values).toEqualTypeOf(Stubs.Status.values);
        expectTypeOf(result.options).toEqualTypeOf(Stubs.Status.options);
    });

    it("from infers correct types for Status Published", () => {
        const result = Enum.from(Stubs.Status, 1);

        expectTypeOf(result.value).toEqualTypeOf<1>();
        expectTypeOf(result.icon).toEqualTypeOf<"check">();
        expectTypeOf(result.color).toEqualTypeOf<"green">();
    });

    it("from infers correct types for Visibility", () => {
        const result = Enum.from(Stubs.Visibility, "Public");

        expectTypeOf(result.value).toEqualTypeOf<"Public">();
        expectTypeOf(result.isPublic).toEqualTypeOf<true>();
        expectTypeOf(result.description).toEqualTypeOf<"Visible to everyone">();
    });

    it("from infers correct types for Priority", () => {
        const result = Enum.from(Stubs.Priority, 3);

        expectTypeOf(result.value).toEqualTypeOf<3>();
        expectTypeOf(result.label).toEqualTypeOf<"Critical Priority">();
        expectTypeOf(
            result.badgeColor,
        ).toEqualTypeOf<"bg-red-100 text-red-800">();
        expectTypeOf(result.icon).toEqualTypeOf<"exclamation-triangle">();
    });

    it("from infers union types when value comes from a variable", () => {
        const statusValue: Stubs.StatusType = 0 as Stubs.StatusType;
        const result = Enum.from(Stubs.Status, statusValue);

        expectTypeOf(result.value).toEqualTypeOf<0 | 1>();
        expectTypeOf(result.icon).toEqualTypeOf<"pencil" | "check">();
        expectTypeOf(result.color).toEqualTypeOf<"gray" | "green">();
        expectTypeOf(result.valueLabelPair).toEqualTypeOf(
            Stubs.Status.valueLabelPair,
        );
        expectTypeOf(result.names).toEqualTypeOf(Stubs.Status.names);
        expectTypeOf(result.values).toEqualTypeOf(Stubs.Status.values);
        expectTypeOf(result.options).toEqualTypeOf(Stubs.Status.options);
    });
});
