import * as Str from "@tolki/str";
import { describe, expectTypeOf, it } from "vitest";

describe("str type tests", () => {
    describe("replace", () => {
        describe("String subject returns string", () => {
            it("returns string when subject is a string literal", () => {
                const result = Str.replace("baz", "laravel", "foo bar baz");
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("returns string with string variable subject", () => {
                const subject: string = "foo bar baz";
                const result = Str.replace("baz", "laravel", subject);
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("returns string with caseSensitive=false", () => {
                const result = Str.replace("baz", "laravel", "foo bar Baz", false);
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("returns string with caseSensitive=true", () => {
                const result = Str.replace("bar", "X", "foo bar BAR", true);
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("never returns null (unlike replaceMatches)", () => {
                const result = Str.replace("a", "b", "aaa");
                expectTypeOf(result).not.toEqualTypeOf<string | null>();
                expectTypeOf(result).toEqualTypeOf<string>();
            });
        });

        describe("Array subject returns string[]", () => {
            it("returns string[] when subject is a string array literal", () => {
                const result = Str.replace("baz", "laravel", ["baz", "foo", "Baz"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns string[] with string[] variable subject", () => {
                const subjects: string[] = ["aaa", "bbb"];
                const result = Str.replace("a", "X", subjects);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns string[] with array subject and caseSensitive=false", () => {
                const result = Str.replace("baz", "laravel", ["baz", "foo", "Baz"], false);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("never returns null for array subject", () => {
                const result = Str.replace("a", "b", ["aaa"]);
                expectTypeOf(result).not.toEqualTypeOf<string[] | null>();
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("Search parameter variations", () => {
            it("accepts a single string search", () => {
                const result = Str.replace("baz", "laravel", "foo bar baz");
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("accepts an array of string searches", () => {
                const result = Str.replace(["?1", "?2", "?3"], ["foo", "bar", "baz"], "?1 ?2 ?3");
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("accepts a string[] variable for search", () => {
                const searches: string[] = ["a", "b", "c"];
                const result = Str.replace(searches, ["X", "Y", "Z"], "abc");
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("accepts an iterable search parameter", () => {
                const searches: Iterable<string> = ["a", "b"];
                const result = Str.replace(searches, "X", "abc");
                expectTypeOf(result).toEqualTypeOf<string>();
            });
        });

        describe("Replacement parameter variations", () => {
            it("accepts a single string replacement", () => {
                const result = Str.replace("a", "X", "aaa");
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("accepts an array of string replacements", () => {
                const result = Str.replace(["a", "b"], ["X", "Y"], "ab");
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("accepts an iterable replacement parameter", () => {
                const replacements: Iterable<string> = ["X", "Y"];
                const result = Str.replace("a", replacements, "a b a");
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("accepts more searches than replacements (fallback to empty string)", () => {
                const result = Str.replace(["a", "b", "c"], ["X"], "abc");
                expectTypeOf(result).toEqualTypeOf<string>();
            });
        });

        describe("Union subject type (string | Iterable<string>)", () => {
            it("returns string | string[] when subject is a union type", () => {
                const subject: string | string[] = Math.random() > 0.5 ? "foo" : ["foo"];
                const result = Str.replace("foo", "bar", subject);
                expectTypeOf(result).toEqualTypeOf<string | string[]>();
            });

            it("returns string | string[] with Iterable<string> union", () => {
                const subject: string | Iterable<string> = Math.random() > 0.5 ? "foo" : ["foo"];
                const result = Str.replace("foo", "bar", subject);
                expectTypeOf(result).toEqualTypeOf<string | string[]>();
            });
        });

        describe("Complex real-world scenarios", () => {
            it("handles all parameters from variables", () => {
                const search: string = "baz";
                const replacement: string = "laravel";
                const subject: string = "foo bar baz";
                const caseSensitive: boolean = true;
                const result = Str.replace(search, replacement, subject, caseSensitive);
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("handles array search with array replace on array subject", () => {
                const searches: string[] = ["?1", "?2", "?3"];
                const replacements: string[] = ["foo", "bar", "baz"];
                const subjects: string[] = ["?1 ?2", "?3 ?1"];
                const result = Str.replace(searches, replacements, subjects);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("handles special regex characters in search (escaped internally)", () => {
                const result = Str.replace("?", "8.x", "foo bar baz ?");
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("handles space replacement", () => {
                const result = Str.replace(" ", "/", "foo bar baz");
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("handles empty search string", () => {
                const result = Str.replace("", "X", "foo bar");
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("handles array subject with single search and replace", () => {
                const result = Str.replace("a", "X", ["aaa", "bbb"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("handles array subject with array search and single replace", () => {
                const result = Str.replace(["a", "b"], "X", ["aaa", "bbb"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("Parameter type inference", () => {
            it("is callable with minimal arguments (string subject)", () => {
                expectTypeOf(Str.replace).toBeCallableWith("a", "b", "c");
            });

            it("is callable with all arguments (including caseSensitive)", () => {
                expectTypeOf(Str.replace).toBeCallableWith("a", "b", "c", true);
            });

            it("is callable with array search and array replace", () => {
                expectTypeOf(Str.replace).toBeCallableWith(
                    ["a", "b"],
                    ["X", "Y"],
                    "ab",
                );
            });

            it("is callable with array subject", () => {
                expectTypeOf(Str.replace).toBeCallableWith(
                    "a",
                    "b",
                    ["foo", "bar"],
                );
            });

            it("is callable with caseSensitive=false", () => {
                expectTypeOf(Str.replace).toBeCallableWith(
                    "a",
                    "b",
                    "c",
                    false,
                );
            });
        });
    });

    describe("replaceMatches", () => {
        describe("String subject returns string | null", () => {
            it("returns string | null when subject is a string literal", () => {
                const result = Str.replaceMatches("/baz/", "bar", "foo baz bar");
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("returns string | null with string variable subject", () => {
                const subject: string = "hello world";
                const result = Str.replaceMatches("/hello/", "hi", subject);
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("returns string | null with limit parameter", () => {
                const result = Str.replaceMatches(
                    "/ba(.)/",
                    "ba$1",
                    "foo baz baz",
                    1,
                );
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("returns string | null with limit = -1 (unlimited)", () => {
                const result = Str.replaceMatches(
                    "/ba(.)/",
                    "ba$1",
                    "foo baz baz",
                    -1,
                );
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });
        });
        
        describe("Array subject returns string[] | null", () => {
            it("returns string[] | null when subject is a string array literal", () => {
                const result = Str.replaceMatches("/bar/", "XXX", [
                    "foo bar",
                    "bar baz",
                ]);
                expectTypeOf(result).toEqualTypeOf<string[] | null>();
            });

            it("returns string[] | null with string[] variable subject", () => {
                const subjects: string[] = ["aaa", "bbb"];
                const result = Str.replaceMatches("/a/", "X", subjects);
                expectTypeOf(result).toEqualTypeOf<string[] | null>();
            });

            it("returns string[] | null with array subject and callback", () => {
                const result = Str.replaceMatches(
                    "/a/",
                    (match) => match[0]!.toUpperCase(),
                    ["aa", "bb"],
                );
                expectTypeOf(result).toEqualTypeOf<string[] | null>();
            });

            it("returns string[] | null with array subject and limit", () => {
                const result = Str.replaceMatches(
                    "/a/",
                    (match) => match[0]!.toUpperCase(),
                    ["aa", "bb"],
                    1,
                );
                expectTypeOf(result).toEqualTypeOf<string[] | null>();
            });
        });
        
        describe("Pattern variations", () => {
            it("accepts a single string pattern", () => {
                const result = Str.replaceMatches("/foo/", "bar", "foo");
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("accepts an array of string patterns", () => {
                const result = Str.replaceMatches(
                    ["/bar/", "/baz/"],
                    ["XXX", "YYY"],
                    "foo bar baz",
                );
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("accepts a RegExp pattern", () => {
                const result = Str.replaceMatches(/foo/, "bar", "foo baz");
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("accepts a RegExp with flags", () => {
                const result = Str.replaceMatches(/BAR/gi, "X", "bar BAR Bar");
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("accepts an array of RegExp patterns", () => {
                const patterns: RegExp[] = [/foo/g, /bar/g];
                const result = Str.replaceMatches(patterns, "X", "foo bar baz");
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("accepts a mixed array of string and RegExp patterns via string[]", () => {
                // Note: (string | RegExp)[] is not directly assignable to string[] | RegExp[].
                // Users must use a homogeneous array type. This mirrors PHP's string[] typing.
                const patterns: string[] = ["/foo/", "/bar/"];
                const result = Str.replaceMatches(patterns, "X", "foo bar baz");
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });
        });

        describe("Replacement variations", () => {
            it("accepts a single string replacement", () => {
                const result = Str.replaceMatches("/abc/", "XYZ", "abc");
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("accepts an array of string replacements", () => {
                const result = Str.replaceMatches(
                    ["/a/", "/b/", "/c/"],
                    ["X", "Y", "Z"],
                    "abc",
                );
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("accepts a callback replacement function", () => {
                const result = Str.replaceMatches(
                    "/ba(.)/",
                    (match) => {
                        expectTypeOf(match).toEqualTypeOf<string[]>();
                        return "ba" + match[1]!.toUpperCase();
                    },
                    "foo baz bar",
                );
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("callback receives string[] match parameter", () => {
                Str.replaceMatches(
                    "/(?<word>\\w+)/",
                    (match) => {
                        // match is string[] (full match + capture groups)
                        expectTypeOf(match).toEqualTypeOf<string[]>();
                        expectTypeOf(match[0]).toEqualTypeOf<string | undefined>();
                        expectTypeOf(match[1]).toEqualTypeOf<string | undefined>();
                        return match[0]!;
                    },
                    "hello",
                );
            });

            it("callback with multiple capture groups", () => {
                Str.replaceMatches(
                    "/([a-z])([0-9])/",
                    (match) => {
                        expectTypeOf(match).toEqualTypeOf<string[]>();
                        return `${match[1]}-${match[2]}`;
                    },
                    "a1b2c3",
                );
            });
        });

        describe("Union subject type (string | string[])", () => {
            it("returns string | string[] | null when subject is a union type", () => {
                const subject: string | string[] = Math.random() > 0.5 ? "foo" : ["foo"];
                const result = Str.replaceMatches("/foo/", "bar", subject);
                expectTypeOf(result).toEqualTypeOf<string | string[] | null>();
            });
        });

        describe("Complex real-world scenarios", () => {
            it("handles pattern from variable typed as string", () => {
                const pattern: string = "/\\d+/";
                const replacement: string = "NUM";
                const subject: string = "abc 123 def";
                const result = Str.replaceMatches(pattern, replacement, subject);
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("handles patterns from variable typed as string[]", () => {
                const patterns: string[] = ["/foo/", "/bar/"];
                const replacements: string[] = ["X", "Y"];
                const subject: string = "foo bar";
                const result = Str.replaceMatches(patterns, replacements, subject);
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("handles RegExp[] patterns with string[] replacements on string subject", () => {
                const patterns: RegExp[] = [/foo/g, /bar/g];
                const replacements: string[] = ["X", "Y"];
                const result = Str.replaceMatches(patterns, replacements, "foo bar");
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("handles callback on array subject with limit", () => {
                const subjects: string[] = ["hello world", "foo bar"];
                const result = Str.replaceMatches(
                    /\w+/,
                    (m) => m[0]!.toUpperCase(),
                    subjects,
                    2,
                );
                expectTypeOf(result).toEqualTypeOf<string[] | null>();
            });

            it("handles inline callback with complex return expression", () => {
                const result = Str.replaceMatches(
                    "/(?<first>[a-z])(?<second>[0-9])/",
                    (match) => `${match[0]}!`,
                    "a1b2",
                );
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("handles empty replacement arrays", () => {
                const result = Str.replaceMatches(["/a/", "/b/"], [], "ab");
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("handles single replacement for multiple patterns", () => {
                const result = Str.replaceMatches(
                    ["/a/", "/b/", "/c/"],
                    ["X"],
                    "abc",
                );
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });
        });

        describe("Null return edge cases", () => {
            it("string subject result can be null (invalid regex)", () => {
                const result = Str.replaceMatches("/[invalid/", "x", "foo");
                expectTypeOf(result).toEqualTypeOf<string | null>();
                // Verify null is part of the return type
                expectTypeOf(result).not.toEqualTypeOf<string>();
            });

            it("array subject result can be null (invalid regex)", () => {
                const result = Str.replaceMatches("/[invalid/", "x", ["foo"]);
                expectTypeOf(result).toEqualTypeOf<string[] | null>();
                // Verify null is part of the return type
                expectTypeOf(result).not.toEqualTypeOf<string[]>();
            });
        });
        
        describe("Parameter type inference", () => {
            it("is callable with minimal arguments (no limit)", () => {
                expectTypeOf(Str.replaceMatches).toBeCallableWith(
                    "/foo/",
                    "bar",
                    "foo bar",
                );
            });

            it("is callable with all arguments (including limit)", () => {
                expectTypeOf(Str.replaceMatches).toBeCallableWith(
                    "/foo/",
                    "bar",
                    "foo bar",
                    1,
                );
            });

            it("is callable with callback replacement", () => {
                expectTypeOf(Str.replaceMatches).toBeCallableWith(
                    "/foo/",
                    (m: string[]) => m[0]!,
                    "foo bar",
                );
            });

            it("is callable with RegExp pattern", () => {
                expectTypeOf(Str.replaceMatches).toBeCallableWith(
                    /foo/g,
                    "bar",
                    "foo bar",
                );
            });

            it("is callable with array patterns and array replacements", () => {
                expectTypeOf(Str.replaceMatches).toBeCallableWith(
                    ["/foo/", "/bar/"],
                    ["X", "Y"],
                    "foo bar",
                );
            });

            it("is callable with array subject", () => {
                expectTypeOf(Str.replaceMatches).toBeCallableWith(
                    "/foo/",
                    "bar",
                    ["foo", "bar"],
                );
            });
        });
    });
});
