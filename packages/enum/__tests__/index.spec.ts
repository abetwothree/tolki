import * as Enum from "@tolki/enum";
import { describe, expect, it } from "vitest";

import * as Stubs from "./stubs";

describe("from", () => {
    it("resolves a numeric enum case with instance methods", () => {
        const result = Enum.from(Stubs.Status, 0);

        expect(result).toEqual({
            value: 0,
            icon: "pencil",
            color: "gray",
            value_label_pair: [
                { label: "Draft", value: 0 },
                { label: "Published", value: 1 },
            ],
            names: ["Draft", "Published"],
            values: [0, 1],
            options: { Draft: 0, Published: 1 },
        });
    });

    it("resolves a different case of the same enum", () => {
        const result = Enum.from(Stubs.Status, 1);

        expect(result).toEqual({
            value: 1,
            icon: "check",
            color: "green",
            value_label_pair: [
                { label: "Draft", value: 0 },
                { label: "Published", value: 1 },
            ],
            names: ["Draft", "Published"],
            values: [0, 1],
            options: { Draft: 0, Published: 1 },
        });
    });

    it("resolves a string-valued enum case", () => {
        const result = Enum.from(Stubs.Visibility, "Public");

        expect(result.value).toBe("Public");
        expect(result.is_public).toBe(true);
        expect(result.description).toBe("Visible to everyone");
    });

    it("resolves a string-valued enum case with false boolean", () => {
        const result = Enum.from(Stubs.Visibility, "Private");

        expect(result.value).toBe("Private");
        expect(result.is_public).toBe(false);
        expect(result.description).toBe("Only visible to the owner");
    });

    it("resolves a priority enum case", () => {
        const result = Enum.from(Stubs.Priority, 3);

        expect(result.value).toBe(3);
        expect(result.label).toBe("Critical Priority");
        expect(result.badge_color).toBe("bg-red-100 text-red-800");
        expect(result.icon).toBe("exclamation-triangle");
    });

    it("throws when the value does not match any case", () => {
        expect(() => {
            Enum.from(Stubs.Status, 999 as never);
        }).toThrow(
            'Value "999" does not match any case in the enum. Cases: Draft, Published',
        );
    });

    it("excludes helper properties from the resolved result", () => {
        const result = Enum.from(Stubs.Priority, 0);

        expect(result).not.toHaveProperty("from");
        expect(result.value).toBe(0);
        expect(result.label).toBe("Low Priority");
    });
});

describe("tryFrom", () => {
    it("returns the resolved enum case for a valid value", () => {
        const result = Enum.tryFrom(Stubs.Status, 0);

        expect(result).not.toBeNull();
        expect(result!.value).toBe(0);
        expect(result!.icon).toBe("pencil");
        expect(result!.color).toBe("gray");
    });

    it("returns null for an invalid value", () => {
        const result = Enum.tryFrom(Stubs.Status, 999 as never);

        expect(result).toBeNull();
    });

    it("returns the resolved case for a string-valued enum", () => {
        const result = Enum.tryFrom(Stubs.Visibility, "Private");

        expect(result).not.toBeNull();
        expect(result!.value).toBe("Private");
        expect(result!.is_public).toBe(false);
        expect(result!.description).toBe("Only visible to the owner");
    });
});

