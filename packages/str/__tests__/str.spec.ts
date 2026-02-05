import { CaseTypes, Stringable } from "@tolki/str";
import * as Str from "@tolki/str";
import type MarkdownIt from "markdown-it";
import type { PluginSimple, PluginWithOptions } from "markdown-it";
import { describe, expect, it } from "vitest";

describe("Str tests", () => {
    describe("of", () => {
        it("Laravel tests", () => {
            expect(Str.of("ééé hannah")).toBeInstanceOf(Stringable);
        });
    });

    describe("after", () => {
        it("Laravel tests", () => {
            expect(Str.after("hannah", "han")).toBe("nah");
            expect(Str.after("hannah", "n")).toBe("nah");
            expect(Str.after("ééé hannah", "han")).toBe("nah");
            expect(Str.after("hannah", "xxxx")).toBe("hannah");
            expect(Str.after("hannah", "")).toBe("hannah");
            expect(Str.after("han0nah", "0")).toBe("nah");
            expect(Str.after("han0nah", 0)).toBe("nah");
            expect(Str.after("han2nah", 2)).toBe("nah");
        });
    });

    describe("afterLast", () => {
        it("Laravel tests", () => {
            expect(Str.afterLast("yvette", "yve")).toBe("tte");
            expect(Str.afterLast("yvette", "t")).toBe("e");
            expect(Str.afterLast("ééé yvette", "t")).toBe("e");
            expect(Str.afterLast("yvette", "tte")).toBe("");
            expect(Str.afterLast("yvette", "xxxx")).toBe("yvette");
            expect(Str.afterLast("yvette", "")).toBe("yvette");
            expect(Str.afterLast("yv0et0te", "0")).toBe("te");
            expect(Str.afterLast("yv0et0te", 0)).toBe("te");
            expect(Str.afterLast("yv2et2te", 2)).toBe("te");
            expect(Str.afterLast("----foo", "---")).toBe("foo");
            // Test with multibyte characters in search string
            expect(Str.afterLast("café au café", "café")).toBe("");
            expect(
                Str.afterLast("こんにちは世界こんにちは", "こんにちは"),
            ).toBe("");
        });
    });

    describe("ascii", () => {
        it("Laravel tests", () => {
            expect(Str.ascii("@")).toBe("@");
            expect(Str.ascii("ü")).toBe("u");
            expect(Str.ascii("")).toBe("");
            expect(Str.ascii("a!2ë")).toBe("a!2e");

            expect(Str.ascii("х Х щ Щ ъ Ъ иа йо")).toBe(
                "h H shch Shch   ia yo",
            );
            expect(Str.ascii("ä ö ü Ä Ö Ü")).toBe("a o u A O U");

            expect(Str.ascii("ééé hannah")).toBe("eee hannah");
            expect(Str.ascii("Héllo Wörld")).toBe("Hello World");
            expect(Str.ascii("Füße")).toBe("Fusse");
            expect(Str.ascii("Straße")).toBe("Strasse");
        });
    });

    describe("transliterate", () => {
        it("Laravel tests", () => {
            const data: [string, string][] = [
                ["ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ", "abcdefghijklmnopqrstuvwxyz"],
                ["⓪①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳", "01234567891011121314151617181920"],
                ["⓵⓶⓷⓸⓹⓺⓻⓼⓽⓾", "12345678910"],
                ["⓿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴", "011121314151617181920"],
                ["ⓣⓔⓢⓣ@ⓛⓐⓡⓐⓥⓔⓛ.ⓒⓞⓜ", "test@laravel.com"],
                ["🎂", ":birthday:"],
                ["abcdefghijklmnopqrstuvwxyz", "abcdefghijklmnopqrstuvwxyz"],
                ["0123456789", "0123456789"],
            ];

            data.forEach(([input, expected]) => {
                expect(Str.transliterate(input)).toBe(expected);
            });
        });
    });

    describe("before", () => {
        it("Laravel tests", () => {
            expect(Str.before("hannah", "nah")).toBe("han");
            expect(Str.before("hannah", "n")).toBe("ha");
            expect(Str.before("ééé hannah", "han")).toBe("ééé ");
            expect(Str.before("hannah", "xxxx")).toBe("hannah");
            expect(Str.before("hannah", "")).toBe("hannah");
            expect(Str.before("han0nah", "0")).toBe("han");
            expect(Str.before("han0nah", 0)).toBe("han");
            expect(Str.before("han2nah", 2)).toBe("han");
            expect(Str.before("", "")).toBe("");
            expect(Str.before("", "a")).toBe("");
            expect(Str.before("a", "a")).toBe("");
            expect(Str.before("foo@bar.com", "@")).toBe("foo");
            expect(Str.before("foo@@bar.com", "@")).toBe("foo");
            expect(Str.before("@foo@bar.com", "@")).toBe("");
        });
    });

    describe("beforeLast", () => {
        it("Laravel tests", () => {
            expect(Str.beforeLast("yvette", "tte")).toBe("yve");
            expect(Str.beforeLast("yvette", "t")).toBe("yvet");
            expect(Str.beforeLast("ééé yvette", "yve")).toBe("ééé ");
            expect(Str.beforeLast("yvette", "yve")).toBe("");
            expect(Str.beforeLast("yvette", "xxxx")).toBe("yvette");
            expect(Str.beforeLast("yvette", "")).toBe("yvette");
            expect(Str.beforeLast("yv0et0te", "0")).toBe("yv0et");
            expect(Str.beforeLast("yv0et0te", 0)).toBe("yv0et");
            expect(Str.beforeLast("yv2et2te", 2)).toBe("yv2et");
            expect(Str.beforeLast("", "test")).toBe("");
            expect(Str.beforeLast("yvette", "yvette")).toBe("");
            expect(Str.beforeLast("laravel framework", " ")).toBe("laravel");
            expect(Str.beforeLast("yvette\tyv0et0te", "\t")).toBe("yvette");
        });
    });

    describe("between", () => {
        it("Laravel tests", () => {
            expect(Str.between("abc", "", "c")).toBe("abc");
            expect(Str.between("abc", "a", "")).toBe("abc");
            expect(Str.between("abc", "", "")).toBe("abc");
            expect(Str.between("abc", "a", "c")).toBe("b");
            expect(Str.between("dddabc", "a", "c")).toBe("b");
            expect(Str.between("abcddd", "a", "c")).toBe("b");
            expect(Str.between("dddabcddd", "a", "c")).toBe("b");
            expect(Str.between("hannah", "ha", "ah")).toBe("nn");
            expect(Str.between("[a]ab[b]", "[", "]")).toBe("a]ab[b");
            expect(Str.between("foofoobar", "foo", "bar")).toBe("foo");
            expect(Str.between("foobarbar", "foo", "bar")).toBe("bar");
            expect(Str.between("12345", 1, 5)).toBe("234");
            expect(Str.between("123456789", "123", "6789")).toBe("45");
            expect(Str.between("nothing", "foo", "bar")).toBe("nothing");
        });
    });

    describe("betweenFirst", () => {
        it("Laravel tests", () => {
            expect(Str.betweenFirst("abc", "", "c")).toBe("abc");
            expect(Str.betweenFirst("abc", "a", "")).toBe("abc");
            expect(Str.betweenFirst("abc", "", "")).toBe("abc");
            expect(Str.betweenFirst("abc", "a", "c")).toBe("b");
            expect(Str.betweenFirst("dddabc", "a", "c")).toBe("b");
            expect(Str.betweenFirst("abcddd", "a", "c")).toBe("b");
            expect(Str.betweenFirst("dddabcddd", "a", "c")).toBe("b");
            expect(Str.betweenFirst("hannah", "ha", "ah")).toBe("nn");
            expect(Str.betweenFirst("[a]ab[b]", "[", "]")).toBe("a");
            expect(Str.betweenFirst("foofoobar", "foo", "bar")).toBe("foo");
            expect(Str.betweenFirst("foobarbar", "foo", "bar")).toBe("");
        });
    });

    describe("camel", () => {
        it("Laravel tests", () => {
            expect(Str.camel("Laravel_p_h_p_framework")).toBe(
                "laravelPHPFramework",
            );
            expect(Str.camel("Laravel_php_framework")).toBe(
                "laravelPhpFramework",
            );
            expect(Str.camel("Laravel-phP-framework")).toBe(
                "laravelPhPFramework",
            );
            expect(Str.camel("Laravel  -_-  php   -_-   framework   ")).toBe(
                "laravelPhpFramework",
            );

            expect(Str.camel("FooBar")).toBe("fooBar");
            expect(Str.camel("foo_bar")).toBe("fooBar");
            expect(Str.camel("foo_bar")).toBe("fooBar");
            expect(Str.camel("Foo-barBaz")).toBe("fooBarBaz");
            expect(Str.camel("foo-bar_baz")).toBe("fooBarBaz");

            expect(Str.camel("")).toBe("");
            expect(Str.camel("LARAVEL_PHP_FRAMEWORK")).toBe(
                "lARAVELPHPFRAMEWORK",
            );
            expect(Str.camel("   laravel   php   framework   ")).toBe(
                "laravelPhpFramework",
            );

            expect(Str.camel("foo1_bar")).toBe("foo1Bar");
            expect(Str.camel("1 foo bar")).toBe("1FooBar");
        });
    });

    describe("charAt", () => {
        it("Laravel tests", () => {
            expect(Str.charAt("Привет, мир!", 1)).toBe("р");
            expect(Str.charAt("「こんにちは世界」", 4)).toBe("ち");
            expect(Str.charAt("Привет, world!", 8)).toBe("w");
            expect(Str.charAt("「こんにちは世界」", -2)).toBe("界");
            expect(Str.charAt("「こんにちは世界」", -200)).toBe(false);
            expect(Str.charAt("Привет, мир!", 100)).toBe(false);
        });
    });

    describe("chopStart", () => {
        it("Laravel tests", () => {
            const data: [string, string | string[], string][] = [
                // Empty string needle tests
                ["", "", ""],
                ["Laravel", "", "Laravel"],
                ["Ship it", ["", "Ship "], "it"],
                // Standard tests
                ["http://laravel.com", "http://", "laravel.com"],
                ["http://-http://", "http://", "-http://"],
                ["http://laravel.com", "htp:/", "http://laravel.com"],
                ["http://laravel.com", "http://www.", "http://laravel.com"],
                ["http://laravel.com", "-http://", "http://laravel.com"],
                ["http://laravel.com", ["https://", "http://"], "laravel.com"],
                [
                    "http://www.laravel.com",
                    ["http://", "www."],
                    "www.laravel.com",
                ],
                ["http://http-is-fun.test", "http://", "http-is-fun.test"],
                // Multibyte emoji tests
                ["🌊✋", "🌊", "✋"],
                ["🌊✋", "✋", "🌊✋"],
                ["🚀🌟💫", "🚀", "🌟💫"],
                ["🚀🌟💫", "🚀🌟", "💫"],
                // Multibyte character tests (Japanese, Chinese, Arabic, etc.)
                ["こんにちは世界", "こんにちは", "世界"],
                ["你好世界", "你好", "世界"],
                ["مرحبا بك", "مرحبا ", "بك"],
                // Mixed multibyte and ASCII
                ["🎉Laravel", "🎉", "Laravel"],
                ["Hello🌍World", "Hello🌍", "World"],
                // Multiple needle array with multibyte
                ["🌊✋🎉", ["🚀", "🌊"], "✋🎉"],
                ["こんにちは世界", ["Hello", "こんにちは"], "世界"],
            ];

            data.forEach(([input, chop, expected]) => {
                expect(Str.chopStart(input, chop)).toBe(expected);
            });
        });
    });

    describe("chopEnd", () => {
        it("Laravel tests", () => {
            const data: [string, string | string[], string][] = [
                // Empty string needle tests
                ["", "", ""],
                ["Laravel", "", "Laravel"],
                ["Ship it", ["", " it"], "Ship"],
                // Standard tests
                ["path/to/file.php", ".php", "path/to/file"],
                [".php-.php", ".php", ".php-"],
                ["path/to/file.php", ".ph", "path/to/file.php"],
                ["path/to/file.php", "foo.php", "path/to/file.php"],
                ["path/to/file.php", ".php-", "path/to/file.php"],
                ["path/to/file.php", [".html", ".php"], "path/to/file"],
                ["path/to/file.php", [".php", "file"], "path/to/file"],
                ["path/to/php.php", ".php", "path/to/php"],
                // Multibyte emoji tests
                ["✋🌊", "🌊", "✋"],
                ["✋🌊", "✋", "✋🌊"],
                ["🌟💫🚀", "🚀", "🌟💫"],
                ["🌟💫🚀", "💫🚀", "🌟"],
                // Multibyte character tests (Japanese, Chinese, Arabic, etc.)
                ["世界こんにちは", "こんにちは", "世界"],
                ["世界你好", "你好", "世界"],
                ["بك مرحبا", " مرحبا", "بك"],
                // Mixed multibyte and ASCII
                ["Laravel🎉", "🎉", "Laravel"],
                ["Hello🌍World", "World", "Hello🌍"],
                // Multiple needle array with multibyte
                ["🎉✋🌊", ["🚀", "🌊"], "🎉✋"],
                ["世界こんにちは", ["Hello", "こんにちは"], "世界"],
            ];

            data.forEach(([input, chop, expected]) => {
                expect(Str.chopEnd(input, chop)).toBe(expected);
            });
        });
    });

    describe("contains", () => {
        it("Laravel tests", () => {
            const data: [
                string,
                string | Iterable<string>,
                boolean,
                boolean,
            ][] = [
                ["Taylor", "ylo", true, true],
                ["Taylor", "ylo", false, true],
                ["Taylor", "taylor", true, true],
                ["Taylor", "taylor", false, false],
                ["Taylor", ["ylo"], true, true],
                ["Taylor", ["ylo"], false, true],
                ["Taylor", ["xxx", "ylo"], true, true],
                ["Taylor", ["xxx", "ylo"], false, true],
                ["Taylor", "xxx", false, false],
                ["Taylor", ["xxx"], false, false],
                ["Taylor", "", false, false],
                ["", "", false, false],
            ];

            data.forEach(([haystack, needles, ignoreCase, expected]) => {
                expect(Str.contains(haystack, needles, ignoreCase)).toBe(
                    expected,
                );
            });
        });

        it("contains with iterable input", () => {
            // Test contains with Set (iterable that is not string or array)
            expect(Str.contains("hello world", new Set(["world"]))).toBe(true);
            expect(Str.contains("hello world", new Set(["foo"]))).toBe(false);
            // Test with ignoreCase and iterable
            expect(Str.contains("hello WORLD", new Set(["world"]), true)).toBe(
                true,
            );
        });
    });

    describe("containsAll", () => {
        it("Laravel tests", () => {
            const data: [string, Iterable<string>, boolean, boolean][] = [
                ["Taylor Otwell", ["taylor", "otwell"], false, false],
                ["Taylor Otwell", ["taylor", "otwell"], true, true],
                ["Taylor Otwell", ["taylor"], false, false],
                ["Taylor Otwell", ["taylor"], true, true],
                ["Taylor Otwell", ["taylor", "xxx"], false, false],
                ["Taylor Otwell", ["taylor", "xxx"], true, false],
            ];

            data.forEach(([haystack, needles, ignoreCase, expected]) => {
                expect(Str.containsAll(haystack, needles, ignoreCase)).toBe(
                    expected,
                );
            });
        });

        it("containsAll with empty iterable returns true", () => {
            // Empty array - no needles means all (none) are found
            expect(Str.containsAll("hello", [])).toBe(true);
        });
    });

    describe("doesntContain", () => {
        it("Laravel tests", () => {
            const data: [
                string,
                string | Iterable<string>,
                boolean,
                boolean,
            ][] = [
                ["Tar", "ylo", true, true],
                ["Tar", "ylo", false, true],
                ["Tar", ["ylo"], true, true],
                ["Tar", ["ylo"], false, true],
                ["Tar", ["xxx", "ylo"], true, true],
                ["Tar", ["xxx", "ylo"], false, true],
                ["Tar", "xxx", false, true],
                ["Tar", ["xxx"], false, true],
                ["Tar", "", false, true],
                ["", "", false, true],
            ];

            data.forEach(([haystack, needles, ignoreCase, expected]) => {
                expect(Str.doesntContain(haystack, needles, ignoreCase)).toBe(
                    expected,
                );
            });
        });

        it("doesntContain with iterable", () => {
            // Test doesntContain with iterable input
            expect(Str.doesntContain("hello world", new Set(["foo"]))).toBe(
                true,
            );
            expect(Str.doesntContain("hello world", new Set(["hello"]))).toBe(
                false,
            );
        });
    });

    describe("convertCase", () => {
        it("Laravel tests", () => {
            expect(Str.convertCase("hello", CaseTypes.upper)).toBe("HELLO");
            expect(Str.convertCase("WORLD", CaseTypes.lower)).toBe("world");
            expect(Str.convertCase("HeLLo", CaseTypes.fold)).toBe("hello");
            expect(Str.convertCase("WoRLD", CaseTypes.fold)).toBe("world");
            expect(Str.convertCase("üöä", CaseTypes.upper)).toBe("ÜÖÄ");
            expect(Str.convertCase("ÜÖÄ", CaseTypes.lower)).toBe("üöä");
            expect(Str.convertCase("hello world", CaseTypes.title)).toBe(
                "Hello World",
            );
            expect(Str.convertCase("Hello World", CaseTypes.title)).toBe(
                "Hello World",
            );
            expect(Str.convertCase("hello-world_test", CaseTypes.simple)).toBe(
                "hello world test",
            );
            expect(
                Str.convertCase("hello-world_test", CaseTypes.lower_simple),
            ).toBe("hello world test");
            expect(
                Str.convertCase("hello-world_test", CaseTypes.title_simple),
            ).toBe("Hello World Test");
            expect(
                Str.convertCase("hello-world_test", CaseTypes.fold_simple),
            ).toBe("hello world test");
        });
    });

    describe("deduplicate", () => {
        it("Laravel tests", () => {
            expect(Str.deduplicate(" laravel   php  framework ")).toBe(
                " laravel php framework ",
            );
            expect(Str.deduplicate("whaaat", "a")).toBe("what");
            expect(Str.deduplicate("/some//odd//path/", "/")).toBe(
                "/some/odd/path/",
            );
            expect(Str.deduplicate("ムだだム", "だ")).toBe("ムだム");
            expect(
                Str.deduplicate(" laravell    foreverrr  ", [" ", "l", "r"]),
            ).toBe(" laravel forever ");
        });

        it("deduplicate with array of characters", () => {
            // Test deduplicate with array (covers isArray branch)
            expect(Str.deduplicate("aaa---bbb", ["a", "-"])).toBe("a-bbb");
        });
    });

    describe("endsWith", () => {
        it("Laravel tests", () => {
            expect(Str.endsWith("jason", "on")).toBe(true);
            expect(Str.endsWith("jason", "jason")).toBe(true);
            expect(Str.endsWith("jason", ["on"])).toBe(true);
            expect(Str.endsWith("jason", ["no", "on"])).toBe(true);
            // expect(Str.endsWith("jason", collect(["no", "on"]))).toBe(true); // TODO
            expect(Str.endsWith("jason", "no")).toBe(false);
            expect(Str.endsWith("jason", ["no"])).toBe(false);
            expect(Str.endsWith("jason", "")).toBe(false);
            expect(Str.endsWith("", "")).toBe(false);
            // @ts-expect-error expect bad parameter type
            expect(Str.endsWith("jason", [null])).toBe(false);
            // @ts-expect-error expect bad parameter type
            expect(Str.endsWith("jason", null)).toBe(false);
            expect(Str.endsWith("jason", "N")).toBe(false);
            expect(Str.endsWith("7", " 7")).toBe(false);
            expect(Str.endsWith("a7", "7")).toBe(true);
            expect(Str.endsWith("a7", 7)).toBe(true);
            expect(Str.endsWith("a7.12", 7.12)).toBe(true);
            expect(Str.endsWith("a7.12", 7.13)).toBe(false);
            expect(Str.endsWith(0.27, "7")).toBe(true);
            expect(Str.endsWith(0.27, "0.27")).toBe(true);
            expect(Str.endsWith(0.27, "8")).toBe(false);
            expect(Str.endsWith(null, "Marc")).toBe(false);
            // Test for multibyte string support
            expect(Str.endsWith("Jönköping", "öping")).toBe(true);
            expect(Str.endsWith("Malmö", "mö")).toBe(true);
            expect(Str.endsWith("Jönköping", "oping")).toBe(false);
            expect(Str.endsWith("Malmö", "mo")).toBe(false);
            expect(Str.endsWith("你好", "好")).toBe(true);
            expect(Str.endsWith("你好", "你")).toBe(false);
            expect(Str.endsWith("你好", "a")).toBe(false);
        });
    });

    describe("doesntEndWith", () => {
        it("Laravel tests", () => {
            expect(Str.doesntEndWith("jason", "on")).toBe(false);
            expect(Str.doesntEndWith("jason", "jason")).toBe(false);
            expect(Str.doesntEndWith("jason", ["on"])).toBe(false);
            expect(Str.doesntEndWith("jason", ["no", "on"])).toBe(false);
            // expect(Str.doesntEndWith("jason", collect(["no", "on"]))).toBe(false); // TODO
            expect(Str.doesntEndWith("jason", "no")).toBe(true);
            expect(Str.doesntEndWith("jason", ["no"])).toBe(true);
            expect(Str.doesntEndWith("jason", "")).toBe(true);
            expect(Str.doesntEndWith("", "")).toBe(true);
            // @ts-expect-error expect bad parameter type
            expect(Str.doesntEndWith("jason", [null])).toBe(true);
            // @ts-expect-error expect bad parameter type
            expect(Str.doesntEndWith("jason", null)).toBe(true);
            expect(Str.doesntEndWith("jason", "N")).toBe(true);
            expect(Str.doesntEndWith("7", " 7")).toBe(true);
            expect(Str.doesntEndWith("a7", "7")).toBe(false);
            expect(Str.doesntEndWith("a7", 7)).toBe(false);
            expect(Str.doesntEndWith("a7.12", 7.12)).toBe(false);
            expect(Str.doesntEndWith("a7.12", 7.13)).toBe(true);
            expect(Str.doesntEndWith(0.27, "7")).toBe(false);
            expect(Str.doesntEndWith(0.27, "0.27")).toBe(false);
            expect(Str.doesntEndWith(0.27, "8")).toBe(true);
            expect(Str.doesntEndWith(null, "Marc")).toBe(true);
            // Test for multibyte string support
            expect(Str.doesntEndWith("Jönköping", "öping")).toBe(false);
            expect(Str.doesntEndWith("Malmö", "mö")).toBe(false);
            expect(Str.doesntEndWith("Jönköping", "oping")).toBe(true);
            expect(Str.doesntEndWith("Malmö", "mo")).toBe(true);
            expect(Str.doesntEndWith("你好", "好")).toBe(false);
            expect(Str.doesntEndWith("你好", "你")).toBe(true);
            expect(Str.doesntEndWith("你好", "a")).toBe(true);
        });
    });

    describe("excerpt", () => {
        it("Laravel tests", () => {
            expect(
                Str.excerpt("This is a beautiful morning", "beautiful", {
                    radius: 5,
                }),
            ).toBe("...is a beautiful morn...");
            expect(
                Str.excerpt("This is a beautiful morning", "this", {
                    radius: 5,
                }),
            ).toBe("This is a...");
            expect(
                Str.excerpt("This is a beautiful morning", "morning", {
                    radius: 5,
                }),
            ).toBe("...iful morning");
            expect(
                Str.excerpt("This is a beautiful morning", "day"),
            ).toBeNull();
            expect(
                Str.excerpt("This is a beautiful! morning", "Beautiful", {
                    radius: 5,
                }),
            ).toBe("...is a beautiful! mor...");
            expect(
                Str.excerpt("This is a beautiful? morning", "beautiful", {
                    radius: 5,
                }),
            ).toBe("...is a beautiful? mor...");
            expect(Str.excerpt("", "", { radius: 0 })).toBe("");
            expect(Str.excerpt("a", "a", { radius: 0 })).toBe("a");
            expect(Str.excerpt("abc", "B", { radius: 0 })).toBe("...b...");
            expect(Str.excerpt("abc", "b", { radius: 1 })).toBe("abc");
            expect(Str.excerpt("abcd", "b", { radius: 1 })).toBe("abc...");
            expect(Str.excerpt("zabc", "b", { radius: 1 })).toBe("...abc");
            expect(Str.excerpt("zabcd", "b", { radius: 1 })).toBe("...abc...");
            expect(Str.excerpt("zabcd", "b", { radius: 2 })).toBe("zabcd");
            expect(Str.excerpt("  zabcd  ", "b", { radius: 4 })).toBe("zabcd");
            expect(Str.excerpt("z  abc  d", "b", { radius: 1 })).toBe(
                "...abc...",
            );
            expect(
                Str.excerpt("This is a beautiful morning", "beautiful", {
                    omission: "[...]",
                    radius: 5,
                }),
            ).toBe("[...]is a beautiful morn[...]");
            expect(
                Str.excerpt(
                    "This is the ultimate supercalifragilisticexpialidocious very looooooooooooooooooong looooooooooooong beautiful morning with amazing sunshine and awesome temperatures. So what are you gonna do about it?",
                    "very",
                    { omission: "[...]" },
                ),
            ).toBe(
                "This is the ultimate supercalifragilisticexpialidocious very looooooooooooooooooong looooooooooooong beautiful morning with amazing sunshine and awesome tempera[...]",
            );
            expect(Str.excerpt("taylor", "y", { radius: 0 })).toBe("...y...");
            expect(Str.excerpt("taylor", "Y", { radius: 1 })).toBe("...ayl...");
            expect(
                Str.excerpt("<div> The article description </div>", "article"),
            ).toBe("<div> The article description </div>");
            expect(
                Str.excerpt("<div> The article description </div>", "article", {
                    radius: 5,
                }),
            ).toBe("...The article desc...");
            expect(
                Str.excerpt(
                    Str.stripTags("<div> The article description </div>"),
                    "article",
                ),
            ).toBe("The article description");
            expect(Str.excerpt(null)).toBe("");
            expect(Str.excerpt("")).toBe("");
            expect(Str.excerpt(null, "")).toBe("");
            expect(
                Str.excerpt("The article description", null, { radius: 1 }),
            ).toBe("T...");
            expect(
                Str.excerpt("The article description", "", { radius: 8 }),
            ).toBe("The arti...");
            expect(Str.excerpt(" ")).toBe("");
            expect(
                Str.excerpt("The article description", " ", { radius: 4 }),
            ).toBe("The arti...");
            expect(
                Str.excerpt("The article description", "description", {
                    radius: 4,
                }),
            ).toBe("...cle description");
            expect(
                Str.excerpt("The article description", "T", { radius: 0 }),
            ).toBe("T...");
            expect(
                Str.excerpt("What is the article?", "What", {
                    radius: 2,
                    omission: "?",
                }),
            ).toBe("What i?");

            expect(
                Str.excerpt("åèö - 二 sān 大åèö", "二 sān", { radius: 4 }),
            ).toBe("...ö - 二 sān 大åè...");
            expect(
                Str.excerpt("åèö - 二 sān 大åèö", "åèö", { radius: 4 }),
            ).toBe("åèö - 二...");
            expect(
                Str.excerpt("åèö - 二 sān 大åèö", "åèö - 二 sān 大åèö", {
                    radius: 4,
                }),
            ).toBe("åèö - 二 sān 大åèö");
            expect(
                Str.excerpt("åèö - 二 sān 大åèö", "åèö - 二 sān 大åèö", {
                    radius: 4,
                }),
            ).toBe("åèö - 二 sān 大åèö");
            expect(Str.excerpt("㏗༼㏗", "༼", { radius: 0 })).toBe("...༼...");
            expect(Str.excerpt("㏗༼㏗", "༼", { radius: 0 })).toBe("...༼...");
            expect(Str.excerpt("Como você está", "ê", { radius: 2 })).toBe(
                "...ocê e...",
            );
            expect(Str.excerpt("Como você está", "Ê", { radius: 2 })).toBe(
                "...ocê e...",
            );
            expect(Str.excerpt("João Antônio ", "jo", { radius: 2 })).toBe(
                "João...",
            );
            expect(Str.excerpt("João Antônio", "JOÃO", { radius: 5 })).toBe(
                "João Antô...",
            );
            expect(Str.excerpt("", "/")).toBe(null);
            expect(
                Str.excerpt("This is my name", "my", {
                    radius: 3,
                    omission: "(...) ",
                }),
            ).toBe("(...) is my na(...) ");
            expect(
                Str.excerpt("This is my name", "name", {
                    radius: 3,
                    omission: "(...) ",
                }),
            ).toBe("(...) my name");
        });

        it("excerpt edge cases for start/end segments", () => {
            // Test when startSlice equals rawStart (no omission prefix needed)
            expect(Str.excerpt("abc", "b", { radius: 10 })).toBe("abc");
            // Test when endSlice equals rawEnd (no omission suffix needed)
            expect(Str.excerpt("abc", "a", { radius: 10 })).toBe("abc");
            // Test excerpt where start segment needs trimming
            expect(
                Str.excerpt("   hello world   ", "world", { radius: 2 }),
            ).toBe("...o world");
            // Test with phrase at the very beginning - rawStart is empty
            expect(Str.excerpt("hello world", "hello", { radius: 0 })).toBe(
                "hello...",
            );
            // Test with phrase at the very end - rawEnd is empty
            expect(Str.excerpt("hello world", "world", { radius: 0 })).toBe(
                "...world",
            );
        });

        it("excerpt with empty rawStart and rawEnd segments", () => {
            // Phrase at the very start - rawStart is empty after ltrim
            expect(Str.excerpt("abc def", "abc", { radius: 0 })).toBe("abc...");
            // Phrase at the very end - rawEnd is empty after rtrim
            expect(Str.excerpt("abc def", "def", { radius: 0 })).toBe("...def");
            // Both rawStart and rawEnd are significant - tests the !== comparison
            expect(Str.excerpt("123 abc 456", "abc", { radius: 2 })).toBe(
                "...3 abc 4...",
            );
        });

        it("excerpt with startSlice not equal to rawStart", () => {
            // When the start segment gets sliced down, startOut !== rawStart triggers omission prefix
            // This is already tested in the main excerpt tests - this verifies branch coverage
            expect(
                Str.excerpt("a very long prefix here xyz", "xyz", {
                    radius: 4,
                }),
            ).toBe("...ere xyz");
        });
    });

    describe("finish", () => {
        it("Laravel tests", () => {
            expect(Str.finish("ab", "bc")).toBe("abbc");
            expect(Str.finish("abbcbc", "bc")).toBe("abbc");
            expect(Str.finish("abcbbcbc", "bc")).toBe("abcbbc");
        });
    });

    describe("wrap", () => {
        it("wrap tests", () => {
            expect(Str.wrap("value", '"')).toBe('"value"');
            expect(Str.wrap("-bar-", "foo", "baz")).toBe("foo-bar-baz");
        });

        it("wrap edge cases", () => {
            expect(Str.wrap("mid", "[]")).toBe("[]mid[]");
            expect(Str.wrap("mid", "(", "")).toBe("(mid");
            expect(Str.wrap("mid", "<")).toBe("<mid<");
            expect(Str.wrap("value", "")).toBe("value");
            expect(Str.wrap("", "[]")).toBe("[][]");
            expect(Str.wrap("値", "«", "»")).toBe("«値»");
            expect(Str.wrap("X", "🧪")).toBe("🧪X🧪");
        });
    });

    describe("unwrap", () => {
        it("Laravel tests", () => {
            expect(Str.unwrap("[hello]", "[", "]")).toBe("hello");
            // unwrap only removes a single layer of the provided wrappers
            expect(Str.unwrap("((value))", "(", ")")).toBe("(value)");
            // Only a single leading/trailing wrapper removed; inner remains
            expect(Str.unwrap("**bold**", "*")).toBe("*bold*");
            expect(Str.unwrap("no-wrappers", "[", "]")).toBe("no-wrappers");

            expect(Str.unwrap('"value"', '"')).toBe("value");
            expect(Str.unwrap('"value', '"')).toBe("value");
            expect(Str.unwrap('value"', '"')).toBe("value");
            expect(Str.unwrap("foo-bar-baz", "foo-", "-baz")).toBe("bar");
            expect(Str.unwrap('{some: "json"}', "{", "}")).toBe('some: "json"');
        });
    });

    describe("is", () => {
        it("Laravel tests", () => {
            expect(Str.is("/", "/")).toBe(true);
            expect(Str.is("/", " /")).toBe(false);
            expect(Str.is("/", "/a")).toBe(false);
            expect(Str.is("foo/*", "foo/bar/baz")).toBe(true);

            expect(Str.is("*@*", "App\\Class@method")).toBe(true);
            expect(Str.is("*@*", "app\\Class@")).toBe(true);
            expect(Str.is("*@*", "@method")).toBe(true);

            // is case sensitive
            expect(Str.is("*BAZ*", "foo/bar/baz")).toBe(false);
            expect(Str.is("*FOO*", "foo/bar/baz")).toBe(false);
            expect(Str.is("A", "a")).toBe(false);

            // is not case sensitive
            expect(Str.is("A", "a", true)).toBe(true);
            expect(Str.is("*BAZ*", "foo/bar/baz", true)).toBe(true);
            expect(Str.is(["A*", "B*"], "a/", true)).toBe(true);
            expect(Str.is(["A*", "B*"], "f/", true)).toBe(false);
            expect(Str.is("FOO", "foo", true)).toBe(true);
            expect(Str.is("*FOO*", "foo/bar/baz", true)).toBe(true);
            expect(Str.is("foo/*", "FOO/bar", true)).toBe(true);

            // Accepts array of patterns
            expect(Str.is(["a*", "b*"], "a/")).toBe(true);
            expect(Str.is(["a*", "b*"], "b/")).toBe(true);
            expect(Str.is(["a*", "b*"], "f/")).toBe(false);

            // numeric values and patterns
            expect(Str.is(["a*", "b*"], 123)).toBe(false);
            expect(Str.is(["*2*", "b*"], 11211)).toBe(true);

            expect(Str.is("*/foo", "blah/baz/foo")).toBe(true);

            expect(Str.is([], "test")).toBe(false);

            expect(Str.is("", 0)).toBe(false);
            // @ts-expect-error expect bad parameter type
            expect(Str.is([null], 0)).toBe(false);
            // @ts-expect-error expect bad parameter type
            expect(Str.is([null], null)).toBe(true);
        });
    });

    describe("isAscii", () => {
        it("Laravel tests", () => {
            expect(Str.isAscii("Hello World")).toBe(true);
            expect(Str.isAscii("こんにちは")).toBe(false);
            expect(Str.isAscii("12345")).toBe(true);
            expect(Str.isAscii("!@#$%")).toBe(true);
            expect(Str.isAscii("Hello こんにちは")).toBe(false);
        });
    });

    describe("isJson", () => {
        it("Laravel tests", () => {
            expect(Str.isJson("1")).toBe(true);
            expect(Str.isJson("[1,2,3]")).toBe(true);
            expect(Str.isJson("[1,   2,   3]")).toBe(true);
            expect(Str.isJson('{"first": "John", "last": "Doe"}')).toBe(true);
            expect(
                Str.isJson(
                    '[{"first": "John", "last": "Doe"}, {"first": "Jane", "last": "Doe"}]',
                ),
            ).toBe(true);

            expect(Str.isJson("1,")).toBe(false);
            expect(Str.isJson("[1,2,3")).toBe(false);
            expect(Str.isJson("[1,   2   3]")).toBe(false);
            expect(Str.isJson('{first: "John"}')).toBe(false);
            expect(Str.isJson('[{first: "John"}, {first: "Jane"}]')).toBe(
                false,
            );
            expect(Str.isJson("")).toBe(false);
            expect(Str.isJson(null)).toBe(false);
            expect(Str.isJson([])).toBe(false);
        });
    });

    describe("isUrl", () => {
        it("Laravel tests", () => {
            expect(Str.isUrl(789)).toBe(false);
            expect(Str.isUrl("https://laravel.com")).toBe(true);
            expect(Str.isUrl("https://laravel.com", ["http", "https"])).toBe(
                true,
            );
            expect(Str.isUrl("http://localhost")).toBe(true);
            expect(Str.isUrl("invalid url")).toBe(false);
        });

        it("isUrl with URL parser validation and regex fallback", () => {
            // Test URL that passes URL parser validation
            expect(Str.isUrl("http://example.com")).toBe(true);
            // Test URL with custom protocol that falls through to regex
            expect(Str.isUrl("ftp://example.com", ["ftp"])).toBe(true);
            // Test URL with unsupported scheme that falls back to regex
            expect(Str.isUrl("custom://example.com", ["custom"])).toBe(true);
            // Test URL that fails URL parser and regex
            expect(Str.isUrl("not a url")).toBe(false);
            // Test malformed URL that throws in URL parser
            expect(Str.isUrl("://invalid", ["http"])).toBe(false);
        });

        it("isUrl with scheme that fails URL parser but passes regex", () => {
            // URL with custom protocol that's in the list but fails URL parsing
            expect(Str.isUrl("file:///path/to/file", ["file"])).toBe(true);
            // URL that is syntactically valid according to the regex
            expect(Str.isUrl("custom://valid.domain", ["custom"])).toBe(true);
        });

        it("isUrl with scheme not in list after URL parser", () => {
            // URL parses successfully but scheme is not in allowed list
            expect(Str.isUrl("https://example.com", ["ftp"])).toBe(false);
        });
    });

    describe("isUuid", () => {
        it("Laravel tests", () => {
            const data = [
                ["a0a2a2d2-0b87-4a18-83f2-2529882be2de"],
                ["145a1e72-d11d-11e8-a8d5-f2801f1b9fd1"],
                ["00000000-0000-0000-0000-000000000000"],
                ["e60d3f48-95d7-4d8d-aad0-856f29a27da2"],
                ["ff6f8cb0-c57d-11e1-9b21-0800200c9a66"],
                ["ff6f8cb0-c57d-21e1-9b21-0800200c9a66"],
                ["ff6f8cb0-c57d-31e1-9b21-0800200c9a66"],
                ["ff6f8cb0-c57d-41e1-9b21-0800200c9a66"],
                ["ff6f8cb0-c57d-51e1-9b21-0800200c9a66"],
                ["FF6F8CB0-C57D-11E1-9B21-0800200C9A66"],
            ];

            data.forEach(([uuid]) => {
                expect(Str.isUuid(uuid)).toBe(true);
            });

            expect(Str.isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(
                true,
            );
            expect(Str.isUuid("123e4567-e89b-12d3-a456-426614174000", 1)).toBe(
                true,
            );
            expect(Str.isUuid("123e4567-e89b-12d3-a456-426614174000", 0)).toBe(
                false,
            );
            expect(Str.isUuid("123e4567-e89b-12d3-a456-426614174000", 10)).toBe(
                false,
            );
            expect(Str.isUuid("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b", 4)).toBe(
                true,
            );
            expect(Str.isUuid("123e4567-e89b-12d3-a456-426614174000", 5)).toBe(
                false,
            );
            expect(Str.isUuid("01991243-ae64-717d-92e2-5da7281338ff", 7)).toBe(
                true,
            );
            expect(
                Str.isUuid("00000000-0000-0000-0000-000000000000", "nil"),
            ).toBe(true);
            expect(
                Str.isUuid("ffffffff-ffff-ffff-ffff-ffffffffffff", "max"),
            ).toBe(true);
            expect(Str.isUuid("invalid-uuid")).toBe(false);
            expect(Str.isUuid("invalid-uuid", 7)).toBe(false);
            expect(Str.isUuid(4746392, 7)).toBe(false);
        });
    });

    describe("isUlid", () => {
        it("Laravel tests", () => {
            const id = Str.ulid();
            expect(id).toHaveLength(26);
            expect(Str.isUlid(id)).toBe(true);
            expect(Str.isUlid(id.toLowerCase())).toBe(true); // ULIDs are case-insensitive per spec
            expect(Str.isUlid("invalid-ulid")).toBe(false);
            expect(Str.isUlid(4746392)).toBe(false);
        });
    });

    describe("kebab", () => {
        it("Laravel tests", () => {
            expect(Str.kebab("LaravelPhpFramework")).toBe(
                "laravel-php-framework",
            );
            expect(Str.kebab("Laravel Php Framework")).toBe(
                "laravel-php-framework",
            );
            expect(Str.kebab("Laravel ❤ Php Framework")).toBe(
                "laravel❤-php-framework",
            );
            expect(Str.kebab("")).toBe("");
        });
    });

    describe("length", () => {
        it("Laravel tests", () => {
            expect(Str.length("foo bar baz")).toBe(11);
            expect(Str.length("Hello こんにちは")).toBe(11);
        });
    });

    describe("limit", () => {
        it("limit", () => {
            expect(
                Str.limit(
                    "Laravel is a free, open source PHP web application framework.",
                    10,
                ),
            ).toBe("Laravel is...");
            expect(Str.limit("这是一段中文", 3)).toBe("这是一...");
            expect(
                Str.limit(
                    "Laravel is a free, open source PHP web application framework.",
                    15,
                    "...",
                    true,
                ),
            ).toBe("Laravel is a...");

            const string = "The PHP framework for web artisans.";
            expect(Str.limit(string, 7)).toBe("The PHP...");
            expect(Str.limit(string, 10, "...", true)).toBe("The PHP...");
            expect(Str.limit(string, 7, "")).toBe("The PHP");
            expect(Str.limit(string, 10, "", true)).toBe("The PHP");
            expect(Str.limit(string, 100)).toBe(
                "The PHP framework for web artisans.",
            );
            expect(Str.limit(string, 100, "...", true)).toBe(
                "The PHP framework for web artisans.",
            );
            expect(Str.limit(string, 20, "...", true)).toBe(
                "The PHP framework...",
            );

            const nonAsciiString = "这是一段中文";
            expect(Str.limit(nonAsciiString, 3)).toBe("这是一...");
            expect(Str.limit(nonAsciiString, 3, "...", true)).toBe("这是一...");
            expect(Str.limit(nonAsciiString, 3, "")).toBe("这是一");
            expect(Str.limit(nonAsciiString, 3, "", true)).toBe("这是一");

            expect(Str.limit("The PHP", 5, "...", true)).toBe("The...");
            expect(Str.limit("Hello world", 5, "...", true)).toBe("Hello...");
        });

        it("limit when value length equals limit", () => {
            // Exactly at limit returns unchanged
            expect(Str.limit("hello", 5)).toBe("hello");
        });

        it("limit with value shorter than limit", () => {
            // value.length <= limit returns unchanged
            expect(Str.limit("hi", 5)).toBe("hi");
        });

        it("limit using default parameter (100)", () => {
            // Uses default limit of 100
            const shortString = "Short string";
            expect(Str.limit(shortString)).toBe(shortString);
        });
    });

    describe("lower", () => {
        it("Laravel tests", () => {
            expect(Str.lower("FOO BAR BAZ")).toBe("foo bar baz");
            expect(Str.lower("fOo Bar bAz")).toBe("foo bar baz");
        });
    });

    describe("words", () => {
        it("Laravel Tests", () => {
            expect(Str.words("Taylor Otwell", 1)).toBe("Taylor...");
            expect(Str.words("Taylor Otwell", 1, "___")).toBe("Taylor___");
            expect(Str.words("Taylor Otwell", 3)).toBe("Taylor Otwell");
            expect(Str.words("Taylor Otwell", -1, "...")).toBe("Taylor Otwell");
            expect(Str.words("", 3, "...")).toBe("");

            expect(Str.words("这是 段中文", 1)).toBe("这是...");
            expect(Str.words("这是 段中文", 1, "___")).toBe("这是___");
            expect(Str.words("这是-段中文", 3, "___")).toBe("这是-段中文");
            expect(Str.words("这是     段中文", 1, "___")).toBe("这是___");

            expect(Str.words(" Taylor Otwell ", 3)).toBe(" Taylor Otwell ");
            expect(Str.words(" Taylor Otwell ", 1)).toBe(" Taylor...");
        });

        it("words with match same as original length", () => {
            // Test when word count matches original (no truncation)
            expect(Str.words("one two three", 3)).toBe("one two three");
            expect(Str.words("one two three", 10)).toBe("one two three");
            // Test with leading/trailing whitespace preserved
            expect(Str.words(" one two ", 10)).toBe(" one two ");
        });

        it("words when match length equals original length", () => {
            // Test when the regex matches but the result is the same length
            expect(Str.words("a b", 10)).toBe("a b");
        });

        it("words with no match", () => {
            // Edge case: empty value
            expect(Str.words("", 5)).toBe("");
        });

        it("words with regex not matching", () => {
            // Edge case where regex might not match at all (empty string after whitespace trim)
            expect(Str.words("", 1)).toBe("");
        });

        it("words with empty string", () => {
            // Empty string returns unchanged (no match)
            expect(Str.words("", 5)).toBe("");
        });

        it("words with only whitespace", () => {
            // Whitespace-only string - matches but equal length returns unchanged
            expect(Str.words("   ", 5)).toBe("   ");
        });

        it("words with 0 returns original", () => {
            // words <= 0 returns original
            expect(Str.words("hello world", 0)).toBe("hello world");
        });

        it("words using default parameter (100)", () => {
            // Uses default words limit of 100
            const shortString = "Short string";
            expect(Str.words(shortString)).toBe(shortString);
        });
    });

    describe("markdown", () => {
        it("renders basic heading without anchors", () => {
            expect(Str.markdown("# Hello World")).toBe(
                "<h1>Hello World</h1>\n",
            );
        });

        it("respects html=false (escapes) vs html=true (allows)", () => {
            const md = "A paragraph with <b>bold</b>.";
            expect(Str.markdown(md)).toContain("&lt;b&gt;bold&lt;/b&gt;"); // default html false
            const allowed = Str.markdown(md, { html: true });
            expect(allowed).toContain("<b>bold</b>");
        });

        it("linkify true by default and can be disabled", () => {
            const text = "Visit https://example.com now";
            const withLink = Str.markdown(text);
            expect(withLink).toMatch(/<a href="https:\/\/example.com"/);
            const withoutLink = Str.markdown(text, { linkify: false });
            expect(withoutLink).not.toMatch(/<a href/);
        });

        it("breaks true by default converts single newline to <br>", () => {
            const input = "Line1\nLine2";
            const withBreak = Str.markdown(input);
            expect(withBreak).toContain("Line1<br>");
            const withoutBreak = Str.markdown(input, { breaks: false });
            // No <br>, still one paragraph
            expect(withoutBreak).toContain("<p>Line1\nLine2</p>");
        });

        it("gfm task list plugin on by default and can be disabled", () => {
            const task = "- [x] Done\n- [ ] Pending";
            const withGfm = Str.markdown(task);
            // Attribute order from markdown-it-task-lists isn't guaranteed; use lookaheads instead of strict ordering.
            expect(withGfm).toMatch(
                /<input(?=[^>]*class="task-list-item-checkbox")(?=[^>]*type="checkbox")(?=[^>]*checked)/,
            );
            const withoutGfm = Str.markdown(task, { gfm: false });
            expect(withoutGfm).not.toMatch(/<input[^>]*type="checkbox"/);
            expect(withoutGfm).toContain("[x] Done");
        });

        it("anchors true (boolean) adds id + tabindex", () => {
            const out = Str.markdown("# Title", { anchors: true });
            expect(out).toMatch(/<h1 id="title"[^>]*>Title<\/h1>/);
        });

        it("anchors object allows custom slugify", () => {
            const out = Str.markdown("# My Heading", {
                anchors: { slugify: () => "custom-slug" },
            });
            expect(out).toMatch(/<h1 id="custom-slug"/);
        });

        it("supports extensions as plugin and [plugin, options] tuple", () => {
            // Plugin adding data-ext attr to paragraph_open
            const paragraphAttrPlugin: PluginWithOptions<unknown> = (
                md: MarkdownIt,
                opts?: unknown,
            ) => {
                const attrName =
                    (opts as { attrName?: string } | undefined)?.attrName ||
                    "data-ext";
                const orig =
                    md.renderer.rules["paragraph_open"] ||
                    ((
                        tokens: unknown[],
                        idx: number,
                        _o: unknown,
                        _e: unknown,
                        self: {
                            renderToken: (
                                tokens: unknown[],
                                idx: number,
                                options: unknown,
                            ) => string;
                        },
                    ) => self.renderToken(tokens, idx, _o));

                // @ts-expect-error type-not-assignable
                md.renderer.rules["paragraph_open"] = (
                    tokens: unknown[],
                    idx: number,
                    options: unknown,
                    env: unknown,
                    self: {
                        renderToken: (
                            tokens: unknown[],
                            idx: number,
                            options: unknown,
                        ) => string;
                    },
                ) => {
                    (
                        tokens as Array<{
                            attrPush: (attr: [string, string]) => void;
                        }>
                    )[idx]!.attrPush([attrName, "1"]);
                    return (
                        orig as unknown as (
                            tokens: unknown[],
                            idx: number,
                            options: unknown,
                            env: unknown,
                            self: {
                                renderToken: (
                                    tokens: unknown[],
                                    idx: number,
                                    options: unknown,
                                ) => string;
                            },
                        ) => string
                    )(tokens, idx, options, env, self);
                };
            };

            // Plugin adding class to h1
            const headingClassPlugin: PluginSimple = (md: MarkdownIt) => {
                const orig =
                    md.renderer.rules["heading_open"] ||
                    ((
                        tokens: unknown[],
                        idx: number,
                        _o: unknown,
                        _e: unknown,
                        self: {
                            renderToken: (
                                tokens: unknown[],
                                idx: number,
                                options: unknown,
                            ) => string;
                        },
                    ) => self.renderToken(tokens, idx, _o));
                // @ts-expect-error type-not-assignable
                md.renderer.rules["heading_open"] = (
                    tokens: unknown[],
                    idx: number,
                    options: unknown,
                    env: unknown,
                    self: {
                        renderToken: (
                            tokens: unknown[],
                            idx: number,
                            options: unknown,
                        ) => string;
                    },
                ) => {
                    const token = (
                        tokens as Array<{
                            tag?: string;
                            attrPush: (attr: [string, string]) => void;
                        }>
                    )[idx]!;
                    if (token.tag === "h1") {
                        token.attrPush(["data-head", "yes"]);
                    }
                    return (
                        orig as unknown as (
                            tokens: unknown[],
                            idx: number,
                            options: unknown,
                            env: unknown,
                            self: {
                                renderToken: (
                                    tokens: unknown[],
                                    idx: number,
                                    options: unknown,
                                ) => string;
                            },
                        ) => string
                    )(tokens, idx, options, env, self);
                };
            };

            const out = Str.markdown("# Title\n\nParagraph.", {}, [
                headingClassPlugin,
                [paragraphAttrPlugin, { attrName: "data-added" }],
            ]);
            expect(out).toMatch(/<h1[^>]*data-head="yes"/);
            expect(out).toMatch(/<p[^>]*data-added="1"/);
        });

        it("passes through rest options (typographer)", () => {
            const out = Str.markdown("Wait...", { typographer: true });
            // typographer converts three dots to ellipsis
            expect(out).toContain("Wait…");
        });

        it("allows unsafe links", () => {
            const html = Str.markdown("[click me](javascript:alert(1))", {
                allowUnsafeLinks: true,
            });
            expect(html).toBe(
                '<p><a href="javascript:alert(1)">click me</a></p>\n',
            );
        });

        it("disallows unsafe links by default", () => {
            const html = Str.markdown("[click me](javascript:alert(1))");
            expect(html).toBe("<p>[click me](javascript:alert(1))</p>\n");
        });
    });

    describe("inlineMarkdown", () => {
        it("renders emphasis inline only", () => {
            expect(Str.inlineMarkdown("*hi* there")).toBe("<em>hi</em> there");
        });

        it("linkify true by default", () => {
            const html = Str.inlineMarkdown("See https://example.com");
            expect(html).toMatch(/<a href="https:\/\/example.com"/);
        });

        it("linkify can be disabled", () => {
            const html = Str.inlineMarkdown("See https://example.com", {
                linkify: false,
            });
            expect(html).toContain("https://example.com");
            expect(html).not.toMatch(/<a href/);
        });

        it("breaks true converts newline to <br>", () => {
            const html = Str.inlineMarkdown("Hello\nWorld");
            expect(html).toBe("Hello<br>\nWorld");
        });

        it("gfm task list ignored inline when disabled", () => {
            const html = Str.inlineMarkdown("- [x] Done", { gfm: false });
            // With gfm disabled expect raw task text unchanged
            expect(html).toContain("- [x] Done");
        });

        it("extensions applied (simple plugin example)", () => {
            const plugin: PluginSimple = (md: MarkdownIt) => {
                type Rule = (
                    tokens: unknown[],
                    idx: number,
                    options: unknown,
                    env: unknown,
                    self: {
                        renderToken: (
                            tokens: unknown[],
                            idx: number,
                            options: unknown,
                        ) => string;
                    },
                ) => string;
                const rules = md.renderer.rules as unknown as Record<
                    string,
                    Rule | undefined
                >;
                const orig: Rule =
                    rules["em_open"] ||
                    ((tokens, idx, options, _env, self) =>
                        self.renderToken(tokens, idx, options));
                rules["em_open"] = function (tokens, idx, options, _env, self) {
                    (
                        tokens as Array<{
                            attrPush: (attr: [string, string]) => void;
                        }>
                    )[idx]!.attrPush(["data-x", "y"]);
                    return orig(tokens, idx, options, _env, self);
                };
            };
            const html = Str.inlineMarkdown("*hi*", {}, [plugin]);
            expect(html).toContain('<em data-x="y">');
        });

        it("allows unsafe links", () => {
            const html = Str.inlineMarkdown("[click me](javascript:alert(1))", {
                allowUnsafeLinks: true,
            });
            expect(html).toBe('<a href="javascript:alert(1)">click me</a>');
        });

        it("disallows unsafe links by default", () => {
            const html = Str.inlineMarkdown("[click me](javascript:alert(1))");
            expect(html).toBe("[click me](javascript:alert(1))");
        });
    });

    describe("mask", () => {
        it("Laravel tests", () => {
            expect(Str.mask("taylor@email.com", "*", 3)).toBe(
                "tay*************",
            );
            expect(Str.mask("taylor@email.com", "*", 0, 6)).toBe(
                "******@email.com",
            );
            expect(Str.mask("taylor@email.com", "*", -13)).toBe(
                "tay*************",
            );
            expect(Str.mask("taylor@email.com", "*", -13, 3)).toBe(
                "tay***@email.com",
            );

            expect(Str.mask("taylor@email.com", "*", -17)).toBe(
                "****************",
            );
            expect(Str.mask("taylor@email.com", "*", -99, 5)).toBe(
                "*****r@email.com",
            );

            expect(Str.mask("taylor@email.com", "*", 16)).toBe(
                "taylor@email.com",
            );
            expect(Str.mask("taylor@email.com", "*", 16, 99)).toBe(
                "taylor@email.com",
            );

            expect(Str.mask("taylor@email.com", "", 3)).toBe(
                "taylor@email.com",
            );

            expect(Str.mask("taylor@email.com", "something", 3)).toBe(
                "taysssssssssssss",
            );
            expect(Str.mask("taylor@email.com", "something", 3)).toBe(
                "taysssssssssssss",
            );

            expect(Str.mask("这是一段中文", "*", 3)).toBe("这是一***");
            expect(Str.mask("这是一段中文", "*", 0, 2)).toBe("**一段中文");

            expect(Str.mask("maan@email.com", "*", 2, 1)).toBe(
                "ma*n@email.com",
            );
            expect(Str.mask("maan@email.com", "*", 2, 3)).toBe(
                "ma***email.com",
            );
            expect(Str.mask("maan@email.com", "*", 2)).toBe("ma************");

            expect(Str.mask("maria@email.com", "*", 4, 1)).toBe(
                "mari*@email.com",
            );
            expect(Str.mask("tamara@email.com", "*", 5, 1)).toBe(
                "tamar*@email.com",
            );

            expect(Str.mask("maria@email.com", "*", 0, 1)).toBe(
                "*aria@email.com",
            );
            expect(Str.mask("maria@email.com", "*", -1, 1)).toBe(
                "maria@email.co*",
            );
            expect(Str.mask("maria@email.com", "*", -1)).toBe(
                "maria@email.co*",
            );
            expect(Str.mask("maria@email.com", "*", -15)).toBe(
                "***************",
            );
            expect(Str.mask("maria@email.com", "*", 0)).toBe("***************");
        });
    });

    describe("match", () => {
        it("Laravel tests", () => {
            expect(Str.match("/bar/", "foo bar")).toBe("bar");
            expect(Str.match("/foo (.*)/", "foo bar")).toBe("bar");
            expect(Str.match("/foo \\(.\\*)$/", "foo bar")).toBe("");
            expect(Str.match("/nothing/", "foo bar")).toBe("");
            expect(Str.match("/pattern/", "")).toBe("");

            // Test with escaped slashes in pattern (covers backslash counting loop)
            expect(Str.match("/\\/foo\\//", "/foo/")).toBe("/foo/");
            expect(Str.match("/foo\\\\/", "foo\\")).toBe("foo\\");

            // Test with flags in pattern (covers flag parsing branch)
            expect(Str.match("/BAR/i", "foo bar")).toBe("bar");
            expect(Str.match("/bar/im", "foo\nbar")).toBe("bar");
            expect(Str.match("/bar/imu", "foo bar")).toBe("bar");

            // Test invalid regex pattern (covers catch block)
            expect(Str.match("/[invalid/", "foo bar")).toBe("");
        });

        it("match with odd backslashes before delimiter", () => {
            // Pattern where the final / has an odd number of backslashes before it
            // e.g. /\\\/ should have the final / escaped (odd backslash count)
            // This tests the backslash counting loop where backslashes % 2 !== 0
            expect(Str.match("/a\\\\/", "a\\")).toBe("a\\");

            // Test pattern that has no valid closing delimiter (only escaped slashes)
            expect(Str.match("/test\\/", "test/")).toBe("");

            // Test pattern with multiple backslashes before slash
            expect(Str.match("/\\\\\\\\/", "\\\\")).toBe("\\\\");
        });

        it("match with no flags after final delimiter", () => {
            // Pattern with empty flags (tests providedFlags empty branch)
            expect(Str.match("/bar/", "foo bar")).toBe("bar");
        });

        it("match with pattern having no valid closing delimiter", () => {
            // Pattern where the only / is at position 0, no closing delimiter found
            expect(Str.match("/a", "a")).toBe("");
        });

        it("match with pattern not starting with /", () => {
            // Pattern that doesn't start with / uses whole pattern as source
            expect(Str.match("test", "test test")).toBe("test");
        });
    });

    describe("isMatch", () => {
        it("Laravel Tests", () => {
            expect(Str.isMatch("/.*,.*!/", "Hello, Laravel!")).toBe(true);
            expect(Str.isMatch("/^.*$(.*)/", "Hello, Laravel!")).toBe(true);
            expect(Str.isMatch("/laravel/i", "Hello, Laravel!")).toBe(true);
            expect(Str.isMatch("/^(.*(.*(.*)))/", "Hello, Laravel!")).toBe(
                true,
            );

            expect(Str.isMatch("/H.o/", "Hello, Laravel!")).toBe(false);
            expect(Str.isMatch("/^laravel!/i", "Hello, Laravel!")).toBe(false);
            expect(Str.isMatch("/laravel!(.*)/", "Hello, Laravel!")).toBe(
                false,
            );
            expect(Str.isMatch("/^[a-zA-Z,!]+$/", "Hello, Laravel!")).toBe(
                false,
            );

            expect(Str.isMatch(["/.*,.*!/", "/H.o/"], "Hello, Laravel!")).toBe(
                true,
            );
            expect(
                Str.isMatch(["/^laravel!/i", "/^.*$(.*)/"], "Hello, Laravel!"),
            ).toBe(true);
            expect(
                Str.isMatch(
                    ["/laravel/i", "/laravel!(.*)/"],
                    "Hello, Laravel!",
                ),
            ).toBe(true);
            expect(
                Str.isMatch(
                    ["/^[a-zA-Z,!]+$/", "/^(.*(.*(.*)))/"],
                    "Hello, Laravel!",
                ),
            ).toBe(true);

            // Test with escaped slashes in pattern (covers backslash counting loop)
            expect(Str.isMatch("/\\/foo\\//", "/foo/")).toBe(true);
            expect(Str.isMatch("/foo\\\\/", "foo\\")).toBe(true);

            // Test with flags in pattern (covers flag parsing branch)
            expect(Str.isMatch("/BAR/i", "foo bar")).toBe(true);
            expect(Str.isMatch("/bar/im", "foo\nbar")).toBe(true);

            // Test invalid regex pattern (covers catch block)
            expect(Str.isMatch("/[invalid/", "foo bar")).toBe(false);

            // Test empty/null patterns in array
            expect(Str.isMatch(["", "/bar/"], "foo bar")).toBe(true);
        });

        it("isMatch with odd backslashes before delimiter", () => {
            // Pattern where the final / has an odd number of backslashes before it
            // e.g. /\\\/ should have the final / escaped (odd backslash count)
            // This tests the backslash counting loop where backslashes % 2 !== 0
            expect(Str.isMatch("/a\\\\/", "a\\")).toBe(true);

            // Test pattern that has no valid closing delimiter (only escaped slashes)
            expect(Str.isMatch("/test\\/", "test/")).toBe(false);

            // Test pattern with multiple backslashes before slash
            expect(Str.isMatch("/\\\\\\\\/", "\\\\")).toBe(true);
        });

        it("match/isMatch/matchAll with no flags after final delimiter", () => {
            // Pattern with empty flags (tests providedFlags empty branch)
            expect(Str.isMatch("/bar/", "foo bar")).toBe(true);
        });

        it("isMatch with patterns having no valid unescaped delimiter", () => {
            // Pattern where all slashes are escaped - falls through without finding lastSlash
            expect(Str.isMatch("/\\/", "/")).toBe(false);
            // Pattern starting with / but too short to have closing delimiter
            expect(Str.isMatch("/a", "a")).toBe(false);
        });

        it("isMatch with pattern not starting with /", () => {
            // Pattern that doesn't start with / uses whole pattern as source
            expect(Str.isMatch("test", "test")).toBe(true);
            expect(Str.isMatch("bar", "foo")).toBe(false);
        });

        it("isMatch with flags in pattern", () => {
            // Pattern with 's' flag (dotall)
            expect(Str.isMatch("/a.b/s", "a\nb")).toBe(true);
        });

        it("isMatch with regex string that has flags but empty providedFlags after slash", () => {
            // Pattern like /pattern/ with no flags after trailing slash
            expect(Str.isMatch("/test/", "test")).toBe(true);
        });

        it("isMatch with pattern /test/ (lastSlash at position 5)", () => {
            // Pattern /test/ has lastSlash > 0, tests flag parsing branch
            expect(Str.isMatch("/test/", "test")).toBe(true);
        });

        it("isMatch with /pattern/ no flags after trailing slash", () => {
            // Pattern like /test/ - providedFlags is empty string
            expect(Str.isMatch("/hello/", "hello")).toBe(true);
        });

        it("isMatch with pattern having trailing slash and no flags", () => {
            // Explicitly test empty providedFlags branch
            expect(Str.isMatch("/test/", "test")).toBe(true);
            expect(Str.isMatch("/test/", "TEST")).toBe(false); // case sensitive
        });

        it("isMatch with pattern having invalid flag characters", () => {
            // Pattern with invalid flag character 'x' - should be ignored
            expect(Str.isMatch("/test/ix", "test")).toBe(true);
            expect(Str.isMatch("/test/x", "TEST")).toBe(false); // no 'i' flag
        });
    });

    describe("matchAll", () => {
        it("matchAll", () => {
            expect(Str.matchAll("/bar/", "bar foo bar")).toEqual([
                "bar",
                "bar",
            ]);
            expect(Str.matchAll("/f(\\w*)/", "bar fun bar fly")).toEqual([
                "un",
                "ly",
            ]);
            expect(Str.matchAll("/nothing/", "bar fun bar fly")).toEqual([]);
            expect(Str.matchAll("/pattern/", "")).toEqual([]);
            // invalid pattern returns empty
            expect(Str.matchAll("*invalid", "text")).toEqual([]);
            // zero-width match safety
            expect(Str.matchAll("/^/m", "a\nb").length).toBeGreaterThan(0);

            // Test with escaped slashes in pattern (covers backslash counting loop)
            expect(Str.matchAll("/\\//", "/foo/")).toEqual(["/", "/"]);

            // Test with flags in pattern (covers flag parsing branch)
            expect(Str.matchAll("/BAR/i", "bar BAR")).toEqual(["bar", "BAR"]);
            expect(Str.matchAll("/^line/im", "line1\nline2")).toEqual([
                "line",
                "line",
            ]);

            // Test pattern with backslash before closing delimiter (tests backslash counting)
            expect(Str.matchAll("/a\\\\/", "a\\b")).toEqual(["a\\"]);

            // Test pattern with consecutive backslashes
            expect(Str.matchAll("/\\\\\\\\/", "a\\\\b")).toEqual(["\\\\"]);
        });

        it("matchAll with odd backslashes before delimiter", () => {
            // Pattern where the final / has an odd number of backslashes before it
            // e.g. /\\\/ should have the final / escaped (odd backslash count)
            // This tests the backslash counting loop where backslashes % 2 !== 0
            expect(Str.matchAll("/a\\\\/", "a\\a\\")).toEqual(["a\\", "a\\"]);
        });

        it("matchAll with no flags after final delimiter", () => {
            // Pattern with empty flags (tests providedFlags empty branch)
            expect(Str.matchAll("/bar/", "foo bar bar")).toEqual([
                "bar",
                "bar",
            ]);
        });

        it("matchAll with edge cases in regex parsing", () => {
            // Test with pattern that has no valid lastSlash (all slashes escaped)
            expect(Str.matchAll("/\\/", "/")).toEqual([]);
            // Test with pattern where lastSlash <= 0
            expect(Str.matchAll("/", "test")).toEqual([]);
        });

        it("matchAll with pattern not starting with /", () => {
            // Pattern that doesn't start with / uses whole pattern as source
            expect(Str.matchAll("test", "test test")).toEqual(["test", "test"]);
        });

        it("matchAll with flags already present", () => {
            // Pattern with flags that include 'u' (already in default)
            expect(Str.matchAll("/\\w/u", "abc")).toEqual(["a", "b", "c"]);
            // Pattern with all supported flags
            expect(Str.matchAll("/a/imsuy", "A")).toEqual(["A"]);
        });

        it("matchAll with regex string that has flags but empty providedFlags after slash", () => {
            // Pattern like /pattern/ with no flags after trailing slash
            expect(Str.matchAll("/test/", "test test")).toEqual([
                "test",
                "test",
            ]);
        });

        it("matchAll with pattern /abc/ (empty flags)", () => {
            // Pattern /abc/ with no flags after slash
            expect(Str.matchAll("/abc/", "abc abc")).toEqual(["abc", "abc"]);
        });

        it("matchAll with pattern having invalid flag characters", () => {
            // Pattern with invalid flag character - should be ignored
            expect(Str.matchAll("/test/gx", "test test")).toEqual([
                "test",
                "test",
            ]);
        });

        it("matchAll with /pattern/ no flags after trailing slash", () => {
            // Pattern like /test/ - providedFlags is empty string
            expect(Str.matchAll("/hello/", "hello hello")).toEqual([
                "hello",
                "hello",
            ]);
        });

        it("matchAll with pattern having trailing slash and no flags", () => {
            // Explicitly test empty providedFlags branch
            expect(Str.matchAll("/test/", "test test")).toEqual([
                "test",
                "test",
            ]);
        });

        it("matchAll with pattern already having g flag", () => {
            // Pattern with 'g' flag already - tests !flags.includes("g") false branch
            expect(Str.matchAll("/test/g", "test test")).toEqual([
                "test",
                "test",
            ]);
        });
    });

    describe("numbers", () => {
        it("Laravel tests", () => {
            expect(Str.numbers("(555) 123-4567")).toBe("5551234567");
            expect(Str.numbers("L4r4v3l!")).toBe("443");
            expect(Str.numbers("Laravel!")).toBe("");

            const arrayValue = ["(555) 123-4567", "L4r4v3l", "Laravel!"];
            const arrayExpected = ["5551234567", "443", ""];
            expect(Str.numbers(arrayValue)).toEqual(arrayExpected);
        });
    });

    describe("padBoth", () => {
        it("Laravel tests", () => {
            expect(Str.padBoth("Al", 10, "")).toBe("Al");
            expect(Str.padBoth("Alien", 10, "_")).toBe("__Alien___");
            expect(Str.padBoth("Alien", 10)).toBe("  Alien   ");
            expect(Str.padBoth("❤MultiByte☆", 16)).toBe("  ❤MultiByte☆   ");
            expect(Str.padBoth("❤MultiByte☆", 16, "❤☆")).toBe(
                "❤☆❤MultiByte☆❤☆❤",
            );
        });

        it("makePad with empty string", () => {
            // Test makePad when padStr length > needed (slice should truncate)
            expect(Str.padBoth("X", 7, "abc")).toBe("abcXabc");
        });

        it("makePad with needed <= 0", () => {
            // Test makePad when needed is 0 or negative
            expect(Str.padBoth("hello", 5)).toBe("hello");
        });
    });

    describe("padLeft", () => {
        it("Laravel Tests", () => {
            expect(Str.padLeft("Al", 2, "")).toBe("Al");
            expect(Str.padLeft("Al", 10, "")).toBe("Al");
            expect(Str.padLeft("Alien", 10, "-=")).toBe("-=-=-Alien");
            expect(Str.padLeft("Alien", 10)).toBe("     Alien");
            expect(Str.padLeft("❤MultiByte☆", 16)).toBe("     ❤MultiByte☆");
            expect(Str.padLeft("❤MultiByte☆", 16, "❤☆")).toBe(
                "❤☆❤☆❤❤MultiByte☆",
            );
        });

        it("makePad with empty string", () => {
            // Test makePad when padStr length > needed (slice should truncate)
            expect(Str.padLeft("X", 5, "abc")).toBe("abcaX");
        });

        it("makePad with needed <= 0", () => {
            // Test makePad when needed is 0 or negative
            expect(Str.padLeft("hello", 3)).toBe("hello");
        });
    });

    describe("padRight", () => {
        it("Laravel tests", () => {
            expect(Str.padRight("Al", 2, "")).toBe("Al");
            expect(Str.padRight("Al", 10, "")).toBe("Al");
            expect(Str.padRight("Alien", 10, "-=")).toBe("Alien-=-=-");
            expect(Str.padRight("Alien", 10)).toBe("Alien     ");
            expect(Str.padRight("❤MultiByte☆", 16)).toBe("❤MultiByte☆     ");
            expect(Str.padRight("❤MultiByte☆", 16, "❤☆")).toBe(
                "❤MultiByte☆❤☆❤☆❤",
            );

            // Test when length equals or is less than value length
            expect(Str.padRight("Alien", 5)).toBe("Alien");
            expect(Str.padRight("Alien", 3)).toBe("Alien");
        });

        it("makePad with empty string", () => {
            // Test makePad when padStr length > needed (slice should truncate)
            expect(Str.padRight("X", 5, "abc")).toBe("Xabca");
        });

        it("makePad with needed <= 0", () => {
            // Test makePad when needed is 0 or negative
            expect(Str.padRight("hello", 3)).toBe("hello");
        });
    });

    describe("plural", () => {
        it("Laravel tests", () => {
            expect(Str.plural("child")).toBe("children");
            expect(Str.plural("Laracon", 1)).toBe("Laracon");
            expect(Str.plural("Laracon", 3)).toBe("Laracons");
            expect(Str.plural("Laracon", 1000, true)).toBe("1,000 Laracons");
        });
    });

    describe("pluralStudly", () => {
        it("Laravel tests", () => {
            expect(Str.pluralStudly("These are my child", 5)).toBe(
                "These are my children",
            );
            expect(Str.pluralStudly("This is my Laracon", 1)).toBe(
                "This is my Laracon",
            );
            expect(Str.pluralStudly("This is my Laracon", 3)).toBe(
                "This is my Laracons",
            );
        });
    });

    describe("pluralPascal", () => {
        it("Laravel tests", () => {
            expect(Str.pluralPascal("These are my child", 5)).toBe(
                "These are my children",
            );
            expect(Str.pluralPascal("This is my Laracon", 1)).toBe(
                "This is my Laracon",
            );
            expect(Str.pluralPascal("This is my Laracon", 3)).toBe(
                "This is my Laracons",
            );
        });
    });

    describe("password", () => {
        it("test password", () => {
            expect(Str.password().length).toBe(32);

            expect(Str.password().includes(" ")).toBe(false);
            expect(Str.password(32, true, true, true, true).includes(" ")).toBe(
                true,
            );

            expect(
                Str.of(Str.password()).contains([
                    "0",
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                ]),
            ).toBe(true);

            expect(Str.password(32, false, false, false, false)).toBe("");
        });
    });

    describe("position", () => {
        it("Laravel tests", () => {
            expect(Str.position("Hello, World!", "")).toBe(false);
            expect(Str.position("Hello, World!", "W")).toBe(7);
            expect(Str.position("Hello, World!", "world!", 0)).toBe(false);
            expect(Str.position("This is a test string.", "test")).toBe(10);
            expect(
                Str.position("This is a test string, test again.", "test", 15),
            ).toBe(23);
            expect(Str.position("Hello, World!", "Hello")).toBe(0);
            expect(Str.position("Hello, World!", "World!")).toBe(7);
            expect(Str.position("This is a tEsT string.", "tEsT", 0)).toBe(10);
            expect(Str.position("Hello, World!", "W", -6)).toBe(7);
            expect(
                Str.position("Äpfel, Birnen und Kirschen", "Kirschen", -10),
            ).toBe(18);
            expect(Str.position('@%€/=!"][$', "$", 0)).toBe(9);
            expect(Str.position("Hello, World!", "w", 0)).toBe(false);
            expect(Str.position("Hello, World!", "X", 0)).toBe(false);
            expect(Str.position("", "test")).toBe(false);
        });

        it("position with offset beyond haystack length", () => {
            // Test position when start >= haystack length
            expect(Str.position("hello", "l", 10)).toBe(false);
            expect(Str.position("hello", "l", 100)).toBe(false);
            // Test position with negative offset
            expect(Str.position("hello", "l", -2)).toBe(3);
        });

        it("position with various offsets", () => {
            // Test position with start < 0 after calculation
            expect(Str.position("hello", "l", -10)).toBe(2);
            // Test position with start >= haystack.length
            expect(Str.position("hello", "l", 5)).toBe(false);
        });
    });

    describe("random", () => {
        it("Laravel tests", () => {
            expect(Str.random()).toHaveLength(16);
            expect(Str.random(32)).toHaveLength(32);

            const randomInteger = Str.randomInt(1, 100);
            expect(Str.random(randomInteger)).toHaveLength(randomInteger);
            expect(Str.random()).toEqual(expect.any(String));
        });
    });

    describe("createRandomStringsUsing", () => {
        it("Laravel tests", () => {
            Str.createRandomStringsUsing((length) => "x".repeat(length));
            expect(Str.random()).toBe("xxxxxxxxxxxxxxxx");
            expect(Str.random(32)).toBe("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        });
    });

    describe("createRandomStringsUsingSequence", () => {
        it("createRandomStringsUsingSequence specifies a sequence of random strings to utilize", () => {
            Str.createRandomStringsUsingSequence(["x", "y", "z", "987true"]);

            expect(Str.random()).toBe("x");
            expect(Str.random()).toBe("y");
            expect(Str.random()).toBe("z");
            expect(Str.random()).toBe("987true");
            expect(Str.random()).toHaveLength(16);
            expect(Str.random()).toHaveLength(16);

            Str.createRandomStringsNormally();
        });

        it("createRandomStringsUsingSequence specify a fallback for random string sequence", () => {
            Str.createRandomStringsUsingSequence(
                [Str.random(), Str.random()],
                () => {
                    throw new Error("Out of random strings.");
                },
            );

            Str.random();
            Str.random();

            expect(() => {
                Str.random();
            }).toThrowError("Out of random strings.");
        });
    });

    describe("repeat", () => {
        it("Laravel tests", () => {
            expect(Str.repeat("Hello", 0)).toBe("");
            expect(Str.repeat("Hello", 1)).toBe("Hello");
            expect(Str.repeat("Hello", 2)).toBe("HelloHello");
            expect(Str.repeat("a", 5)).toBe("aaaaa");
            expect(Str.repeat("", 5)).toBe("");
        });
    });

    describe("replaceArray", () => {
        it("Laravel tests", () => {
            expect(Str.replaceArray("?", ["foo", "bar", "baz"], "?/?/?")).toBe(
                "foo/bar/baz",
            );
            expect(
                Str.replaceArray("?", ["foo", "bar", "baz"], "?/?/?/?"),
            ).toBe("foo/bar/baz/?");
            expect(Str.replaceArray("?", ["foo", "bar", "baz"], "?/?")).toBe(
                "foo/bar",
            );
            expect(Str.replaceArray("x", ["foo", "bar", "baz"], "?/?/?")).toBe(
                "?/?/?",
            );
            // Ensure recursive replacements are avoided
            expect(Str.replaceArray("?", ["foo?", "bar", "baz"], "?/?/?")).toBe(
                "foo?/bar/baz",
            );
            // Test for associative array support
            expect(Str.replaceArray("?", ["foo", "bar"], "?/?")).toBe(
                "foo/bar",
            );
            expect(Str.replaceArray("?", { x: "foo", y: "bar" }, "?/?")).toBe(
                "foo/bar",
            );
        });

        it("replaceArray with object replace parameter", () => {
            // Test replaceArray with object (Record<string, string>)
            expect(Str.replaceArray("?", { a: "foo", b: "bar" }, "?/?")).toBe(
                "foo/bar",
            );
            // Test replaceArray with different object structure
            expect(
                Str.replaceArray(
                    "?",
                    { first: "x", second: "y", third: "z" },
                    "?/?/?",
                ),
            ).toBe("x/y/z");
        });

        it("replaceArray with array that has been consumed", () => {
            // More placeholders than replacements - uses original search string
            expect(Str.replaceArray("?", ["a"], "?/?/?")).toBe("a/?/?");
        });

        it("replaceArray when replace is an object (values used)", () => {
            // Object values are used as replacements
            expect(Str.replaceArray("?", { a: "X", b: "Y" }, "?/?")).toBe(
                "X/Y",
            );
        });

        it("replaceArray with object (values used)", () => {
            // Object values are used as replacements
            expect(Str.replaceArray("?", { a: "X", b: "Y" }, "?/?")).toBe(
                "X/Y",
            );
        });

        it("replaceArray with array replacements", () => {
            // Array replacement - tests isArray(replace) true branch
            expect(Str.replaceArray("?", ["X", "Y"], "?/?")).toBe("X/Y");
        });

        it("replaceArray with string as iterable", () => {
            // String is iterable (each char is an element)
            // This hits the Array.from(replace) branch
            expect(
                Str.replaceArray(
                    "?",
                    "XY" as unknown as Iterable<string>,
                    "?/?",
                ),
            ).toBe("X/Y");
        });
    });

    describe("toStringOr", () => {
        it("Laravel tests", () => {
            expect(Str.toStringOr("test", "fallback")).toBe("test");
            expect(Str.toStringOr(123, "fallback")).toBe("123");
            expect(Str.toStringOr(Array.from([]), "fallback")).toBe("fallback");
        });
    });

    describe("replace", () => {
        it("Laravel tests", () => {
            expect(Str.replace("baz", "laravel", "foo bar baz")).toBe(
                "foo bar laravel",
            );
            expect(Str.replace("baz", "laravel", "foo bar Baz", false)).toBe(
                "foo bar Baz",
            );
            expect(Str.replace("?", "8.x", "foo bar baz ?")).toBe(
                "foo bar baz 8.x",
            );
            expect(Str.replace("x", "8.x", "foo bar baz X", false)).toBe(
                "foo bar baz X",
            );
            expect(Str.replace(" ", "/", "foo bar baz")).toBe("foo/bar/baz");
            expect(
                Str.replace(
                    ["?1", "?2", "?3"],
                    ["foo", "bar", "baz"],
                    "?1 ?2 ?3",
                ),
            ).toBe("foo bar baz");
            expect(
                Str.replace("baz", "laravel", ["baz", "foo", "Baz"]),
            ).toStrictEqual(["laravel", "foo", "laravel"]);
            expect(
                Str.replace("baz", "laravel", ["baz", "foo", "Baz"], false),
            ).toStrictEqual(["laravel", "foo", "Baz"]);
        });

        it("replace with case sensitivity parameter", () => {
            // Test with caseSensitive=false (case-sensitive replacement)
            expect(Str.replace("bar", "X", "foo bar BAR", false)).toBe(
                "foo X BAR",
            );
            // Test with caseSensitive=true (case-insensitive, default)
            expect(Str.replace("bar", "X", "foo bar BAR", true)).toBe(
                "foo X X",
            );
            // Test with empty search string
            expect(Str.replace("", "X", "foo bar")).toBe("foo bar");
        });

        it("replace when replace is an iterable (array-like)", () => {
            // Iterable replacements
            expect(Str.replace("a", ["X", "Y"], "a b a")).toBe("X b X");
        });

        it("replace with array search and array replace", () => {
            // Arrays for both search and replace
            expect(Str.replace(["a", "b"], ["X", "Y"], "a b c")).toBe("X Y c");
        });

        it("replace with more searches than replacements", () => {
            // More searches than replacements - tests replacements[i] ?? "" fallback
            // "a" → "X", "b" → "", "c" → "" (fallback to empty string)
            expect(Str.replace(["a", "b", "c"], ["X"], "abc")).toBe("X");
        });

        it("replace case-sensitive with array subject", () => {
            // Array subject with caseSensitive = false (default)
            expect(Str.replace("a", "X", ["aaa", "bbb"])).toEqual([
                "XXX",
                "bbb",
            ]);
        });
    });

    describe("replaceFirst", () => {
        it("Laravel tests", () => {
            expect(Str.replaceFirst("bar", "qux", "foobar foobar")).toBe(
                "fooqux foobar",
            );
            expect(Str.replaceFirst("bar?", "qux?", "foo/bar? foo/bar?")).toBe(
                "foo/qux? foo/bar?",
            );
            expect(Str.replaceFirst("bar", "", "foobar foobar")).toBe(
                "foo foobar",
            );
            expect(Str.replaceFirst("xxx", "yyy", "foobar foobar")).toBe(
                "foobar foobar",
            );
            expect(Str.replaceFirst("", "yyy", "foobar foobar")).toBe(
                "foobar foobar",
            );
            expect(Str.replaceFirst(0, "1", "0")).toBe("1");
            // Test for multibyte string support
            expect(Str.replaceFirst("ö", "xxx", "Jönköping Malmö")).toBe(
                "Jxxxnköping Malmö",
            );
            expect(Str.replaceFirst("", "yyy", "Jönköping Malmö")).toBe(
                "Jönköping Malmö",
            );
        });
    });

    describe("replaceStart", () => {
        it("Laravel tests", () => {
            expect(Str.replaceStart("bar", "qux", "foobar foobar")).toBe(
                "foobar foobar",
            );
            expect(Str.replaceStart("bar?", "qux?", "foo/bar? foo/bar?")).toBe(
                "foo/bar? foo/bar?",
            );

            expect(Str.replaceStart("foo", "qux", "foobar foobar")).toBe(
                "quxbar foobar",
            );
            expect(
                Str.replaceStart("foo/bar?", "qux?", "foo/bar? foo/bar?"),
            ).toBe("qux? foo/bar?");
            expect(Str.replaceStart("foo", "", "foobar foobar")).toBe(
                "bar foobar",
            );
            expect(Str.replaceStart(0, "1", "0")).toBe("1");
            // Test for multibyte string support
            expect(Str.replaceStart("Jö", "xxx", "Jönköping Malmö")).toBe(
                "xxxnköping Malmö",
            );
            expect(Str.replaceStart("", "yyy", "Jönköping Malmö")).toBe(
                "Jönköping Malmö",
            );
        });
    });

    describe("replaceLast", () => {
        it("Laravel tests", () => {
            expect(Str.replaceLast("bar", "qux", "foobar foobar")).toBe(
                "foobar fooqux",
            );
            expect(Str.replaceLast("bar?", "qux?", "foo/bar? foo/bar?")).toBe(
                "foo/bar? foo/qux?",
            );
            expect(Str.replaceLast("bar", "", "foobar foobar")).toBe(
                "foobar foo",
            );
            expect(Str.replaceLast("xxx", "yyy", "foobar foobar")).toBe(
                "foobar foobar",
            );
            expect(Str.replaceLast("", "yyy", "foobar foobar")).toBe(
                "foobar foobar",
            );
            // Test for multibyte string support
            expect(Str.replaceLast("ö", "xxx", "Malmö Jönköping")).toBe(
                "Malmö Jönkxxxping",
            );
            expect(Str.replaceLast("", "yyy", "Malmö Jönköping")).toBe(
                "Malmö Jönköping",
            );
        });
    });

    describe("startsWith", () => {
        it("Laravel tests", () => {
            expect(Str.startsWith("jason", "jas")).toBe(true);
            expect(Str.startsWith("jason", "jason")).toBe(true);
            expect(Str.startsWith("jason", ["jas"])).toBe(true);
            expect(Str.startsWith("jason", ["day", "jas"])).toBe(true);
            // expect(Str.startsWith("jason", collect(["day", "jas"]))).toBe(true); // todo
            expect(Str.startsWith("jason", "day")).toBe(false);
            expect(Str.startsWith("jason", ["day"])).toBe(false);
            expect(Str.startsWith("jason", null)).toBe(false);
            expect(Str.startsWith("jason", [null])).toBe(false);
            expect(Str.startsWith("0123", [null])).toBe(false);
            expect(Str.startsWith("0123", 0)).toBe(true);
            expect(Str.startsWith("jason", "J")).toBe(false);
            expect(Str.startsWith("jason", "")).toBe(false);
            expect(Str.startsWith("", "")).toBe(false);
            expect(Str.startsWith("7", " 7")).toBe(false);
            expect(Str.startsWith("7a", "7")).toBe(true);
            expect(Str.startsWith("7a", 7)).toBe(true);
            expect(Str.startsWith("7.12a", 7.12)).toBe(true);
            expect(Str.startsWith("7.12a", 7.13)).toBe(false);
            expect(Str.startsWith(7.123, "7")).toBe(true);
            expect(Str.startsWith(7.123, "7.12")).toBe(true);
            expect(Str.startsWith(7.123, "7.13")).toBe(false);
            expect(Str.startsWith(null, "Marc")).toBe(false);
            // Test for multibyte string support
            expect(Str.startsWith("Jönköping", "Jö")).toBe(true);
            expect(Str.startsWith("Malmö", "Malmö")).toBe(true);
            expect(Str.startsWith("Jönköping", "Jonko")).toBe(false);
            expect(Str.startsWith("Malmö", "Malmo")).toBe(false);
            expect(Str.startsWith("你好", "你")).toBe(true);
            expect(Str.startsWith("你好", "好")).toBe(false);
            expect(Str.startsWith("你好", "a")).toBe(false);
        });

        it("startsWith with iterable needles", () => {
            // Test startsWith with Set (iterable)
            expect(Str.startsWith("hello world", new Set(["hello"]))).toBe(
                true,
            );
            expect(Str.startsWith("hello world", new Set(["world"]))).toBe(
                false,
            );
            // Test startsWith with null in iterable
            expect(
                Str.startsWith(
                    "hello world",
                    new Set(["hello", null as unknown as string]),
                ),
            ).toBe(true);
        });

        it("startsWith with number needle", () => {
            // Test startsWith with number needle
            expect(Str.startsWith("123abc", 123)).toBe(true);
            expect(Str.startsWith("123abc", 456)).toBe(false);
        });

        it("startsWith with Set iterable", () => {
            // Test Symbol.iterator path with Set
            expect(Str.startsWith("hello", new Set(["he", "wo"]))).toBe(true);
            expect(Str.startsWith("hello", new Set(["wo", "xy"]))).toBe(false);
        });

        it("startsWith with plain object that has Symbol.iterator", () => {
            // Test the iterable path with a custom object
            const iterable = {
                *[Symbol.iterator]() {
                    yield "he";
                    yield "wo";
                },
            };
            expect(Str.startsWith("hello", iterable)).toBe(true);
        });

        it("startsWith with non-iterable object", () => {
            // Plain object that's not iterable - hits else branch
            // Object.toString() returns "[object Object]" by default
            // @ts-expect-error - Testing defensive behavior with invalid input type
            expect(Str.startsWith("hello", {})).toBe(false);
            // Object with custom toString that matches
            // @ts-expect-error - Testing defensive behavior with invalid input type
            expect(Str.startsWith("hello", { toString: () => "he" })).toBe(
                true,
            );
        });
    });

    describe("replaceEnd", () => {
        it("Laravel tests", () => {
            expect(Str.replaceEnd("bar", "qux", "foobar foobar")).toBe(
                "foobar fooqux",
            );
            expect(Str.replaceEnd("bar?", "qux?", "foo/bar? foo/bar?")).toBe(
                "foo/bar? foo/qux?",
            );
            expect(Str.replaceEnd("bar", "", "foobar foobar")).toBe(
                "foobar foo",
            );
            expect(Str.replaceEnd("xxx", "yyy", "foobar foobar")).toBe(
                "foobar foobar",
            );
            expect(Str.replaceEnd("", "yyy", "foobar foobar")).toBe(
                "foobar foobar",
            );
            expect(Str.replaceEnd("xxx", "yyy", "fooxxx foobar")).toBe(
                "fooxxx foobar",
            );
            // Test for multibyte string support
            expect(Str.replaceEnd("ö", "xxx", "Malmö Jönköping")).toBe(
                "Malmö Jönköping",
            );
            expect(Str.replaceEnd("öping", "yyy", "Malmö Jönköping")).toBe(
                "Malmö Jönkyyy",
            );
        });
    });

    describe("replaceMatches", () => {
        it("Laravel tests", () => {
            let result;

            // Test basic string replacement
            expect(Str.replaceMatches("/baz/", "bar", "foo baz bar")).toBe(
                "foo bar bar",
            );
            expect(Str.replaceMatches("/404/", "found", "foo baz baz")).toBe(
                "foo baz baz",
            );

            // Test with array of patterns
            expect(
                Str.replaceMatches(
                    ["/bar/", "/baz/"],
                    ["XXX", "YYY"],
                    "foo bar baz",
                ),
            ).toBe("foo XXX YYY");

            // Test with callback
            result = Str.replaceMatches(
                "/ba(.)/",
                (match) => "ba" + match[1]!.toUpperCase(),
                "foo baz bar",
            );
            expect(result).toBe("foo baZ baR");

            result = Str.replaceMatches(
                /(\d+)/g,
                (match) => (parseInt(match[1]!) * 2).toString(),
                "foo 123 bar 456",
            );
            expect(result).toBe("foo 246 bar 912");

            // Test with limit parameter
            expect(
                Str.replaceMatches("/ba(.)/", "ba$1", "foo baz baz", 1),
            ).toBe("foo baZ baz");

            result = Str.replaceMatches(
                "/ba(.)/",
                (match) => "ba" + match[1]!.toUpperCase(),
                "foo baz baz bar",
                1,
            );
            expect(result).toBe("foo baZ baz bar");

            // Test with array subject
            expect(
                Str.replaceMatches("/bar/", "XXX", ["foo bar", "bar baz"]),
            ).toEqual(["foo XXX", "XXX baz"]);

            // Test with string replacement with limit
            expect(
                Str.replaceMatches("/ba(.)/", "ba$1", "baz bar bam", 2),
            ).toBe("baZ baR bam");

            // Test with string replacement with limit=-1 (unlimited, covers hasGroupsMeta branch)
            expect(
                Str.replaceMatches("/ba(.)/", "ba$1", "baz bar bam", -1),
            ).toBe("baZ baR baM");

            // Test with escaped slashes in regex pattern (covers backslash counting branch)
            expect(Str.replaceMatches("/\\//", "-", "a/b/c")).toBe("a-b-c");

            // Test with pattern having escaped backslash (tests backslash counting loop)
            expect(Str.replaceMatches("/\\\\/", "-", "a\\b\\c")).toBe("a-b-c");

            // Test with invalid regex (covers error handling)
            expect(Str.replaceMatches("/[invalid/", "x", "foo bar")).toBe(null);

            // Test with RegExp pattern directly
            expect(Str.replaceMatches(/foo/, "bar", "foo baz")).toBe("bar baz");

            // Test with flags in pattern string (covers flag parsing branch)
            expect(Str.replaceMatches("/BAR/i", "XXX", "foo bar baz")).toBe(
                "foo XXX baz",
            );
        });

        it("replaceMatches with complex regex patterns", () => {
            // Test with RegExp having flags
            expect(Str.replaceMatches(/BAR/gi, "X", "bar BAR Bar")).toBe(
                "X X X",
            );

            // Test with pattern that has backslash before final /
            expect(Str.replaceMatches("/a\\\\/", "X", "a\\b")).toBe("Xb");

            // Test with multiple patterns and single replacement
            expect(
                Str.replaceMatches(["/foo/", "/bar/"], "X", "foo bar baz"),
            ).toBe("X X baz");

            // Test with callback and limit=0
            expect(Str.replaceMatches("/a/", () => "X", "aaa", 0)).toBe("aaa");

            // Test with named capture groups in pattern (hasGroupsMeta branch)
            expect(
                Str.replaceMatches(
                    "/(?<word>\\w+)/",
                    (match) => match[1]!.toUpperCase(),
                    "hello world",
                    1,
                ),
            ).toBe("HELLO world");

            // Test with limit and string replacement with backreferences
            expect(Str.replaceMatches("/(\\w)(\\w)/", "$1-$2", "abcd", 1)).toBe(
                "A-Bcd",
            );

            // Test array subject with callback
            expect(
                Str.replaceMatches("/a/", () => "X", ["aaa", "bbb"]),
            ).toEqual(["XXX", "bbb"]);
        });

        it("replaceMatches with string replacement and limit parameter", () => {
            // Test string replacement with limit (covers the hasGroupsMeta branches in limit path)
            expect(Str.replaceMatches("/\\w/", "X", "abc", 2)).toBe("XXc");
            // Test with limit = -1 (unlimited, different code path)
            expect(Str.replaceMatches("/\\w/", "X", "abc", -1)).toBe("XXX");
            // Test with backreference replacement and no named groups
            expect(Str.replaceMatches("/(\\w)/", "$1", "abc")).toBe("ABC");
        });

        it("replaceMatches with named capture groups", () => {
            // Test with named capture groups (hasGroupsMeta = true)
            expect(Str.replaceMatches("/(?<letter>\\w)/", "$1", "ab", 1)).toBe(
                "Ab",
            );
            // Test with callback and named groups
            expect(
                Str.replaceMatches(
                    "/(?<char>\\w)/",
                    (match) => match[0]!.toUpperCase(),
                    "abc",
                    2,
                ),
            ).toBe("ABc");
        });

        it("replaceMatches with multiple patterns and fallback replacement", () => {
            // When replacementArray[i] is undefined, use first replacement
            expect(
                Str.replaceMatches(["/a/", "/b/", "/c/"], ["X"], "abc"),
            ).toBe("XXX");
        });

        it("replaceMatches with pattern where lastSlash is exactly 1", () => {
            // Pattern like "//" where lastSlash would be 1 (> 0 but source is empty)
            expect(Str.replaceMatches("//", "X", "test")).toBe("test");
        });

        it("replaceMatches with callback and limit 0", () => {
            // Limit 0 means no replacements
            expect(
                Str.replaceMatches(
                    "/a/",
                    (match) => match[0]!.toUpperCase(),
                    "aaa",
                    0,
                ),
            ).toBe("aaa");
        });

        it("replaceMatches with string pattern no delimiter", () => {
            // Pattern that doesn't look like /.../ uses whole string as source
            expect(Str.replaceMatches("test", "X", "test")).toBe("X");
        });

        it("replaceMatches with RegExp without g or u flags", () => {
            // RegExp without global or unicode flags should have them added
            expect(Str.replaceMatches(/test/, "X", "test test")).toBe("X X");
        });

        it("replaceMatches with patterns having lastSlash = 1", () => {
            // Pattern "//" has lastSlash at position 1, which is NOT > 1, so source stays as "//"
            expect(Str.replaceMatches("//i", "X", "//i")).toBe("X");
        });

        it("replaceMatches with pattern that has no lastSlash found", () => {
            // Pattern that starts with / but has no valid closing delimiter
            expect(Str.replaceMatches("/abc", "X", "/abc")).toBe("X");
        });

        it("replaceMatches with multiple capture groups metadata", () => {
            // Pattern with capture groups to test hasGroupsMeta logic
            expect(
                Str.replaceMatches("/([a-z])([a-z])/", "$1-$2", "ab cd"),
            ).toBe("A-B C-D");
        });

        it("replaceMatches with array subject and callback with limit", () => {
            // Array subject with callback function and limit
            expect(
                Str.replaceMatches(
                    "/a/",
                    (match) => match[0]!.toUpperCase(),
                    ["aa", "bb"],
                    1,
                ),
            ).toEqual(["Aa", "bb"]);
        });

        it("replaceMatches with replacement having $0 reference", () => {
            // Backreference $0 should work
            expect(Str.replaceMatches("/(abc)/", "$1!", "abc")).toBe("ABC!");
        });

        it("replaceMatches with regex that has no valid closing slash", () => {
            // Pattern that starts with / but closing / is at position 1
            expect(Str.replaceMatches("/x", "Y", "/x")).toBe("Y");
        });

        it("replaceMatches with function callback returning capture groups", () => {
            // Test callback function with multiple capture groups
            expect(
                Str.replaceMatches(
                    "/([a-z])([0-9])/",
                    (match) => `${match[1]}-${match[2]}`,
                    "a1b2c3",
                ),
            ).toBe("a-1b-2c-3");
        });

        it("replaceMatches with empty replacement array falls back to empty string", () => {
            // Multiple patterns with single empty replacement array
            expect(Str.replaceMatches(["/a/", "/b/"], [], "ab")).toBe("");
        });

        it("replaceMatches with RegExp that already has 'g' flag", () => {
            // RegExp object with g flag already present
            expect(Str.replaceMatches(/abc/g, "X", "abc")).toBe("X");
        });

        it("replaceMatches with RegExp that already has 'u' flag", () => {
            // RegExp object with u flag already present
            expect(Str.replaceMatches(/abc/u, "X", "abc")).toBe("X");
        });

        it("replaceMatches with pattern /x/ where lastSlash = 1 (invalid)", () => {
            // Pattern like /x/ has lastSlash at 2, testing edge case
            expect(Str.replaceMatches("/x/", "Y", "x")).toBe("Y");
        });

        it("replaceMatches pattern that throws error returns null", () => {
            // Invalid regex pattern should return null
            expect(Str.replaceMatches("/[/", "Y", "x")).toBe(null);
        });

        it("replaceMatches with named capture groups", () => {
            // Pattern with named groups triggers hasGroupsMeta = true
            expect(
                Str.replaceMatches(
                    "/(?<first>[a-z])(?<second>[0-9])/",
                    "$1-$2",
                    "a1",
                ),
            ).toBe("A-1");
        });

        it("replaceMatches with no capture groups", () => {
            // Pattern without capture groups, hasGroupsMeta = false
            expect(Str.replaceMatches("/abc/", "XYZ", "abc")).toBe("XYZ");
        });

        it("replaceMatches with callback and named groups", () => {
            // Callback with named capture groups
            expect(
                Str.replaceMatches(
                    "/(?<letter>[a-z])(?<digit>[0-9])/",
                    (match) => `${match[0]}!`,
                    "a1b2",
                ),
            ).toBe("a1!b2!");
        });

        it("replaceMatches with pattern starting with / but lastSlash at 1", () => {
            // Pattern like // - lastSlash = 1, not > 1, so treated as literal pattern
            expect(Str.replaceMatches("//", "X", "a//b")).toBe("aXb");
        });

        it("replaceMatches with string replacement and limit with capture groups", () => {
            // Tests limit branch with string replacement
            expect(Str.replaceMatches("/([a-z])/", "$1!", "abc", 2)).toBe(
                "A!B!c",
            );
        });

        it("replaceMatches unlimited (-1) with capture groups", () => {
            // Unlimited replacement (limit < 0) with capture groups
            expect(Str.replaceMatches("/([a-z])/", "$1!", "abc", -1)).toBe(
                "A!B!C!",
            );
        });

        it("replaceMatches with pattern having invalid flag characters", () => {
            // Pattern with invalid flag characters should be ignored
            expect(Str.replaceMatches("/abc/gxz", "X", "abc")).toBe("X");
        });

        it("replaceMatches with pattern // (lastSlash = 1)", () => {
            // Pattern // has lastSlash at position 1, not > 1
            // So it's treated as literal pattern "//"
            expect(Str.replaceMatches("//", "X", "a//b")).toBe("aXb");
        });

        it("replaceMatches with escaped slash in pattern", () => {
            // Pattern with escaped slash - tests backslashes % 2 !== 0 branch
            // /a\/b/ matches literal "a/b"
            expect(Str.replaceMatches("/a\\/b/", "X", "a/b")).toBe("X");
        });

        it("replaceMatches with only escaped slash (no closing delimiter)", () => {
            // Pattern that ends with escaped slash - no valid closing delimiter found
            // Treated as literal pattern "/a\/" which doesn't match
            expect(Str.replaceMatches("/a\\/", "X", "/a\\/")).toBe("/a\\/");
        });

        it("replaceMatches with no capture groups and limit", () => {
            // No capture groups - tests hasGroupsMeta = false with limit
            expect(Str.replaceMatches("/abc/", "X", "abcabcabc", 1)).toBe(
                "Xabcabc",
            );
        });

        it("replaceMatches with callback and no capture groups", () => {
            // Callback with no capture groups
            expect(
                Str.replaceMatches("/abc/", (m) => m[0]!.toUpperCase(), "abc"),
            ).toBe("ABC");
        });

        it("replaceMatches with callback and limit hit", () => {
            // Callback with limit that prevents further replacements
            expect(
                Str.replaceMatches(
                    "/a/",
                    (m) => m[0]!.toUpperCase(),
                    "aaaa",
                    2,
                ),
            ).toBe("AAaa");
        });

        it("replaceMatches unlimited with no capture groups", () => {
            // limit < 0 and no capture groups - tests hasGroupsMeta false in limit < 0 branch
            expect(Str.replaceMatches("/abc/", "XYZ", "abcabc", -1)).toBe(
                "XYZXYZ",
            );
        });

        it("replaceMatches with limit and no capture groups", () => {
            // limit >= 0 and no capture groups - tests hasGroupsMeta false in limit >= 0 branch
            expect(Str.replaceMatches("/abc/", "XYZ", "abcabc", 1)).toBe(
                "XYZabc",
            );
        });

        it("replaceMatches callback with limit and no named groups", () => {
            // Callback with limit and no named groups - tests hasGroupsMeta false in callback branch
            expect(
                Str.replaceMatches(
                    "/abc/i",
                    (m) => m[0]!.toLowerCase(),
                    "ABCABC",
                    1,
                ),
            ).toBe("abcABC");
        });

        it("replaceMatches with backreference to non-existent group", () => {
            // $9 doesn't exist, should use empty string fallback
            expect(Str.replaceMatches("/([a-z])/", "$1$9", "a", -1)).toBe("A");
        });

        it("replaceMatches with limit and backreference to non-existent group", () => {
            // $9 doesn't exist with limit, should use empty string fallback
            expect(Str.replaceMatches("/([a-z])/", "$1$9", "ab", 1)).toBe("Ab");
        });

        it("replaceMatches with pattern /x/ (lastSlash at 2)", () => {
            // Pattern /x/ - lastSlash is 2, which is > 1, so it extracts the pattern
            expect(Str.replaceMatches("/x/", "Y", "x")).toBe("Y");
        });

        it("replaceMatches with pattern /x/ and no flags after slash", () => {
            // Pattern /abc/ - empty providedFlags (false branch)
            expect(Str.replaceMatches("/abc/", "XYZ", "abc")).toBe("XYZ");
        });
    });

    describe("stripTags", () => {
        it("Laravel tests", () => {
            expect(Str.stripTags('<p data-id="test">foo bar baz</p>')).toBe(
                "foo bar baz",
            );
            expect(
                Str.stripTags('<div id="test">Hello<br/> こんにちは</div>'),
            ).toBe("Hello こんにちは");
        });
    });

    describe("remove", () => {
        it("Laravel tests", () => {
            // Basic removal
            expect(Str.remove("bar", "foo bar baz")).toBe("foo  baz");
            // Multiple needles
            expect(Str.remove(["bar", "baz"], "foo bar baz qux")).toBe(
                "foo   qux",
            );
            // Case insensitive removal
            expect(Str.remove("BAR", "foo bAr BAR baz", false)).toBe(
                "foo   baz",
            );
            // Iterable subject
            expect(Str.remove("a", ["apple", "banana", "pear"])).toEqual([
                "pple",
                "bnn",
                "per",
            ]);
            // Empty needle (should return original)
            expect(Str.remove("", "foo")).toBe("foo");

            expect(Str.remove("o", "Foobar")).toBe("Fbar");
            expect(Str.remove("bar", "Foobar")).toBe("Foo");
            expect(Str.remove("F", "Foobar")).toBe("oobar");
            expect(Str.remove("f", "Foobar")).toBe("Foobar");
            expect(Str.remove("f", "Foobar", false)).toBe("oobar");

            expect(Str.remove(["o", "a"], "Foobar")).toBe("Fbr");
            expect(Str.remove(["f", "b"], "Foobar")).toBe("Fooar");
            expect(Str.remove(["f", "b"], "Foobar", false)).toBe("ooar");
            expect(Str.remove(["f", "|"], "Foo|bar")).toBe("Foobar");
        });
    });

    describe("reverse", () => {
        it("Laravel tests", () => {
            expect(Str.reverse("raBooF")).toBe("FooBar");
            expect(Str.reverse("őtüzsineT")).toBe("Teniszütő");
            expect(Str.reverse("☆etyBitluM❤")).toBe("❤MultiByte☆");
        });
    });

    describe("start", () => {
        it("Laravel tests", () => {
            expect(Str.start("test/string", "/")).toBe("/test/string");
            expect(Str.start("/test/string", "/")).toBe("/test/string");
            expect(Str.start("//test/string", "/")).toBe("/test/string");
        });
    });

    describe("upper", () => {
        it("Laravel tests", () => {
            expect(Str.upper("foo bar baz")).toBe("FOO BAR BAZ");
            expect(Str.upper("foO bAr BaZ")).toBe("FOO BAR BAZ");
        });
    });

    describe("title", () => {
        it("Laravel tests", () => {
            expect(Str.title("jefferson costella")).toBe("Jefferson Costella");
            expect(Str.title("jefFErson coSTella")).toBe("Jefferson Costella");

            expect(Str.title("")).toBe("");
            expect(Str.title("123 laravel")).toBe("123 Laravel");
            expect(Str.title("❤laravel")).toBe("❤Laravel");
            expect(Str.title("laravel ❤")).toBe("Laravel ❤");
            expect(Str.title("laravel123")).toBe("Laravel123");

            const longString = "lorem ipsum " + "dolor sit amet ".repeat(1000);
            const expectedResult =
                "Lorem Ipsum Dolor Sit Amet " + "Dolor Sit Amet ".repeat(999);
            expect(Str.title(longString)).toBe(expectedResult);
        });
    });

    describe("headline", () => {
        it("Laravel tests", () => {
            expect(Str.headline("jefferson costella")).toBe(
                "Jefferson Costella",
            );
            expect(Str.headline("jefFErson coSTella")).toBe(
                "Jefferson Costella",
            );
            expect(Str.headline("jefferson_costella uses-_Laravel")).toBe(
                "Jefferson Costella Uses Laravel",
            );
            expect(Str.headline("jefferson_costella uses__Laravel")).toBe(
                "Jefferson Costella Uses Laravel",
            );

            expect(Str.headline("laravel_p_h_p_framework")).toBe(
                "Laravel P H P Framework",
            );
            expect(Str.headline("laravel _p _h _p _framework")).toBe(
                "Laravel P H P Framework",
            );
            expect(Str.headline("laravel_php_framework")).toBe(
                "Laravel Php Framework",
            );
            expect(Str.headline("laravel-phP-framework")).toBe(
                "Laravel Ph P Framework",
            );
            expect(Str.headline("laravel  -_-  php   -_-   framework   ")).toBe(
                "Laravel Php Framework",
            );

            expect(Str.headline("fooBar")).toBe("Foo Bar");
            expect(Str.headline("foo_bar")).toBe("Foo Bar");
            expect(Str.headline("foo-barBaz")).toBe("Foo Bar Baz");
            expect(Str.headline("foo-bar_baz")).toBe("Foo Bar Baz");

            expect(Str.headline("öffentliche-überraschungen")).toBe(
                "Öffentliche Überraschungen",
            );
            expect(Str.headline("-_öffentliche_überraschungen_-")).toBe(
                "Öffentliche Überraschungen",
            );
            expect(Str.headline("-öffentliche überraschungen")).toBe(
                "Öffentliche Überraschungen",
            );

            expect(Str.headline("sindÖdeUndSo")).toBe("Sind Öde Und So");

            expect(Str.headline("orwell 1984")).toBe("Orwell 1984");
            expect(Str.headline("orwell   1984")).toBe("Orwell 1984");
            expect(Str.headline("-orwell-1984 -")).toBe("Orwell 1984");
            expect(Str.headline(" orwell_- 1984 ")).toBe("Orwell 1984");

            expect(Str.headline("  ")).toBe("");
        });
    });

    describe("apa", () => {
        it("Laravel tests", () => {
            expect(Str.apa("tom and jerry")).toBe("Tom and Jerry");
            expect(Str.apa("TOM AND JERRY")).toBe("Tom and Jerry");
            expect(Str.apa("Tom And Jerry")).toBe("Tom and Jerry");

            expect(Str.apa("back to the future")).toBe("Back to the Future");
            expect(Str.apa("BACK TO THE FUTURE")).toBe("Back to the Future");
            expect(Str.apa("Back To The future")).toBe("Back to the Future");

            expect(Str.apa("this, then that")).toBe("This, Then That");
            expect(Str.apa("THIS, THEN THAT")).toBe("This, Then That");
            expect(Str.apa("This, Then That")).toBe("This, Then That");

            expect(Str.apa("bond. james bond.")).toBe("Bond. James Bond.");
            expect(Str.apa("BOND. JAMES BOND.")).toBe("Bond. James Bond.");
            expect(Str.apa("Bond. James Bond.")).toBe("Bond. James Bond.");

            expect(Str.apa("self-report")).toBe("Self-Report");
            expect(Str.apa("Self-report")).toBe("Self-Report");
            expect(Str.apa("SELF-REPORT")).toBe("Self-Report");

            expect(
                Str.apa("as the world turns, so are the days of our lives"),
            ).toBe("As the World Turns, So Are the Days of Our Lives");
            expect(
                Str.apa("AS THE WORLD TURNS, SO ARE THE DAYS OF OUR LIVES"),
            ).toBe("As the World Turns, So Are the Days of Our Lives");
            expect(
                Str.apa("As The World Turns, So Are The Days Of Our Lives"),
            ).toBe("As the World Turns, So Are the Days of Our Lives");

            expect(Str.apa("TO KILL A MOCKINGBIRD")).toBe(
                "To Kill a Mockingbird",
            );
            expect(Str.apa("To Kill A Mockingbird")).toBe(
                "To Kill a Mockingbird",
            );
            expect(Str.apa("to kill a mockingbird")).toBe(
                "To Kill a Mockingbird",
            );

            expect(Str.apa("Être écrivain commence par être un lecteur.")).toBe(
                "Être Écrivain Commence par Être un Lecteur.",
            );
            expect(Str.apa("Être Écrivain Commence par Être un Lecteur.")).toBe(
                "Être Écrivain Commence par Être un Lecteur.",
            );
            expect(Str.apa("ÊTRE ÉCRIVAIN COMMENCE PAR ÊTRE UN LECTEUR.")).toBe(
                "Être Écrivain Commence par Être un Lecteur.",
            );

            expect(Str.apa("c'est-à-dire.")).toBe("C'est-à-Dire.");
            expect(Str.apa("C'est-à-Dire.")).toBe("C'est-à-Dire.");
            expect(Str.apa("C'EsT-À-DIRE.")).toBe("C'est-à-Dire.");

            expect(
                Str.apa(
                    "устное слово – не воробей. как только он вылетит, его не поймаешь.",
                ),
            ).toBe(
                "Устное Слово – Не Воробей. Как Только Он Вылетит, Его Не Поймаешь.",
            );
            expect(
                Str.apa(
                    "Устное Слово – Не Воробей. Как Только Он Вылетит, Его Не Поймаешь.",
                ),
            ).toBe(
                "Устное Слово – Не Воробей. Как Только Он Вылетит, Его Не Поймаешь.",
            );
            expect(
                Str.apa(
                    "УСТНОЕ СЛОВО – НЕ ВОРОБЕЙ. КАК ТОЛЬКО ОН ВЫЛЕТИТ, ЕГО НЕ ПОЙМАЕШЬ.",
                ),
            ).toBe(
                "Устное Слово – Не Воробей. Как Только Он Вылетит, Его Не Поймаешь.",
            );

            expect(Str.apa("")).toBe("");
            expect(Str.apa("   ")).toBe("   ");
        });

        it("apa with hyphenated words", () => {
            // Test APA with hyphenated words containing minor words
            expect(Str.apa("state-of-the-art")).toBe("State-of-the-Art");
            expect(Str.apa("one-by-one")).toBe("One-by-One");
            // Test APA with hyphenated words all minor but long
            expect(Str.apa("test-this-word")).toBe("Test-This-Word");
        });

        it("apa with minor word at sentence start", () => {
            // Minor word at start of sentence should be capitalized
            expect(Str.apa("the quick brown fox")).toBe("The Quick Brown Fox");
            // Minor word after punctuation
            expect(Str.apa("hello. the world")).toBe("Hello. The World");
        });

        it("apa with capFirst handling empty string", () => {
            // Words with leading/trailing spaces - handled as trimmed
            expect(Str.apa("hello world")).toBe("Hello World");
        });

        it("apa with hyphenated word where capFirst receives empty string", () => {
            // This can trigger capFirst with an empty string from split("-")
            expect(Str.apa("hello-")).toMatch(/Hello-/);
        });
    });

    describe("singular", () => {
        it("Laravel tests", () => {
            expect(Str.singular("apples")).toBe("apple");
            expect(Str.singular("children")).toBe("child");
            expect(Str.singular("mice")).toBe("mouse");
        });
    });

    describe("slug", () => {
        it("Laravel tests", () => {
            expect(Str.slug("hello world")).toBe("hello-world");
            expect(Str.slug("hello-world")).toBe("hello-world");
            expect(Str.slug("hello_world")).toBe("hello-world");
            expect(Str.slug("hello_world", "_")).toBe("hello_world");
            expect(Str.slug("user@host")).toBe("user-at-host");
            expect(Str.slug("سلام دنیا", "-")).toBe("سلام-دنیا");
            expect(Str.slug("some text", "")).toBe("sometext");
            expect(Str.slug("", "")).toBe("");
            expect(Str.slug("")).toBe("");
            expect(Str.slug("بسم الله", "-", { llh: "allah" })).toBe(
                "bsm-allah",
            );
            expect(Str.slug("500$ bill", "-", { $: "dollar" })).toBe(
                "500-dollar-bill",
            );
            expect(Str.slug("500--$----bill", "-", { $: "dollar" })).toBe(
                "500-dollar-bill",
            );
            expect(Str.slug("500-$-bill", "-", { $: "dollar" })).toBe(
                "500-dollar-bill",
            );
            expect(Str.slug("500$--bill", "-", { $: "dollar" })).toBe(
                "500-dollar-bill",
            );
            expect(Str.slug("500-$--bill", "-", { $: "dollar" })).toBe(
                "500-dollar-bill",
            );
            expect(Str.slug("أحمد@المدرسة", "-", { "@": "في" })).toBe(
                "أحمد-في-المدرسة",
            );
        });
    });

    describe("snake", () => {
        it("Laravel tests", () => {
            expect(Str.snake("LaravelPHPFramework")).toBe(
                "laravel_p_h_p_framework",
            );
            expect(Str.snake("LaravelPhpFramework")).toBe(
                "laravel_php_framework",
            );
            expect(Str.snake("LaravelPhpFramework", " ")).toBe(
                "laravel php framework",
            );
            expect(Str.snake("Laravel Php Framework")).toBe(
                "laravel_php_framework",
            );
            expect(Str.snake("Laravel    Php      Framework   ")).toBe(
                "laravel_php_framework",
            );

            // ensure cache keys don't overlap
            expect(Str.snake("LaravelPhpFramework", "__")).toBe(
                "laravel__php__framework",
            );
            expect(Str.snake("LaravelPhpFramework_", "_")).toBe(
                "laravel_php_framework_",
            );
            expect(Str.snake("laravel php Framework")).toBe(
                "laravel_php_framework",
            );
            expect(Str.snake("laravel php FrameWork")).toBe(
                "laravel_php_frame_work",
            );

            // prevent breaking changes
            expect(Str.snake("foo-bar")).toBe("foo-bar");
            expect(Str.snake("Foo-Bar")).toBe("foo-_bar");
            expect(Str.snake("Foo_Bar")).toBe("foo__bar");
            expect(Str.snake("ŻółtaŁódka")).toBe("żółtałódka");

            // test cache
            expect(Str.snake("LaravelPHPFramework")).toBe(
                "laravel_p_h_p_framework",
            );
        });

        it("snake cache hit", () => {
            // First call populates the cache
            const result1 = Str.snake("TestString");
            // Second call should hit the cache
            const result2 = Str.snake("TestString");
            expect(result1).toBe("test_string");
            expect(result2).toBe("test_string");
            // Clear cache and verify it still works
            Str.flushCache();
            expect(Str.snake("TestString")).toBe("test_string");
        });

        it("snake cache hit", () => {
            // First call caches, second call returns from cache
            expect(Str.snake("HelloWorld")).toBe("hello_world");
            expect(Str.snake("HelloWorld")).toBe("hello_world"); // cache hit
        });

        it("snake with already lowercase string", () => {
            // Purely lowercase ASCII - skips transformation, triggers cache set
            expect(Str.snake("hello")).toBe("hello");
        });
    });

    describe("squish", () => {
        it("Laravel tests", () => {
            expect(Str.squish(" laravel   php  framework ")).toBe(
                "laravel php framework",
            );
            expect(Str.squish("laravel\t\tphp\n\nframework")).toBe(
                "laravel php framework",
            );
            expect(
                Str.squish(`
                laravel
                php
                framework
            `),
            ).toBe("laravel php framework");

            expect(Str.squish("   laravel   php   framework   ")).toBe(
                "laravel php framework",
            );
            expect(Str.squish("   123    ")).toBe("123");
            expect(Str.squish("だ")).toBe("だ");
            expect(Str.squish("ム")).toBe("ム");
            expect(Str.squish("   だ    ")).toBe("だ");
            expect(Str.squish("   ム    ")).toBe("ム");
            expect(Str.squish("laravelㅤㅤㅤphpㅤframework")).toBe(
                "laravel php framework",
            );
            expect(Str.squish("laravelᅠᅠᅠᅠᅠᅠᅠᅠᅠᅠphpᅠᅠframework")).toBe(
                "laravel php framework",
            );
        });
    });

    describe("doesntStartWith", () => {
        it("Laravel tests", () => {
            expect(Str.doesntStartWith("jason", "jas")).toBe(false);
            expect(Str.doesntStartWith("jason", "jason")).toBe(false);
            expect(Str.doesntStartWith("jason", ["jas"])).toBe(false);
            expect(Str.doesntStartWith("jason", ["day", "jas"])).toBe(false);
            // expect(Str.doesntStartWith("jason", collect(["day", "jas"]))).toBe(false); // TODO
            expect(Str.doesntStartWith("jason", "day")).toBe(true);
            expect(Str.doesntStartWith("jason", ["day"])).toBe(true);
            expect(Str.doesntStartWith("jason", null)).toBe(true);
            expect(Str.doesntStartWith("jason", [null])).toBe(true);
            expect(Str.doesntStartWith("0123", [null])).toBe(true);
            expect(Str.doesntStartWith("0123", 0)).toBe(false);
            expect(Str.doesntStartWith("jason", "J")).toBe(true);
            expect(Str.doesntStartWith("jason", "")).toBe(true);
            expect(Str.doesntStartWith("", "")).toBe(true);
            expect(Str.doesntStartWith("7", " 7")).toBe(true);
            expect(Str.doesntStartWith("7a", "7")).toBe(false);
            expect(Str.doesntStartWith("7a", 7)).toBe(false);
            expect(Str.doesntStartWith("7.12a", 7.12)).toBe(false);
            expect(Str.doesntStartWith("7.12a", 7.13)).toBe(true);
            expect(Str.doesntStartWith(7.123, "7")).toBe(false);
            expect(Str.doesntStartWith(7.123, "7.12")).toBe(false);
            expect(Str.doesntStartWith(7.123, "7.13")).toBe(true);
            expect(Str.doesntStartWith(null, "Marc")).toBe(true);

            // Test for multibyte string support
            expect(Str.doesntStartWith("Jönköping", "Jö")).toBe(false);
            expect(Str.doesntStartWith("Malmö", "Malmö")).toBe(false);
            expect(Str.doesntStartWith("Jönköping", "Jonko")).toBe(true);
            expect(Str.doesntStartWith("Malmö", "Malmo")).toBe(true);
            expect(Str.doesntStartWith("你好", "你")).toBe(false);
            expect(Str.doesntStartWith("你好", "好")).toBe(true);
            expect(Str.doesntStartWith("你好", "a")).toBe(true);
        });
    });

    describe("studly", () => {
        it("Laravel tests", () => {
            expect(Str.studly("laravel_p_h_p_framework")).toBe(
                "LaravelPHPFramework",
            );
            expect(Str.studly("laravel_php_framework")).toBe(
                "LaravelPhpFramework",
            );
            expect(Str.studly("laravel-phP-framework")).toBe(
                "LaravelPhPFramework",
            );
            expect(Str.studly("LARAVEL_PHP_FRAMEWORK")).toBe(
                "LARAVELPHPFRAMEWORK",
            );
            expect(Str.studly("laravel  -_-  php   -_-   framework   ")).toBe(
                "LaravelPhpFramework",
            );

            expect(Str.studly("fooBar")).toBe("FooBar");
            expect(Str.studly("foo_bar")).toBe("FooBar");
            expect(Str.studly("foo_bar")).toBe("FooBar"); // test cache
            expect(Str.studly("foo-barBaz")).toBe("FooBarBaz");
            expect(Str.studly("foo-bar_baz")).toBe("FooBarBaz");

            expect(Str.studly("öffentliche-überraschungen")).toBe(
                "ÖffentlicheÜberraschungen",
            );
        });
    });

    describe("pascal", () => {
        it("Laravel tests", () => {
            expect(Str.pascal("laravel_php_framework")).toBe(
                "LaravelPhpFramework",
            );
            expect(Str.pascal("laravel-php-framework")).toBe(
                "LaravelPhpFramework",
            );
            expect(Str.pascal("laravel  -_-  php   -_-   framework   ")).toBe(
                "LaravelPhpFramework",
            );

            expect(Str.pascal("fooBar")).toBe("FooBar");
            expect(Str.pascal("foo_bar")).toBe("FooBar");
            expect(Str.pascal("foo_bar")).toBe("FooBar");
            expect(Str.pascal("foo-barBaz")).toBe("FooBarBaz");
            expect(Str.pascal("foo-bar_baz")).toBe("FooBarBaz");

            expect(Str.pascal("öffentliche-überraschungen")).toBe(
                "ÖffentlicheÜberraschungen",
            );
        });
    });

    describe("swap", () => {
        it("Laravel tests", () => {
            expect(
                Str.swap(
                    {
                        PHP: "PHP 8",
                        awesome: "fantastic",
                    },
                    "PHP is awesome",
                ),
            ).toBe("PHP 8 is fantastic");

            expect(
                Str.swap(
                    {
                        "ⓐⓑ": "baz",
                    },
                    "foo bar ⓐⓑ",
                ),
            ).toBe("foo bar baz");

            expect(
                Str.swap(
                    {
                        "ⓐⓑ": "",
                    },
                    "foo bar ⓐⓑ",
                ),
            ).toBe("foo bar ");
            expect(Str.swap({}, "foo bar ⓐⓑ")).toBe("foo bar ⓐⓑ");

            // Test with only empty string keys (covers the empty keys filter branch)
            expect(Str.swap({ "": "replacement" }, "foo bar")).toBe("foo bar");
        });

        it("swap with match fallback", () => {
            // Test swap where pattern match is not in map (uses match fallback)
            const map = { foo: "bar", baz: "qux" };
            expect(Str.swap(map, "foo baz nothing")).toBe("bar qux nothing");
        });

        it("swap with key not in subject returns unchanged", () => {
            // Key exists in map but not found in subject - branch for ?? match
            expect(Str.swap({ xyz: "replaced" }, "abc")).toBe("abc");
        });

        it("swap when match exists in map", () => {
            // Match found in map - uses replacement
            expect(Str.swap({ abc: "XYZ" }, "abc def")).toBe("XYZ def");
        });
    });

    describe("take", () => {
        it("Laravel tests", () => {
            expect(Str.take("abcdef", 2)).toBe("ab");
            expect(Str.take("abcdef", -2)).toBe("ef");
            expect(Str.take("abcdef", 0)).toBe("");
            expect(Str.take("", 2)).toBe("");
            expect(Str.take("abcdef", 10)).toBe("abcdef");
            expect(Str.take("abcdef", 6)).toBe("abcdef");
            expect(Str.take("üöä", 1)).toBe("ü");
        });
    });

    describe("toBase64", () => {
        it("Laravel tests", () => {
            expect(Str.toBase64("hello world")).toBe("aGVsbG8gd29ybGQ=");
            expect(Str.toBase64("laravel")).toBe("bGFyYXZlbA==");
            expect(Str.toBase64("PHP 8")).toBe("UEhQIDg=");
            expect(Str.toBase64("foo")).toBe("Zm9v");
            expect(Str.toBase64("foobar")).toBe("Zm9vYmFy");
        });
    });

    describe("fromBase64", () => {
        it("Laravel tests", () => {
            expect(Str.fromBase64("aGVsbG8gd29ybGQ=")).toBe("hello world");
            expect(Str.fromBase64("bGFyYXZlbA==")).toBe("laravel");
            expect(Str.fromBase64("UEhQIDg=")).toBe("PHP 8");
            expect(Str.fromBase64("Zm9v")).toBe("foo");
            expect(Str.fromBase64("Zm9vYmFy")).toBe("foobar");
        });
    });

    describe("lcfirst", () => {
        it("Laravel tests", () => {
            expect(Str.lcfirst("Laravel")).toBe("laravel");
            expect(Str.lcfirst("Laravel framework")).toBe("laravel framework");
            expect(Str.lcfirst("Мама")).toBe("мама");
            expect(Str.lcfirst("Мама мыла раму")).toBe("мама мыла раму");
        });
    });

    describe("ucfirst", () => {
        it("Laravel tests", () => {
            expect(Str.ucfirst("laravel")).toBe("Laravel");
            expect(Str.ucfirst("laravel framework")).toBe("Laravel framework");
            expect(Str.ucfirst("мама")).toBe("Мама");
            expect(Str.ucfirst("мама мыла раму")).toBe("Мама мыла раму");
        });
    });

    describe("ucsplit", () => {
        it("Laravel tests", () => {
            expect(Str.ucsplit("Laravel_p_h_p_framework")).toEqual([
                "Laravel_p_h_p_framework",
            ]);
            expect(Str.ucsplit("Laravel_P_h_p_framework")).toEqual([
                "Laravel_",
                "P_h_p_framework",
            ]);
            expect(Str.ucsplit("laravelPHPFramework")).toEqual([
                "laravel",
                "P",
                "H",
                "P",
                "Framework",
            ]);
            expect(Str.ucsplit("Laravel-phP-framework")).toEqual([
                "Laravel-ph",
                "P-framework",
            ]);

            expect(Str.ucsplit("ŻółtaŁódka")).toEqual(["Żółta", "Łódka"]);
            expect(Str.ucsplit("sindÖdeUndSo")).toEqual([
                "sind",
                "Öde",
                "Und",
                "So",
            ]);
            expect(Str.ucsplit("ÖffentlicheÜberraschungen")).toEqual([
                "Öffentliche",
                "Überraschungen",
            ]);
        });
    });

    describe("ucwords", () => {
        describe("Laravel tests", () => {
            it("test ucwords", () => {
                expect(Str.ucwords("hello world")).toBe("Hello World");
                expect(Str.ucwords("laravel php framework")).toBe(
                    "Laravel Php Framework",
                );
                expect(Str.ucwords("Öffentliche Überraschungen")).toBe(
                    "Öffentliche Überraschungen",
                );
            });

            it("test ucwords separator", () => {
                // Hyphen as separator
                expect(Str.ucwords("laravel-framework", "-")).toBe(
                    "Laravel-Framework",
                );
                // Underscore as separator
                expect(Str.ucwords("laravel_framework", "_")).toBe(
                    "Laravel_Framework",
                );
                // Multiple custom separators provided as array
                expect(Str.ucwords("hello-world_laravel", ["-", "_"])).toBe(
                    "Hello-World_Laravel",
                );
                // Mixed whitespace and separator characters
                expect(
                    Str.ucwords("hello-world laravel_framework", ["-", "_"]),
                ).toBe("Hello-World Laravel_Framework");
                // Ensure only lowercase letters are uppercased (e.g., "JJ watt" → "JJ Watt")
                expect(Str.ucwords("JJ watt")).toBe("JJ Watt");
            });
        });

        it("ucwords with custom separators", () => {
            // Test ucwords with array of separators
            expect(Str.ucwords("hello-world_test", ["-", "_"])).toBe(
                "Hello-World_Test",
            );
            // Test ucwords with empty separator string (still capitalizes after whitespace)
            expect(Str.ucwords("hello world", "")).toBe("Hello World");
        });
    });

    describe("wordCount", () => {
        it("Laravel tests", () => {
            expect(Str.wordCount("Hello, world!")).toBe(2);
            expect(
                Str.wordCount(
                    "Hi, this is my first contribution to the Laravel framework.",
                ),
            ).toBe(10);

            expect(Str.wordCount("мама")).toBe(1);
            expect(Str.wordCount("мама мыла раму")).toBe(3);

            expect(
                Str.wordCount(
                    "мама",
                    "абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
                ),
            ).toBe(1);
            expect(
                Str.wordCount(
                    "мама мыла раму",
                    "абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
                ),
            ).toBe(3);

            expect(
                Str.wordCount(
                    "МАМА",
                    "абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
                ),
            ).toBe(1);
            expect(
                Str.wordCount(
                    "МАМА МЫЛА РАМУ",
                    "абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
                ),
            ).toBe(3);
        });

        it("wordCount with extra characters", () => {
            // Test wordCount with additional characters parameter
            expect(Str.wordCount("hello'world", "'")).toBe(1);
            expect(Str.wordCount("hello'world")).toBe(2);
            // Test wordCount with empty string
            expect(Str.wordCount("")).toBe(0);
        });
    });

    describe("wordWrap", () => {
        it("Laravel tests", () => {
            expect(Str.wordWrap("Hello World", 3, "<br />")).toBe(
                "Hello<br />World",
            );
            expect(Str.wordWrap("Hello World", 3, "<br />", true)).toBe(
                "Hel<br />lo<br />Wor<br />ld",
            );

            expect(Str.wordWrap("❤Multi Byte☆❤☆❤☆❤", 3, "<br />")).toBe(
                "❤Multi<br />Byte☆❤☆❤☆❤",
            );

            // Edge cases for coverage
            // Empty string returns empty
            expect(Str.wordWrap("", 10)).toBe("");
            // Characters < 1 returns original
            expect(Str.wordWrap("Hello", 0)).toBe("Hello");
            // Empty breakStr returns original
            expect(Str.wordWrap("Hello World", 5, "")).toBe("Hello World");

            // Test cutLongWords with leading whitespace
            expect(Str.wordWrap("   Hello", 3, "\n", true)).toBe("Hel\nlo");
            // Test cutLongWords with trailing whitespace in chunk
            expect(Str.wordWrap("a b c", 2, "\n", true)).toBe("a\nb\nc");

            // Test non-cut mode: line shorter than width
            expect(Str.wordWrap("Hi", 10)).toBe("Hi");
            // Test non-cut mode: leading whitespace trimming
            expect(Str.wordWrap("   Hello World", 5)).toBe("Hello\nWorld");
            // Test non-cut mode: find whitespace within window
            expect(Str.wordWrap("Hello World Test", 8)).toBe(
                "Hello\nWorld\nTest",
            );
            // Test non-cut mode: no whitespace within window, break at next space
            expect(Str.wordWrap("Superlongword test", 5)).toBe(
                "Superlongword\ntest",
            );
            // Test non-cut mode: no whitespace at all
            expect(Str.wordWrap("Superlongword", 5)).toBe("Superlongword");

            // Test with empty line in input
            expect(Str.wordWrap("Hello\n\nWorld", 10)).toBe("Hello\n\nWorld");
            // Test with multiple lines
            expect(Str.wordWrap("Hello\nWorld", 10)).toBe("Hello\nWorld");

            // Test cutLongWords with line exactly at width
            expect(Str.wordWrap("abc", 3, "\n", true)).toBe("abc");
            // Test non-cut with line fitting in remaining
            expect(Str.wordWrap("ab cd", 5)).toBe("ab cd");
        });

        it("wordWrap with various edge cases", () => {
            // Test with cutLongWords and leading whitespace
            expect(Str.wordWrap("  hello", 3, "\n", true)).toBe("hel\nlo");
            // Test with cutLongWords and trailing whitespace in chunk
            expect(Str.wordWrap("a b c d", 2, "\n", true)).toBe("a\nb\nc\nd");
            // Test without cutLongWords and no space in window
            expect(Str.wordWrap("verylongword", 5, "\n", false)).toBe(
                "verylongword",
            );
            // Test with empty value
            expect(Str.wordWrap("", 10)).toBe("");
            // Test with characters < 1
            expect(Str.wordWrap("hello", 0)).toBe("hello");
            // Test with empty breakStr
            expect(Str.wordWrap("hello world", 5, "")).toBe("hello world");
            // Test with line length exactly at character limit
            expect(Str.wordWrap("hello", 5)).toBe("hello");
        });

        it("wordWrap using default characters parameter (75)", () => {
            // Uses default characters of 75
            const shortString = "Short string that fits on one line";
            expect(Str.wordWrap(shortString)).toBe(shortString);
        });

        it("wordWrap soft wrap edge cases", () => {
            // Test soft wrap with no whitespace in window but whitespace ahead
            expect(Str.wordWrap("helloworld test", 6, "\n")).toBe(
                "helloworld\ntest",
            );
            // Test soft wrap with leading spaces
            expect(Str.wordWrap("   hello world", 8, "\n")).toBe(
                "hello\nworld",
            );
        });

        it("wordWrap with cutLongWords edge cases", () => {
            // Test line becomes empty after trimming
            expect(Str.wordWrap("   ", 3, "\n", true)).toBe("");
            // Test line after slicing is empty
            expect(Str.wordWrap("abc", 3, "\n", true)).toBe("abc");
            // Test chunk has trailing whitespace
            expect(Str.wordWrap("ab cd", 3, "\n", true)).toBe("ab\ncd");
        });

        it("wordWrap soft wrap edge cases", () => {
            // Test when no space found in window but space exists ahead
            expect(Str.wordWrap("abcde fgh", 3, "\n")).toBe("abcde\nfgh");
            // Test when no space found anywhere
            expect(Str.wordWrap("abcdefgh", 3, "\n")).toBe("abcdefgh");
        });

        it("wordWrap with no whitespace anywhere", () => {
            // Long word with no whitespace at all outputs as single line
            expect(Str.wordWrap("abcdefghij", 3, "\n")).toBe("abcdefghij");
        });

        it("wordWrap soft wrap with trailing content after no-space break", () => {
            // No space in window, space found ahead, then remaining content
            expect(Str.wordWrap("abcdef ghi", 4, "\n")).toBe("abcdef\nghi");
        });

        it("wordWrap cutLongWords with leading whitespace chunks", () => {
            // Test the branch where leading whitespace is trimmed in cutLongWords mode
            expect(Str.wordWrap("   abc   def", 5, "\n", true)).toBe(
                "abc\ndef",
            );
        });

        it("wordWrap cutLongWords with only whitespace", () => {
            // Test the branch where line becomes empty after trimming
            expect(Str.wordWrap("     ", 5, "\n", true)).toBe("");
        });

        it("wordWrap soft wrap when trimmed content fits", () => {
            // Test when leading spaces are trimmed and remaining fits within limit
            // "  abcd" is 6 chars, limit 5, leading spaces trimmed, "abcd" fits
            expect(Str.wordWrap("  abcd", 5, "\n")).toBe("abcd");
        });

        it("wordWrap with characters less than 1", () => {
            // Returns original string unchanged
            expect(Str.wordWrap("hello world", 0, "\n")).toBe("hello world");
        });

        it("wordWrap with empty breakStr", () => {
            // Returns original string unchanged
            expect(Str.wordWrap("hello world", 5, "")).toBe("hello world");
        });

        it("wordWrap with negative characters", () => {
            // characters < 1 returns original
            expect(Str.wordWrap("hello", -5)).toBe("hello");
        });
    });

    describe("uuid", () => {
        it("Laravel tests", () => {
            expect(Str.uuid()).not.toBe(Str.uuid());

            const uuid = Str.freezeUuids();

            expect(uuid).toBe(Str.uuid());
            expect(Str.uuid()).toBe(Str.uuid());
            expect(String(uuid)).toBe(String(Str.uuid()));
            expect(String(Str.uuid())).toBe(String(Str.uuid()));

            Str.createUuidsNormally();

            expect(Str.uuid()).not.toBe(Str.uuid());
            expect(String(Str.uuid())).not.toBe(String(Str.uuid()));
        });
    });

    describe("uuid7", () => {
        it("Laravel tests", () => {
            expect(Str.uuid7()).not.toBe(Str.uuid7());

            const uuid = Str.freezeUuids();

            expect(uuid).toBe(Str.uuid7());
            expect(Str.uuid7()).toBe(Str.uuid7());
            expect(String(uuid)).toBe(String(Str.uuid7()));
            expect(String(Str.uuid7())).toBe(String(Str.uuid7()));

            Str.createUuidsNormally();

            expect(Str.uuid7()).not.toBe(Str.uuid7());
            expect(String(Str.uuid7())).not.toBe(String(Str.uuid7()));
        });
    });

    describe("createUuidsUsing", () => {
        it("Laravel tests", () => {
            try {
                Str.freezeUuids(function () {
                    Str.createUuidsUsing(() => Str.of("1234").toString());
                    expect(Str.uuid().toString()).toBe("1234");
                    throw new Error("Something failed.");
                });
            } catch {
                expect(Str.uuid().toString()).not.toBe("1234");
            }
        });
    });

    describe("createUuidsUsingSequence", () => {
        it("can specify a sequence of uuids to utilise", () => {
            const zeroth = Str.uuid();
            const first = Str.uuid7();
            const second = Str.uuid();
            Str.createUuidsUsingSequence([zeroth, first, second]);

            let retrieved = Str.uuid();
            expect(retrieved).toBe(zeroth);
            expect(String(retrieved)).toBe(String(zeroth));

            retrieved = Str.uuid();
            expect(retrieved).toBe(first);
            expect(String(retrieved)).toBe(String(first));

            retrieved = Str.uuid();
            expect(retrieved).toBe(second);
            expect(String(retrieved)).toBe(String(second));

            retrieved = Str.uuid();
            expect([zeroth, first, second].includes(retrieved)).toBe(false);
            expect(
                [String(zeroth), String(first), String(second)].includes(
                    String(retrieved),
                ),
            ).toBe(false);

            Str.createUuidsNormally();
        });

        it("can specify a fallback for a uuid sequence", () => {
            Str.createUuidsUsingSequence([Str.uuid(), Str.uuid()], () => {
                throw new Error("Out of Uuids.");
            });

            Str.uuid();
            Str.uuid();

            expect(() => {
                Str.uuid();
            }).toThrowError("Out of Uuids.");

            Str.createUuidsNormally();
        });
    });

    describe("freezeUuids", () => {
        it("Laravel tests", () => {
            expect(Str.uuid().toString()).not.toBe(Str.uuid().toString());
            expect(Str.uuid()).not.toBe(Str.uuid());

            const uuid = Str.freezeUuids();

            expect(uuid).toBe(Str.uuid());
            expect(Str.uuid()).toBe(Str.uuid());
            expect(String(uuid)).toBe(String(Str.uuid()));
            expect(String(Str.uuid())).toBe(String(Str.uuid()));

            Str.createUuidsNormally();

            expect(Str.uuid()).not.toBe(Str.uuid());
            expect(String(Str.uuid())).not.toBe(String(Str.uuid()));
        });
    });

    describe("ulid", () => {
        it("Laravel tests", () => {
            const when = new Date("2024-01-01T00:00:00.000Z").getTime();
            const idA = Str.ulid(when);
            const idB = Str.ulid(when);
            expect(idA.substring(0, 10)).toBe(idB.substring(0, 10));
            expect(idA).not.toBe(idB);

            expect(Str.ulid(new Date())).toHaveLength(26);
            expect(Str.isUlid(Str.ulid(new Date()))).toBe(true);

            expect(Str.ulid(new Date().getTime())).toHaveLength(26);
            expect(Str.isUlid(Str.ulid(new Date().getTime()))).toBe(true);
        });
    });

    describe("createUlidsUsingSequence", () => {
        it("can specify a sequence of ulids to utilise", () => {
            const zeroth = Str.ulid();
            const first = Str.ulid();
            const second = Str.ulid();
            Str.createUlidsUsingSequence([zeroth, first, second]);

            let retrieved = Str.ulid();
            expect(retrieved).toBe(zeroth);
            expect(String(retrieved)).toBe(String(zeroth));

            retrieved = Str.ulid();
            expect(retrieved).toBe(first);
            expect(String(retrieved)).toBe(String(first));

            retrieved = Str.ulid();
            expect(retrieved).toBe(second);
            expect(String(retrieved)).toBe(String(second));

            retrieved = Str.ulid();
            expect([zeroth, first, second].includes(retrieved)).toBe(false);
            expect(
                [String(zeroth), String(first), String(second)].includes(
                    String(retrieved),
                ),
            ).toBe(false);

            Str.createUlidsNormally();
        });
        it("can specify a fallback for a ulid sequence", () => {
            Str.createUlidsUsingSequence([Str.ulid(), Str.ulid()], () => {
                throw new Error("Out of Ulids.");
            });

            Str.ulid();
            Str.ulid();

            expect(() => {
                Str.ulid();
            }).toThrowError("Out of Ulids.");

            Str.createUlidsNormally();
        });
    });

    describe("createUlidsUsing", () => {
        it("Laravel tests", () => {
            try {
                Str.freezeUlids(function () {
                    Str.createUlidsUsing(() => Str.of("1234").toString());
                    expect(Str.ulid().toString()).toBe("1234");
                    throw new Error("Something failed.");
                });
            } catch {
                expect(Str.ulid().toString()).not.toBe("1234");
            }
        });
    });

    describe("freezeUlids", () => {
        it("Laravel tests", () => {
            expect(Str.ulid().toString()).not.toBe(Str.ulid().toString());
            expect(Str.ulid()).not.toBe(Str.ulid());

            const ulid = Str.freezeUlids();

            expect(ulid).toBe(Str.ulid());
            expect(Str.ulid()).toBe(Str.ulid());
            expect(String(ulid)).toBe(String(Str.ulid()));
            expect(String(Str.ulid())).toBe(String(Str.ulid()));

            Str.createUlidsNormally();

            expect(Str.ulid()).not.toBe(Str.ulid());
            expect(String(Str.ulid())).not.toBe(String(Str.ulid()));
        });
    });

    describe("flushCache", () => {
        it("Laravel tests", () => {
            // Warm the caches by calling snake, camel, and studly with a few inputs
            Str.snake("LaravelPHPFramework");
            Str.snake("LaravelPhpFramework", " "); // different delimiter to create a different snake cache key
            Str.camel("foo_bar");
            Str.studly("foo_bar");

            // Access internal caches (runtime properties) to assert they were populated
            const snakeSizeBefore = Str.snakeCacheSize();
            const camelSizeBefore = Str.camelCacheSize();
            const studlySizeBefore = Str.studlyCacheSize();

            expect(snakeSizeBefore).toBeGreaterThan(0);
            expect(camelSizeBefore).toBeGreaterThan(0);
            expect(studlySizeBefore).toBeGreaterThan(0);

            // Flush and verify caches are cleared
            Str.flushCache();

            expect(Str.snakeCacheSize()).toBe(0);
            expect(Str.camelCacheSize()).toBe(0);
            expect(Str.studlyCacheSize()).toBe(0);

            // Ensure methods still compute correctly after a flush (no stale state)
            expect(Str.snake("LaravelPhpFramework")).toBe(
                "laravel_php_framework",
            );
            expect(Str.camel("foo-bar_baz")).toBe("fooBarBaz");
            expect(Str.studly("foo-bar_baz")).toBe("FooBarBaz");
        });
    });

    describe("makePad", () => {
        it("makePad with empty pad string", () => {
            // Empty pad string should return empty string
            expect(Str.makePad("", 10)).toBe("");
        });
    });
});
