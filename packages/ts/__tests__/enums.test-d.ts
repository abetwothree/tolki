import * as Ts from "@tolki/ts";
import type {
    AsEnum,
    CaseKeys,
    CaseValue,
    DefineEnumResult,
    FromResult,
    MatchedCaseKey,
    MethodKeys,
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
            "label" | "badge_color" | "icon" | "is_above_threshold"
        >();
    });

    it("FromResult resolves correctly when used directly", () => {
        type DraftResult = FromResult<StatusEnum, 0>;
        expectTypeOf<DraftResult["value"]>().toEqualTypeOf<0>();
        expectTypeOf<DraftResult["icon"]>().toEqualTypeOf<"pencil">();
        expectTypeOf<DraftResult["color"]>().toEqualTypeOf<"gray">();
    });

    it("from infers correct types for Status Draft", () => {
        const result = Ts.from(Stubs.Status, 0);

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
        const result = Ts.from(Stubs.Status, 1);

        expectTypeOf(result.value).toEqualTypeOf<1>();
        expectTypeOf(result.icon).toEqualTypeOf<"check">();
        expectTypeOf(result.color).toEqualTypeOf<"green">();
    });

    it("from infers correct types for Visibility", () => {
        const result = Ts.from(Stubs.Visibility, "Public");

        expectTypeOf(result.value).toEqualTypeOf<"Public">();
        expectTypeOf(result.is_public).toEqualTypeOf<true>();
        expectTypeOf(result.description).toEqualTypeOf<"Visible to everyone">();
    });

    it("from infers correct types for Priority", () => {
        const result = Ts.from(Stubs.Priority, 3);

        expectTypeOf(result.value).toEqualTypeOf<3>();
        expectTypeOf(result.label).toEqualTypeOf<"Critical Priority">();
        expectTypeOf(
            result.badge_color,
        ).toEqualTypeOf<"bg-red-100 text-red-800">();
        expectTypeOf(result.icon).toEqualTypeOf<"exclamation-triangle">();
    });

    it("from infers union types when value comes from a variable", () => {
        const statusValue: Stubs.StatusType = 0 as Stubs.StatusType;
        const result = Ts.from(Stubs.Status, statusValue);

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
        const result = Ts.tryFrom(Stubs.Status, 0);

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
        const result = Ts.tryFrom(Stubs.Status, statusValue);

        if (result) {
            expectTypeOf(result.value).toEqualTypeOf<0 | 1>();
            expectTypeOf(result.icon).toEqualTypeOf<"pencil" | "check">();
            expectTypeOf(result.color).toEqualTypeOf<"gray" | "green">();
        }
    });
});

