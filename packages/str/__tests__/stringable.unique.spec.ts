import { describe, expect, it } from "vitest";

import { Str, Stringable } from "../src/index.js";

// Helper to compare Stringable result to plain string
function expectEqual(strResult: string, s: Stringable) {
    expect(s.toString()).toBe(strResult);
}

describe("Stringable unique behaviors", () => {
    it.skip("explode", () => {});

    it.skip("split", () => {});

    it.skip("scan", () => {});

    it("append, prepend and newLine", () => {
        expectEqual("foo123bar", Str.of("foo").append(1, 2, 3).append("bar"));
        expectEqual("abcfoo", Str.of("foo").prepend("a", "b", "c"));

        // newLine appends N newlines, clamps negatives to 0
        expectEqual("x\n\n", Str.of("x").newLine(2));
        expectEqual("x", Str.of("x").newLine(-5));
        expectEqual("x\n", Str.of("x").newLine());
    });

    it("exactly with string and Stringable", () => {
        const a = Str.of("hello");
        const b = Str.of("hello");
        const c = Str.of("world");
        expect(a.exactly("hello")).toBe(true);
        expect(a.exactly(b)).toBe(true);
        expect(a.exactly(c)).toBe(false);
    });

    it("isEmpty / isNotEmpty and toString/value parity", () => {
        const empty = Str.of("");
        const nonEmpty = Str.of(" ");
        expect(empty.isEmpty()).toBe(true);
        expect(empty.isNotEmpty()).toBe(false);
        expect(nonEmpty.isEmpty()).toBe(false);
        expect(nonEmpty.isNotEmpty()).toBe(true);

        const s = Str.of("abc");
        expect(s.toString()).toBe("abc");
        expect(s.value()).toBe("abc");
    });

    it("numeric conversions: toInteger, toFloat", () => {
        expect(Str.of("10").toInteger()).toBe(10);
        expect(Str.of("FF").toInteger(16)).toBe(255);
        // Invalid base falls back to 10
        expect(Str.of("10").toInteger("oops" as unknown as number)).toBe(10);

        expect(Str.of("3.14159").toFloat()).toBeCloseTo(3.14159);
        expect(Number.isNaN(Str.of("not-a-number").toFloat())).toBe(true);
    });

    it("boolean conversion: toBoolean trims and lowercases", () => {
        const truthy = ["1", "true", "on", "yes", "  TRUE  "];
        truthy.forEach((v) => expect(Str.of(v).toBoolean()).toBe(true));

        const falsy = ["0", "false", "off", "no", "", "random"];
        falsy.forEach((v) => expect(Str.of(v).toBoolean()).toBe(false));
    });

    it("date conversion: toDate and jsonSerialize", () => {
        const d = Str.of("2023-01-02T03:04:05Z").toDate();
        expect(d).toBeInstanceOf(Date);
        expect(d?.toISOString()).toBe("2023-01-02T03:04:05.000Z");

        const bad = Str.of("not a date").toDate();
        expect(bad).toBeNull();

        expect(Str.of("hello").jsonSerialize()).toBe("hello");
    });

    it("numbers() keeps only digits and returns Stringable", () => {
        const s = Str.of("a1b2c3").numbers();
        expect(s).toBeInstanceOf(Stringable);
        expect(s.toString()).toBe("123");
    });

    it("pipe returns Stringable when callback returns string", () => {
        const r = Str.of("hi").pipe(() => "HI!");
        expect(r).toBeInstanceOf(Stringable);
        expect(r.toString()).toBe("HI!");
    });

    describe("when / unless core behavior", () => {
        it("when executes callback on truthy and default on falsy", () => {
            const s = Str.of("hello");
            const truthy = s.when(true, (inst) => inst.upper());
            expectEqual("HELLO", truthy);

            const falsy = s.when(
                false,
                (inst) => inst.upper(),
                (inst) => inst.append("!"),
            );
            expectEqual("hello!", falsy);
        });

        it("unless executes callback on falsy and default on truthy", () => {
            const s = Str.of("hello");
            const onFalsy = s.unless(false, (inst) => inst.upper());
            expectEqual("HELLO", onFalsy);

            const onTruthy = s.unless(
                true,
                (inst) => inst.upper(),
                (inst) => inst.append("?"),
            );
            expectEqual("hello?", onTruthy);
        });

        it("when value can be a function and returning undefined keeps original", () => {
            const s = Str.of("hello");
            const same = s.when(
                () => true,
                () => undefined as unknown as Stringable,
            );
            expect(same).toBe(s); // same instance when callback returns undefined

            const sameUnless = s.unless(
                () => false,
                () => undefined as unknown as Stringable,
            );
            expect(sameUnless).toBe(s);
        });
    });

    describe("conditional helpers (when*)", () => {
        it("whenContains / whenContainsAll", () => {
            const s = Str.of("foo bar baz");
            expectEqual(
                "FOO bar baz",
                s.whenContains("foo", (inst) =>
                    inst.replaceFirst("foo", "FOO"),
                ),
            );

            expectEqual(
                "[foo bar baz]",
                s.whenContainsAll(["foo", "bar"], (inst) =>
                    inst.wrap("[", "]"),
                ),
            );

            // default path
            expectEqual(
                "foo bar baz",
                s.whenContainsAll(
                    ["missing"],
                    (inst) => inst.upper(),
                    (inst) => inst,
                ),
            );
        });

        it("whenEmpty / whenNotEmpty", () => {
            expectEqual(
                "(empty)",
                Str.of("").whenEmpty((inst) =>
                    inst.prepend("empty").wrap("(", ")"),
                ),
            );
            expectEqual(
                "a!",
                Str.of("a").whenNotEmpty((inst) => inst.append("!")),
            );
        });

        it("whenEndsWith / whenDoesntEndWith", () => {
            expectEqual(
                "path/",
                Str.of("path").whenDoesntEndWith("/", (i) => i.finish("/")),
            );
            expectEqual(
                "hello",
                Str.of("hello").whenEndsWith("lo", (i) => i),
            );
        });

        it("whenExactly / whenNotExactly", () => {
            expectEqual(
                "OK",
                Str.of("x").whenExactly("x", () => Str.of("OK")),
            );
            expectEqual(
                "NO",
                Str.of("x").whenNotExactly("y", () => Str.of("NO")),
            );
        });

        it("whenIs, whenIsAscii, whenIsUuid, whenIsUlid, whenStartsWith, whenTest", () => {
            expectEqual(
                "match",
                Str.of("hello").whenIs("hello", () => Str.of("match")),
            );
            expectEqual(
                "ASCII",
                Str.of("abc").whenIsAscii(() => Str.of("ASCII")),
            );
            expectEqual(
                "not ascii",
                Str.of("こんにちは").whenIsAscii(
                    () => Str.of("ASCII"),
                    () => Str.of("not ascii"),
                ),
            );

            const uuid = "550e8400-e29b-41d4-a716-446655440000";
            expectEqual(
                "uuid",
                Str.of(uuid).whenIsUuid(() => Str.of("uuid")),
            );
            expectEqual(
                "not uuid",
                Str.of("nope").whenIsUuid(
                    () => Str.of("uuid"),
                    () => Str.of("not uuid"),
                ),
            );

            const ulid = "01F8MECHZX2D7J8F8C8D4B8F8C";
            expectEqual(
                "ulid",
                Str.of(ulid).whenIsUlid(() => Str.of("ulid")),
            );

            expectEqual(
                "starts",
                Str.of("foobar").whenStartsWith("foo", () => Str.of("starts")),
            );
            expectEqual(
                "has bar",
                Str.of("foo bar baz").whenTest("bar", () => Str.of("has bar")),
            );
        });
    });
});
