import { describe, expect, it } from "vitest";
import { Str, Stringable, CaseTypes } from "@laravel-js-support/str";

describe("Str tests", () => {
    it("of", () => {
        expect(Str.of("ééé hannah")).toBeInstanceOf(Stringable);
    });

    it("after", () => {
        expect(Str.after("hannah", "han")).toBe("nah");
        expect(Str.after("hannah", "n")).toBe("nah");
        expect(Str.after("ééé hannah", "han")).toBe("nah");
        expect(Str.after("hannah", "xxxx")).toBe("hannah");
        expect(Str.after("hannah", "")).toBe("hannah");
        expect(Str.after("han0nah", "0")).toBe("nah");
        expect(Str.after("han0nah", 0)).toBe("nah");
        expect(Str.after("han2nah", 2)).toBe("nah");
    });

    it("afterLast", () => {
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
    });

    it("ascii", () => {
        expect(Str.ascii("@")).toBe("@");
        expect(Str.ascii("ü")).toBe("u");
        expect(Str.ascii("")).toBe("");
        expect(Str.ascii("a!2ë")).toBe("a!2e");

        expect(Str.ascii("х Х щ Щ ъ Ъ иа йо")).toBe("h H shch Shch   ia yo");
        expect(Str.ascii("ä ö ü Ä Ö Ü")).toBe("a o u A O U");

        expect(Str.ascii("ééé hannah")).toBe("eee hannah");
        expect(Str.ascii("Héllo Wörld")).toBe("Hello World");
        expect(Str.ascii("Füße")).toBe("Fusse");
        expect(Str.ascii("Straße")).toBe("Strasse");
    });

    it("transliterate", () => {
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

    it("before", () => {
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

    it("beforeLast", () => {
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

    it("between", () => {
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

    it("betweenFirst", () => {
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

    it.skip("camel", () => {
        expect(Str.camel("Laravel_p_h_p_framework")).toBe(
            "laravelPHPFramework",
        );
        expect(Str.camel("Laravel_php_framework")).toBe("laravelPhpFramework");
        expect(Str.camel("Laravel-phP-framework")).toBe("laravelPhPFramework");
        expect(Str.camel("Laravel  -_-  php   -_-   framework   ")).toBe(
            "laravelPhpFramework",
        );

        expect(Str.camel("FooBar")).toBe("fooBar");
        expect(Str.camel("foo_bar")).toBe("fooBar");
        expect(Str.camel("foo_bar")).toBe("fooBar");
        expect(Str.camel("Foo-barBaz")).toBe("fooBarBaz");
        expect(Str.camel("foo-bar_baz")).toBe("fooBarBaz");

        expect(Str.camel("")).toBe("");
        expect(Str.camel("LARAVEL_PHP_FRAMEWORK")).toBe("laravelPhpFramework");
        expect(Str.camel("   laravel   php   framework   ")).toBe(
            "laravelPhpFramework",
        );

        expect(Str.camel("foo1_bar")).toBe("foo1Bar");
        expect(Str.camel("1 foo bar")).toBe("1FooBar");
    });

    it("charAt", () => {
        expect(Str.charAt("Привет, мир!", 1)).toBe("р");
        expect(Str.charAt("「こんにちは世界」", 4)).toBe("ち");
        expect(Str.charAt("Привет, world!", 8)).toBe("w");
        expect(Str.charAt("「こんにちは世界」", -2)).toBe("界");
        expect(Str.charAt("「こんにちは世界」", -200)).toBe(false);
        expect(Str.charAt("Привет, мир!", 100)).toBe(false);
    });

    it("chopStart", () => {
        const data: [string, string | string[], string][] = [
            ["http://laravel.com", "http://", "laravel.com"],
            ["http://-http://", "http://", "-http://"],
            ["http://laravel.com", "htp:/", "http://laravel.com"],
            ["http://laravel.com", "http://www.", "http://laravel.com"],
            ["http://laravel.com", "-http://", "http://laravel.com"],
            ["http://laravel.com", ["https://", "http://"], "laravel.com"],
            ["http://www.laravel.com", ["http://", "www."], "www.laravel.com"],
            ["http://http-is-fun.test", "http://", "http-is-fun.test"],
            ["🌊✋", "🌊", "✋"],
            ["🌊✋", "✋", "🌊✋"],
        ];

        data.forEach(([input, chop, expected]) => {
            expect(Str.chopStart(input, chop)).toBe(expected);
        });
    });

    it("chopEnd", () => {
        const data: [string, string | string[], string][] = [
            ["path/to/file.php", ".php", "path/to/file"],
            [".php-.php", ".php", ".php-"],
            ["path/to/file.php", ".ph", "path/to/file.php"],
            ["path/to/file.php", "foo.php", "path/to/file.php"],
            ["path/to/file.php", ".php-", "path/to/file.php"],
            ["path/to/file.php", [".html", ".php"], "path/to/file"],
            ["path/to/file.php", [".php", "file"], "path/to/file"],
            ["path/to/php.php", ".php", "path/to/php"],
            ["✋🌊", "🌊", "✋"],
            ["✋🌊", "✋", "✋🌊"],
        ];

        data.forEach(([input, chop, expected]) => {
            expect(Str.chopEnd(input, chop)).toBe(expected);
        });
    });

    it("contains", () => {
        const data: [string, string | Iterable<string>, boolean, boolean][] = [
            ["Taylor", "ylo", true, true],
            ["Taylor", "ylo", false, true],
            ["Taylor", "taylor", true, true],
            ["Taylor", "taylor", false, false],
            ["Taylor", ["ylo"], true, true],
            ["Taylor", ["ylo"], false, true],
            ["Taylor", ["xxx", "ylo"], true, true],
            // ['Taylor', collect(['xxx', 'ylo']), true, true], // TODO when collection package is implemented
            ["Taylor", ["xxx", "ylo"], false, true],
            ["Taylor", "xxx", false, false],
            ["Taylor", ["xxx"], false, false],
            ["Taylor", "", false, false],
            ["", "", false, false],
        ];

        data.forEach(([haystack, needles, ignoreCase, expected]) => {
            expect(Str.contains(haystack, needles, ignoreCase)).toBe(expected);
        });
    });

    it("containsAll", () => {
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

    it("doesntContain", () => {
        const data: [string, string | Iterable<string>, boolean, boolean][] = [
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

    it("convertCase", () => {
        expect(Str.convertCase("hello", CaseTypes.upper)).toBe("HELLO");
        expect(Str.convertCase("WORLD", CaseTypes.lower)).toBe("world");
        expect(Str.convertCase("HeLLo", CaseTypes.fold)).toBe("hello");
        expect(Str.convertCase("WoRLD", CaseTypes.fold)).toBe("world");
        expect(Str.convertCase("üöä", CaseTypes.upper)).toBe("ÜÖÄ");
        expect(Str.convertCase("ÜÖÄ", CaseTypes.lower)).toBe("üöä");
        expect(Str.convertCase("hello world", CaseTypes.title)).toBe(
            "Hello world",
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
        expect(Str.convertCase("hello-world_test", CaseTypes.fold_simple)).toBe(
            "hello world test",
        );
    });

    it("deduplicate", () => {
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

    it.skip("excerpt", () => {});

    it("finish", () => {
        expect(Str.finish("ab", "bc")).toBe("abbc");
        expect(Str.finish("abbcbc", "bc")).toBe("abbc");
        expect(Str.finish("abcbbcbc", "bc")).toBe("abcbbc");
    });

    it("wrap", () => {
        expect(Str.wrap("value", '"')).toBe('"value"');
        expect(Str.wrap("-bar-", "foo", "baz")).toBe("foo-bar-baz");
    });

    it.skip("unwrap", () => {});

    it("is", () => {
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

    it("isAscii", () => {
        expect(Str.isAscii("Hello World")).toBe(true);
        expect(Str.isAscii("こんにちは")).toBe(false);
        expect(Str.isAscii("12345")).toBe(true);
        expect(Str.isAscii("!@#$%")).toBe(true);
        expect(Str.isAscii("Hello こんにちは")).toBe(false);
    });

    it("isJson", () => {
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
        expect(Str.isJson('[{first: "John"}, {first: "Jane"}]')).toBe(false);
        expect(Str.isJson("")).toBe(false);
        expect(Str.isJson(null)).toBe(false);
        expect(Str.isJson([])).toBe(false);
    });
});
