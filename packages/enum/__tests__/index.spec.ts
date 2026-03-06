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
            valueLabelPair: [
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
            valueLabelPair: [
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
        expect(result.isPublic).toBe(true);
        expect(result.description).toBe("Visible to everyone");
    });

    it("resolves a string-valued enum case with false boolean", () => {
        const result = Enum.from(Stubs.Visibility, "Private");

        expect(result.value).toBe("Private");
        expect(result.isPublic).toBe(false);
        expect(result.description).toBe("Only visible to the owner");
    });

    it("resolves a priority enum case", () => {
        const result = Enum.from(Stubs.Priority, 3);

        expect(result.value).toBe(3);
        expect(result.label).toBe("Critical Priority");
        expect(result.badgeColor).toBe("bg-red-100 text-red-800");
        expect(result.icon).toBe("exclamation-triangle");
    });

    it("throws when the value does not match any case", () => {
        expect(() => {
            Enum.from(Stubs.Status, 999 as never);
        }).toThrow(
            'Value "999" does not match any case in the enum. Cases: Draft, Published',
        );
    });
});
