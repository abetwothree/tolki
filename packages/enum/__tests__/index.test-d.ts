import * as Enum from "@tolki/enum";
import type {
    CaseKeys,
    CaseValue,
    DefineEnumResult,
    MatchedCaseKey,
    MethodKeys,
    ToEnumResult,
} from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import * as Stubs from "./stubs";

type StatusEnum = typeof Stubs.Status;
type VisibilityEnum = typeof Stubs.Visibility;
type PriorityEnum = typeof Stubs.Priority;

describe("from", () => {
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
            "label" | "badge_color" | "icon" | 'is_above_threshold'
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
        expectTypeOf(result.value_label_pair).toEqualTypeOf(
            Stubs.Status.value_label_pair,
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
        expectTypeOf(result.is_public).toEqualTypeOf<true>();
        expectTypeOf(result.description).toEqualTypeOf<"Visible to everyone">();
    });

    it("from infers correct types for Priority", () => {
        const result = Enum.from(Stubs.Priority, 3);

        expectTypeOf(result.value).toEqualTypeOf<3>();
        expectTypeOf(result.label).toEqualTypeOf<"Critical Priority">();
        expectTypeOf(
            result.badge_color,
        ).toEqualTypeOf<"bg-red-100 text-red-800">();
        expectTypeOf(result.icon).toEqualTypeOf<"exclamation-triangle">();
    });

    it("from infers union types when value comes from a variable", () => {
        const statusValue: Stubs.StatusType = 0 as Stubs.StatusType;
        const result = Enum.from(Stubs.Status, statusValue);

        expectTypeOf(result.value).toEqualTypeOf<0 | 1>();
        expectTypeOf(result.icon).toEqualTypeOf<"pencil" | "check">();
        expectTypeOf(result.color).toEqualTypeOf<"gray" | "green">();
        expectTypeOf(result.value_label_pair).toEqualTypeOf(
            Stubs.Status.value_label_pair,
        );
        expectTypeOf(result.names).toEqualTypeOf(Stubs.Status.names);
        expectTypeOf(result.values).toEqualTypeOf(Stubs.Status.values);
        expectTypeOf(result.options).toEqualTypeOf(Stubs.Status.options);
    });
});

describe("tryFrom", () => {
    it("returns the resolved type or null for a valid value", () => {
        const result = Enum.tryFrom(Stubs.Status, 0);

        if (result) {
            expectTypeOf(result.value).toEqualTypeOf<0>();
            expectTypeOf(result.icon).toEqualTypeOf<"pencil">();
            expectTypeOf(result.color).toEqualTypeOf<"gray">();
            expectTypeOf(result.value_label_pair).toEqualTypeOf(
                Stubs.Status.value_label_pair,
            );
            expectTypeOf(result.names).toEqualTypeOf(Stubs.Status.names);
            expectTypeOf(result.values).toEqualTypeOf(Stubs.Status.values);
            expectTypeOf(result.options).toEqualTypeOf(Stubs.Status.options);
        }
    });

    it("returns union types when value is a variable", () => {
        const statusValue: Stubs.StatusType = 0 as Stubs.StatusType;
        const result = Enum.tryFrom(Stubs.Status, statusValue);

        if (result) {
            expectTypeOf(result.value).toEqualTypeOf<0 | 1>();
            expectTypeOf(result.icon).toEqualTypeOf<"pencil" | "check">();
            expectTypeOf(result.color).toEqualTypeOf<"gray" | "green">();
        }
    });
});

describe("cases", () => {
    it("returns an array of resolved enum instances", () => {
        const result = Enum.cases(Stubs.Status);
        const first = result[0]!;

        expectTypeOf(result).toBeArray();
        expectTypeOf(first.value).toEqualTypeOf<0 | 1>();
        expectTypeOf(first.icon).toEqualTypeOf<"pencil" | "check">();
        expectTypeOf(first.color).toEqualTypeOf<"gray" | "green">();
    });

    it("returns correct types for a string-valued enum", () => {
        const result = Enum.cases(Stubs.Visibility);
        const first = result[0]!;

        expectTypeOf(result).toBeArray();
        expectTypeOf(first.value).toEqualTypeOf<Stubs.VisibilityType>();
        expectTypeOf(first.is_public).toEqualTypeOf<boolean>();
        expectTypeOf(first.description).toEqualTypeOf<
            | "Visible to everyone"
            | "Only visible to the owner"
            | "Visible to team members"
            | "Visible to organization members"
            | "Not visible to anyone except the author"
        >();
    });
});

describe("defineEnum", () => {
    it("returns DefineEnumResult type", () => {
        const StatusEnum = Enum.defineEnum(Stubs.Status);

        expectTypeOf(StatusEnum).toExtend<DefineEnumResult<StatusEnum>>();
    });

    it("preserves original enum data types", () => {
        const StatusEnum = Enum.defineEnum(Stubs.Status);

        expectTypeOf(StatusEnum.Draft).toEqualTypeOf<0>();
        expectTypeOf(StatusEnum.Published).toEqualTypeOf<1>();
        expectTypeOf(StatusEnum._cases).toEqualTypeOf(Stubs.Status._cases);
        expectTypeOf(StatusEnum._methods).toEqualTypeOf(Stubs.Status._methods);
    });

    it("from infers literal types for a specific value", () => {
        const StatusEnum = Enum.defineEnum(Stubs.Status);
        const result = StatusEnum.from(0);

        expectTypeOf(result.value).toEqualTypeOf<0>();
        expectTypeOf(result.icon).toEqualTypeOf<"pencil">();
        expectTypeOf(result.color).toEqualTypeOf<"gray">();
        expectTypeOf(result.value_label_pair).toEqualTypeOf(Stubs.Status.value_label_pair);
    });

    it("from infers union types when value is a variable", () => {
        const StatusEnum = Enum.defineEnum(Stubs.Status);
        const statusValue: Stubs.StatusType = 0 as Stubs.StatusType;
        const result = StatusEnum.from(statusValue);

        expectTypeOf(result.value).toEqualTypeOf<0 | 1>();
        expectTypeOf(result.icon).toEqualTypeOf<"pencil" | "check">();
        expectTypeOf(result.color).toEqualTypeOf<"gray" | "green">();
    });

    it("tryFrom returns nullable type", () => {
        const StatusEnum = Enum.defineEnum(Stubs.Status);
        const result = StatusEnum.tryFrom(0);

        if (result) {
            expectTypeOf(result.value).toEqualTypeOf<0>();
            expectTypeOf(result.icon).toEqualTypeOf<"pencil">();
            expectTypeOf(result.color).toEqualTypeOf<"gray">();
        }
    });

    it("cases returns correct array type", () => {
        const StatusEnum = Enum.defineEnum(Stubs.Status);
        const result = StatusEnum.cases();
        const first = result[0]!;

        expectTypeOf(result).toBeArray();
        expectTypeOf(first.value).toEqualTypeOf<0 | 1>();
        expectTypeOf(first.icon).toEqualTypeOf<"pencil" | "check">();
        expectTypeOf(first.color).toEqualTypeOf<"gray" | "green">();
    });

    it("works with string-valued enums", () => {
        const VisibilityEnum = Enum.defineEnum(Stubs.Visibility);
        const result = VisibilityEnum.from("Public");

        expectTypeOf(result.value).toEqualTypeOf<"Public">();
        expectTypeOf(result.is_public).toEqualTypeOf<true>();
        expectTypeOf(result.description).toEqualTypeOf<"Visible to everyone">();
    });
});