describe("cases", () => {
    it("returns all resolved instances for a numeric enum", () => {
        const result = Enum.cases(Stubs.Status);

        expect(result).toHaveLength(Stubs.Status._cases.length);
        expect(result[0]!.value).toBe(0);
        expect(result[0]!.icon).toBe("pencil");
        expect(result[0]!.color).toBe("gray");
        expect(result[1]!.value).toBe(1);
        expect(result[1]!.icon).toBe("check");
        expect(result[1]!.color).toBe("green");
    });

    it("returns all resolved instances for a string-valued enum", () => {
        const result = Enum.cases(Stubs.Visibility);

        expect(result).toHaveLength(Stubs.Visibility._cases.length);
        expect(result[0]!.value).toBe("Public");
        expect(result[0]!.is_public).toBe(true);
        expect(result[1]!.value).toBe("Private");
        expect(result[1]!.is_public).toBe(false);
    });

    it("preserves case order from _cases", () => {
        const result = Enum.cases(Stubs.Priority);

        expect(result).toHaveLength(Stubs.Priority._cases.length);
        expect(result.map((c) => c.value)).toEqual([0, 1, 2, 3]);
        expect(result.map((c) => c.label)).toEqual([
            "Low Priority",
            "Medium Priority",
            "High Priority",
            "Critical Priority",
        ]);
    });
});

describe("defineEnum", () => {
    it("returns an object with from, tryFrom, and cases methods", () => {
        const StatusEnum = Enum.defineEnum(Stubs.Status);

        expect(StatusEnum.from).toBeTypeOf("function");
        expect(StatusEnum.tryFrom).toBeTypeOf("function");
        expect(StatusEnum.cases).toBeTypeOf("function");
    });

    it("preserves the original enum data", () => {
        const StatusEnum = Enum.defineEnum(Stubs.Status);

        expect(StatusEnum.Draft).toBe(0);
        expect(StatusEnum.Published).toBe(1);
        expect(StatusEnum._cases).toEqual(["Draft", "Published"]);
        expect(StatusEnum._methods).toEqual(["icon", "color"]);
        expect(StatusEnum._helpers).toEqual(["from", "tryFrom", "cases"]);
    });

    it("from resolves cases correctly", () => {
        const StatusEnum = Enum.defineEnum(Stubs.Status);
        const result = StatusEnum.from(0);

        expect(result.value).toBe(0);
        expect(result.icon).toBe("pencil");
        expect(result.color).toBe("gray");
    });

    it("from throws for invalid values", () => {
        const StatusEnum = Enum.defineEnum(Stubs.Status);

        expect(() => {
            StatusEnum.from(999 as never);
        }).toThrow('Value "999" does not match any case in the enum');
    });

    it("tryFrom returns the resolved case for valid values", () => {
        const StatusEnum = Enum.defineEnum(Stubs.Status);
        const result = StatusEnum.tryFrom(1);

        expect(result).not.toBeNull();
        expect(result!.value).toBe(1);
        expect(result!.icon).toBe("check");
        
        // @ts-expect-error  - _helpers is undefined
        expect(result!._helpers).toBeUndefined();
        // @ts-expect-error  - _methods is undefined
        expect(result!._methods).toBeUndefined();
        // @ts-expect-error  - _static is undefined
        expect(result!._static).toBeUndefined();
        // @ts-expect-error  - _cases is undefined
        expect(result!._cases).toBeUndefined();
    });

    it("tryFrom returns null for invalid values", () => {
        const StatusEnum = Enum.defineEnum(Stubs.Status);
        const result = StatusEnum.tryFrom(999 as never);

        expect(result).toBeNull();
    });

    it("cases returns all resolved instances", () => {
        const StatusEnum = Enum.defineEnum(Stubs.Status);
        const result = StatusEnum.cases();

        expect(result).toHaveLength(2);
        expect(result[0]!.value).toBe(0);
        expect(result[1]!.value).toBe(1);
    });

    it("works with string-valued enums", () => {
        const VisibilityEnum = Enum.defineEnum(Stubs.Visibility);
        const result = VisibilityEnum.from("Private");

        expect(result.value).toBe("Private");
        expect(result.is_public).toBe(false);
        expect(result.description).toBe("Only visible to the owner");
    });

    it("excludes helper properties from resolved results", () => {
        const PriorityEnum = Enum.defineEnum(Stubs.Priority);
        const result = PriorityEnum.from(2);

        expect(result).not.toHaveProperty("from");
        expect(result.value).toBe(2);
        expect(result.label).toBe("High Priority");
    });
});