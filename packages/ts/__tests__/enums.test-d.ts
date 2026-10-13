import * as Ts from "@tolki/ts";
import { describe, expectTypeOf, it } from "vitest";

const Color = Ts.defineEnum({
    Red: "red",
    Green: "green",
    backed: true,
    hex: { Red: "#EF4444", Green: "#22C55E" },
    _cases: ["Red", "Green"],
    _methods: ["hex"],
} as const);

describe("enum re-exports", () => {
    it("infers a case through defineEnum from @tolki/ts", () => {
        const red = Color.from("red");

        expectTypeOf(red.name).toEqualTypeOf<"Red">();
        expectTypeOf(red.value).toEqualTypeOf<"red">();
        expectTypeOf(red.hex).toEqualTypeOf<"#EF4444">();
    });

    it("keeps tryFrom nullable", () => {
        expectTypeOf(Color.tryFrom("green")).toBeNullable();
    });

    it("types an EnumResource response with AsEnum from @tolki/ts", () => {
        expectTypeOf<
            Ts.AsEnum<typeof Color, "green">["hex"]
        >().toEqualTypeOf<"#22C55E">();
        expectTypeOf<Ts.AsEnum<typeof Color>["name"]>().toEqualTypeOf<
            "Red" | "Green"
        >();
    });

    it("keeps the standalone functions' inference", () => {
        expectTypeOf(Ts.from(Color, "green").name).toEqualTypeOf<"Green">();
    });
});