describe("cases", () => {
    it("returns an array of resolved enum instances", () => {
        const result = Ts.cases(Stubs.Status);
        const first = result[0]!;

        expectTypeOf(result).toBeArray();
        expectTypeOf(first.value).toEqualTypeOf<0 | 1>();
        expectTypeOf(first.icon).toEqualTypeOf<"pencil" | "check">();
        expectTypeOf(first.color).toEqualTypeOf<"gray" | "green">();
    });

    it("returns correct types for a string-valued enum", () => {
        const result = Ts.cases(Stubs.Visibility);
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
        const StatusEnum = Ts.defineEnum(Stubs.Status);

        expectTypeOf(StatusEnum).toExtend<DefineEnumResult<StatusEnum>>();
    });

    it("preserves original enum data types", () => {
        const StatusEnum = Ts.defineEnum(Stubs.Status);

        expectTypeOf(StatusEnum.Draft).toEqualTypeOf<0>();
        expectTypeOf(StatusEnum.Published).toEqualTypeOf<1>();
        expectTypeOf(StatusEnum._cases).toEqualTypeOf(Stubs.Status._cases);
        expectTypeOf(StatusEnum._methods).toEqualTypeOf(Stubs.Status._methods);
    });

    it("from infers literal types for a specific value", () => {
        const StatusEnum = Ts.defineEnum(Stubs.Status);
        const result = StatusEnum.from(0);

        expectTypeOf(result.value).toEqualTypeOf<0>();
        expectTypeOf(result.icon).toEqualTypeOf<"pencil">();
        expectTypeOf(result.color).toEqualTypeOf<"gray">();
        expectTypeOf(result.value_label_pair).toEqualTypeOf(
            Stubs.Status.value_label_pair,
        );
    });

    it("from infers union types when value is a variable", () => {
        const StatusEnum = Ts.defineEnum(Stubs.Status);
        const statusValue: Stubs.StatusType = 0 as Stubs.StatusType;
        const result = StatusEnum.from(statusValue);

        expectTypeOf(result.value).toEqualTypeOf<0 | 1>();
        expectTypeOf(result.icon).toEqualTypeOf<"pencil" | "check">();
        expectTypeOf(result.color).toEqualTypeOf<"gray" | "green">();
    });

    it("tryFrom returns nullable type", () => {
        const StatusEnum = Ts.defineEnum(Stubs.Status);
        const result = StatusEnum.tryFrom(0);

        if (result) {
            expectTypeOf(result.value).toEqualTypeOf<0>();
            expectTypeOf(result.icon).toEqualTypeOf<"pencil">();
            expectTypeOf(result.color).toEqualTypeOf<"gray">();
        }
    });

    it("cases returns correct array type", () => {
        const StatusEnum = Ts.defineEnum(Stubs.Status);
        const result = StatusEnum.cases();
        const first = result[0]!;

        expectTypeOf(result).toBeArray();
        expectTypeOf(first.value).toEqualTypeOf<0 | 1>();
        expectTypeOf(first.icon).toEqualTypeOf<"pencil" | "check">();
        expectTypeOf(first.color).toEqualTypeOf<"gray" | "green">();
    });

    it("works with string-valued enums", () => {
        const VisibilityEnum = Ts.defineEnum(Stubs.Visibility);
        const result = VisibilityEnum.from("Public");

        expectTypeOf(result.value).toEqualTypeOf<"Public">();
        expectTypeOf(result.is_public).toEqualTypeOf<true>();
        expectTypeOf(result.description).toEqualTypeOf<"Visible to everyone">();
    });
});

describe("enums without _methods or _static", () => {
    type PaymentMethodEnum = typeof Stubs.PaymentMethod;

    it("CaseKeys extracts case key names", () => {
        expectTypeOf<CaseKeys<PaymentMethodEnum>>().toEqualTypeOf<
            | "CreditCard"
            | "DebitCard"
            | "PayPal"
            | "BankTransfer"
            | "CashOnDelivery"
            | "Crypto"
            | "ApplePay"
            | "GooglePay"
        >();
    });

    it("CaseValue extracts case values", () => {
        expectTypeOf<
            CaseValue<PaymentMethodEnum>
        >().toEqualTypeOf<Stubs.PaymentMethodType>();
    });

    it("from resolves to value-only result", () => {
        const result = Ts.from(Stubs.PaymentMethod, "paypal");

        expectTypeOf(result.value).toEqualTypeOf<"paypal">();
    });

    it("defineEnum from infers correct type", () => {
        const PM = Ts.defineEnum(Stubs.PaymentMethod);
        const result = PM.from("crypto");

        expectTypeOf(result.value).toEqualTypeOf<"crypto">();
    });

    it("cases returns correct array type", () => {
        const result = Ts.cases(Stubs.PaymentMethod);
        const first = result[0]!;

        expectTypeOf(result).toBeArray();
        expectTypeOf(first.value).toEqualTypeOf<Stubs.PaymentMethodType>();
    });
});

describe("AsEnum", () => {
    it("resolves a full union for a backed int enum", () => {
        type StatusResource = AsEnum<StatusEnum>;

        expectTypeOf<StatusResource["name"]>().toEqualTypeOf<
            "Draft" | "Published"
        >();
        expectTypeOf<StatusResource["value"]>().toEqualTypeOf<0 | 1>();
        expectTypeOf<StatusResource["backed"]>().toEqualTypeOf<boolean>();
    });

    it("resolves instance methods as union of per-case values", () => {
        type StatusResource = AsEnum<StatusEnum>;

        expectTypeOf<StatusResource["icon"]>().toEqualTypeOf<
            "pencil" | "check"
        >();
        expectTypeOf<StatusResource["color"]>().toEqualTypeOf<
            "gray" | "green"
        >();
    });

    it("resolves static methods as-is", () => {
        type StatusResource = AsEnum<StatusEnum>;

        expectTypeOf<StatusResource["value_label_pair"]>().toEqualTypeOf(
            Stubs.Status.value_label_pair,
        );
        expectTypeOf<StatusResource["names"]>().toEqualTypeOf(
            Stubs.Status.names,
        );
        expectTypeOf<StatusResource["values"]>().toEqualTypeOf(
            Stubs.Status.values,
        );
        expectTypeOf<StatusResource["options"]>().toEqualTypeOf(
            Stubs.Status.options,
        );
    });

    it("pre-narrows to a specific case with second type parameter", () => {
        type DraftResource = AsEnum<StatusEnum, 0>;

        expectTypeOf<DraftResource["name"]>().toEqualTypeOf<"Draft">();
        expectTypeOf<DraftResource["value"]>().toEqualTypeOf<0>();
        expectTypeOf<DraftResource["icon"]>().toEqualTypeOf<"pencil">();
        expectTypeOf<DraftResource["color"]>().toEqualTypeOf<"gray">();
    });

    it("pre-narrows the Published case", () => {
        type PublishedResource = AsEnum<StatusEnum, 1>;

        expectTypeOf<PublishedResource["name"]>().toEqualTypeOf<"Published">();
        expectTypeOf<PublishedResource["value"]>().toEqualTypeOf<1>();
        expectTypeOf<PublishedResource["icon"]>().toEqualTypeOf<"check">();
        expectTypeOf<PublishedResource["color"]>().toEqualTypeOf<"green">();
    });

    it("resolves a string-valued enum", () => {
        type VisibilityResource = AsEnum<VisibilityEnum>;

        expectTypeOf<
            VisibilityResource["value"]
        >().toEqualTypeOf<Stubs.VisibilityType>();
        expectTypeOf<
            VisibilityResource["is_public"]
        >().toEqualTypeOf<boolean>();
    });

    it("pre-narrows a string-valued enum", () => {
        type PublicResource = AsEnum<VisibilityEnum, "Public">;

        expectTypeOf<PublicResource["name"]>().toEqualTypeOf<"Public">();
        expectTypeOf<PublicResource["value"]>().toEqualTypeOf<"Public">();
        expectTypeOf<PublicResource["is_public"]>().toEqualTypeOf<true>();
        expectTypeOf<
            PublicResource["description"]
        >().toEqualTypeOf<"Visible to everyone">();
    });

    it("excludes helper keys from defineEnum'd enums", () => {
        type PriorityDefined = Ts.DefineEnumResult<PriorityEnum>;
        type PriorityResource = AsEnum<PriorityDefined>;

        expectTypeOf<PriorityResource["value"]>().toEqualTypeOf<
            0 | 1 | 2 | 3
        >();
        expectTypeOf<PriorityResource["label"]>().toEqualTypeOf<
            | "Low Priority"
            | "Medium Priority"
            | "High Priority"
            | "Critical Priority"
        >();

        // Helpers should not appear on AsEnum result
        type ResourceKeys = keyof PriorityResource;
        expectTypeOf<
            "from" extends ResourceKeys ? true : false
        >().toEqualTypeOf<false>();
        expectTypeOf<
            "tryFrom" extends ResourceKeys ? true : false
        >().toEqualTypeOf<false>();
        expectTypeOf<
            "cases" extends ResourceKeys ? true : false
        >().toEqualTypeOf<false>();
    });

    it("works with enums that have no methods", () => {
        type PaymentResource = AsEnum<typeof Stubs.PaymentMethod>;

        expectTypeOf<PaymentResource["name"]>().toEqualTypeOf<
            | "CreditCard"
            | "DebitCard"
            | "PayPal"
            | "BankTransfer"
            | "CashOnDelivery"
            | "Crypto"
            | "ApplePay"
            | "GooglePay"
        >();
        expectTypeOf<
            PaymentResource["value"]
        >().toEqualTypeOf<Stubs.PaymentMethodType>();
        expectTypeOf<PaymentResource["backed"]>().toEqualTypeOf<boolean>();
    });

    it("pre-narrows an enum with no methods", () => {
        type PayPalResource = AsEnum<typeof Stubs.PaymentMethod, "paypal">;

        expectTypeOf<PayPalResource["name"]>().toEqualTypeOf<"PayPal">();
        expectTypeOf<PayPalResource["value"]>().toEqualTypeOf<"paypal">();
    });
});
