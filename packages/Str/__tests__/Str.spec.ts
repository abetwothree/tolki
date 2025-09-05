import { describe, expect, it } from "vitest";
import { Str, Stringable, CaseTypes, Random } from "@laravel-js/str";

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

    it("camel", () => {
        expect(Str.camel("Laravel_p_h_p_framework")).toBe(
            "laravelPHPFramework",
        );
        expect(Str.camel("Laravel_php_framework")).toBe("laravelPhpFramework");
        // Matches current camel implementation semantics (internal capitalization in segment retained)
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

    it("endsWith", () => {
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

    it("doesntEndWith", () => {
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

    it("excerpt", () => {
        expect(Str.excerpt("some text", "phrase")).toBeNull();
    });

    it("finish", () => {
        expect(Str.finish("ab", "bc")).toBe("abbc");
        expect(Str.finish("abbcbc", "bc")).toBe("abbc");
        expect(Str.finish("abcbbcbc", "bc")).toBe("abcbbc");
    });

    it("wrap", () => {
        expect(Str.wrap("value", '"')).toBe('"value"');
        expect(Str.wrap("-bar-", "foo", "baz")).toBe("foo-bar-baz");
    });

    it("unwrap", () => {
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

    it("isUrl", () => {
        expect(Str.isUrl(789)).toBe(false);
        expect(Str.isUrl("https://laravel.com")).toBe(true);
        expect(Str.isUrl("https://laravel.com", ["http", "https"])).toBe(true);
        expect(Str.isUrl("http://localhost")).toBe(true);
        expect(Str.isUrl("invalid url")).toBe(false);
    });

    it("isUuid", () => {
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

        expect(Str.isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
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
        expect(Str.isUuid("00000000-0000-0000-0000-000000000000", "nil")).toBe(
            true,
        );
        expect(Str.isUuid("ffffffff-ffff-ffff-ffff-ffffffffffff", "max")).toBe(
            true,
        );
        expect(Str.isUuid("invalid-uuid")).toBe(false);
        expect(Str.isUuid("invalid-uuid", 7)).toBe(false);
        expect(Str.isUuid(4746392, 7)).toBe(false);
    });

    it("isUlid", () => {
        const id = Str.ulid();
        expect(id).toHaveLength(26);
        expect(Str.isUlid(id)).toBe(true);
        expect(Str.isUlid(id.toLowerCase())).toBe(true); // ULIDs are case-insensitive per spec
        expect(Str.isUlid("invalid-ulid")).toBe(false);
        expect(Str.isUlid(4746392)).toBe(false);
    });

    it("kebab", () => {
        expect(Str.kebab("Laravel PHP Framework")).toBe(
            "laravel-php-framework",
        );
        expect(Str.kebab("fooBarBaz")).toBe("foo-bar-baz");
        expect(Str.kebab("Foo_Bar-Baz qux")).toBe("foo-bar-baz-qux");
    });

    it("length", () => {
        expect(Str.length("foo bar baz")).toBe(11);
        expect(Str.length("Hello こんにちは")).toBe(11);
    });

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
        expect(Str.limit(string, 20, "...", true)).toBe("The PHP framework...");

        const nonAsciiString = "这是一段中文";
        expect(Str.limit(nonAsciiString, 3)).toBe("这是一...");
        expect(Str.limit(nonAsciiString, 3, "...", true)).toBe("这是一...");
        expect(Str.limit(nonAsciiString, 3, "")).toBe("这是一");
        expect(Str.limit(nonAsciiString, 3, "", true)).toBe("这是一");

        expect(Str.limit("The PHP", 5, "...", true)).toBe("The...");
        expect(Str.limit("Hello world", 5, "...", true)).toBe("Hello...");
    });

    it("lower", () => {
        expect(Str.lower("FOO BAR BAZ")).toBe("foo bar baz");
        expect(Str.lower("fOo Bar bAz")).toBe("foo bar baz");
    });

    it("words", () => {
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
            const paragraphAttrPlugin = (md: any, opts?: any) => {
                const attrName = (opts && opts.attrName) || "data-ext";
                const orig =
                    md.renderer.rules.paragraph_open ||
                    ((tokens: any, idx: number, _o: any, _e: any, self: any) =>
                        self.renderToken(tokens, idx, _o));
                md.renderer.rules.paragraph_open = (
                    tokens: any,
                    idx: number,
                    options: any,
                    _env: any,
                    self: any,
                ) => {
                    tokens[idx].attrPush([attrName, "1"]);
                    return orig(tokens, idx, options, _env, self);
                };
            };

            // Plugin adding class to h1
            const headingClassPlugin = (md: any) => {
                const orig =
                    md.renderer.rules.heading_open ||
                    ((tokens: any, idx: number, _o: any, _e: any, self: any) =>
                        self.renderToken(tokens, idx, _o));
                md.renderer.rules.heading_open = (
                    tokens: any,
                    idx: number,
                    options: any,
                    env: any,
                    self: any,
                ) => {
                    const token = tokens[idx];
                    if (token.tag === "h1") {
                        token.attrPush(["data-head", "yes"]);
                    }
                    return orig(tokens, idx, options, env, self);
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
            const plugin = (md: any) => {
                const orig =
                    md.renderer.rules.em_open ||
                    ((
                        tokens: any,
                        idx: number,
                        options: any,
                        _env: any,
                        self: any,
                    ) => self.renderToken(tokens, idx, options));
                md.renderer.rules.em_open = function (
                    tokens: any,
                    idx: number,
                    options: any,
                    _env: any,
                    self: any,
                ) {
                    tokens[idx].attrPush(["data-x", "y"]);
                    return orig(tokens, idx, options, _env, self);
                };
            };
            const html = Str.inlineMarkdown("*hi*", {}, [plugin]);
            expect(html).toContain('<em data-x="y">');
        });
    });

    it("mask", () => {
        expect(Str.mask("taylor@email.com", "*", 3)).toBe("tay*************");
        expect(Str.mask("taylor@email.com", "*", 0, 6)).toBe(
            "******@email.com",
        );
        expect(Str.mask("taylor@email.com", "*", -13)).toBe("tay*************");
        expect(Str.mask("taylor@email.com", "*", -13, 3)).toBe(
            "tay***@email.com",
        );

        expect(Str.mask("taylor@email.com", "*", -17)).toBe("****************");
        expect(Str.mask("taylor@email.com", "*", -99, 5)).toBe(
            "*****r@email.com",
        );

        expect(Str.mask("taylor@email.com", "*", 16)).toBe("taylor@email.com");
        expect(Str.mask("taylor@email.com", "*", 16, 99)).toBe(
            "taylor@email.com",
        );

        expect(Str.mask("taylor@email.com", "", 3)).toBe("taylor@email.com");

        expect(Str.mask("taylor@email.com", "something", 3)).toBe(
            "taysssssssssssss",
        );
        expect(Str.mask("taylor@email.com", "something", 3)).toBe(
            "taysssssssssssss",
        );

        expect(Str.mask("这是一段中文", "*", 3)).toBe("这是一***");
        expect(Str.mask("这是一段中文", "*", 0, 2)).toBe("**一段中文");

        expect(Str.mask("maan@email.com", "*", 2, 1)).toBe("ma*n@email.com");
        expect(Str.mask("maan@email.com", "*", 2, 3)).toBe("ma***email.com");
        expect(Str.mask("maan@email.com", "*", 2)).toBe("ma************");

        expect(Str.mask("maria@email.com", "*", 4, 1)).toBe("mari*@email.com");
        expect(Str.mask("tamara@email.com", "*", 5, 1)).toBe(
            "tamar*@email.com",
        );

        expect(Str.mask("maria@email.com", "*", 0, 1)).toBe("*aria@email.com");
        expect(Str.mask("maria@email.com", "*", -1, 1)).toBe("maria@email.co*");
        expect(Str.mask("maria@email.com", "*", -1)).toBe("maria@email.co*");
        expect(Str.mask("maria@email.com", "*", -15)).toBe("***************");
        expect(Str.mask("maria@email.com", "*", 0)).toBe("***************");
    });

    it("match", () => {
        expect(Str.match("/bar/", "foo bar")).toBe("bar");
        expect(Str.match("/foo (.*)/", "foo bar")).toBe("bar");
        expect(Str.match("/foo \\(.\\*)$/", "foo bar")).toBe("");
        expect(Str.match("/nothing/", "foo bar")).toBe("");
        expect(Str.match("/pattern/", "")).toBe("");
    });

    it("isMatch", () => {
        expect(Str.isMatch("/.*,.*!/", "Hello, Laravel!")).toBe(true);
        expect(Str.isMatch("/^.*$(.*)/", "Hello, Laravel!")).toBe(true);
        expect(Str.isMatch("/laravel/i", "Hello, Laravel!")).toBe(true);
        expect(Str.isMatch("/^(.*(.*(.*)))/", "Hello, Laravel!")).toBe(true);

        expect(Str.isMatch("/H.o/", "Hello, Laravel!")).toBe(false);
        expect(Str.isMatch("/^laravel!/i", "Hello, Laravel!")).toBe(false);
        expect(Str.isMatch("/laravel!(.*)/", "Hello, Laravel!")).toBe(false);
        expect(Str.isMatch("/^[a-zA-Z,!]+$/", "Hello, Laravel!")).toBe(false);

        expect(Str.isMatch(["/.*,.*!/", "/H.o/"], "Hello, Laravel!")).toBe(
            true,
        );
        expect(
            Str.isMatch(["/^laravel!/i", "/^.*$(.*)/"], "Hello, Laravel!"),
        ).toBe(true);
        expect(
            Str.isMatch(["/laravel/i", "/laravel!(.*)/"], "Hello, Laravel!"),
        ).toBe(true);
        expect(
            Str.isMatch(
                ["/^[a-zA-Z,!]+$/", "/^(.*(.*(.*)))/"],
                "Hello, Laravel!",
            ),
        ).toBe(true);
    });

    it("matchAll", () => {
        expect(Str.matchAll("/bar/", "bar foo bar")).toEqual(["bar", "bar"]);
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
    });

    it("numbers", () => {
        expect(Str.numbers("(555) 123-4567")).toBe("5551234567");
        expect(Str.numbers("L4r4v3l!")).toBe("443");
        expect(Str.numbers("Laravel!")).toBe("");

        const arrayValue = ["(555) 123-4567", "L4r4v3l", "Laravel!"];
        const arrayExpected = ["5551234567", "443", ""];
        expect(Str.numbers(arrayValue)).toEqual(arrayExpected);
    });

    it("padBoth", () => {
        expect(Str.padBoth("Al", 10, "")).toBe("Al");
        expect(Str.padBoth("Alien", 10, "_")).toBe("__Alien___");
        expect(Str.padBoth("Alien", 10)).toBe("  Alien   ");
        expect(Str.padBoth("❤MultiByte☆", 16)).toBe("  ❤MultiByte☆   ");
        expect(Str.padBoth("❤MultiByte☆", 16, "❤☆")).toBe(
            "❤☆❤MultiByte☆❤☆❤",
        );
    });

    it("padLeft", () => {
        expect(Str.padLeft("Al", 2, "")).toBe("Al");
        expect(Str.padLeft("Al", 10, "")).toBe("Al");
        expect(Str.padLeft("Alien", 10, "-=")).toBe("-=-=-Alien");
        expect(Str.padLeft("Alien", 10)).toBe("     Alien");
        expect(Str.padLeft("❤MultiByte☆", 16)).toBe("     ❤MultiByte☆");
        expect(Str.padLeft("❤MultiByte☆", 16, "❤☆")).toBe(
            "❤☆❤☆❤❤MultiByte☆",
        );
    });

    it("padRight", () => {
        expect(Str.padLeft("Al", 2, "")).toBe("Al");
        expect(Str.padLeft("Al", 10, "")).toBe("Al");
        expect(Str.padRight("Alien", 10, "-=")).toBe("Alien-=-=-");
        expect(Str.padRight("Alien", 10)).toBe("Alien     ");
        expect(Str.padRight("❤MultiByte☆", 16)).toBe("❤MultiByte☆     ");
        expect(Str.padRight("❤MultiByte☆", 16, "❤☆")).toBe(
            "❤MultiByte☆❤☆❤☆❤",
        );
    });

    it("plural", () => {
        expect(Str.plural("child")).toBe("children");
        expect(Str.plural("Laracon", 1)).toBe("Laracon");
        expect(Str.plural("Laracon", 3)).toBe("Laracons");
        // expect(Str.plural("Laracon", 1000, true)).toBe("1,000 Laracons"); // TODO when Number helper is done
    });

    it("pluralStudly", () => {
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

    it("pluralPascal", () => {
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

    it.skip("password", () => {});

    it("position", () => {
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

    it("random", () => {
        expect(Str.random()).toHaveLength(16);
        expect(Str.random(32)).toHaveLength(32);

        const randomInteger = Random.int(1, 100);
        expect(Str.random(randomInteger)).toHaveLength(randomInteger);
        expect(Str.random()).toEqual(expect.any(String));
    });

    it("createRandomStringsUsing", () => {
        Str.createRandomStringsUsing((length) => "x".repeat(length));
        expect(Str.random()).toBe("xxxxxxxxxxxxxxxx");
        expect(Str.random(32)).toBe("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
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

    it("repeat", () => {
        expect(Str.repeat("Hello", 0)).toBe("");
        expect(Str.repeat("Hello", 1)).toBe("Hello");
        expect(Str.repeat("Hello", 2)).toBe("HelloHello");
        expect(Str.repeat("a", 5)).toBe("aaaaa");
        expect(Str.repeat("", 5)).toBe("");
    });

    it("replaceArray", () => {
        expect(Str.replaceArray("?", ["foo", "bar", "baz"], "?/?/?")).toBe(
            "foo/bar/baz",
        );
        expect(Str.replaceArray("?", ["foo", "bar", "baz"], "?/?/?/?")).toBe(
            "foo/bar/baz/?",
        );
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
        expect(Str.replaceArray("?", ["foo", "bar"], "?/?")).toBe("foo/bar");
        expect(Str.replaceArray("?", { x: "foo", y: "bar" }, "?/?")).toBe(
            "foo/bar",
        );
    });

    it("toStringOr", () => {
        expect(Str.toStringOr("test", "fallback")).toBe("test");
        expect(Str.toStringOr(123, "fallback")).toBe("123");
        expect(Str.toStringOr(Array.from([]), "fallback")).toBe("fallback");
    });

    it("replace", () => {
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
            Str.replace(["?1", "?2", "?3"], ["foo", "bar", "baz"], "?1 ?2 ?3"),
        ).toBe("foo bar baz");
        expect(
            Str.replace("baz", "laravel", ["baz", "foo", "Baz"]),
        ).toStrictEqual(["laravel", "foo", "laravel"]);
        expect(
            Str.replace("baz", "laravel", ["baz", "foo", "Baz"], false),
        ).toStrictEqual(["laravel", "foo", "Baz"]);
        // expect(Str.replace(collect(['?1', '?2', '?3']), collect(['foo', 'bar', 'baz']), collect(['?1', '?2', '?3']))).toEqual(['foo', 'bar', 'baz']); // TODO when collections are implemented
    });

    it("replaceFirst", () => {
        expect(Str.replaceFirst("bar", "qux", "foobar foobar")).toBe(
            "fooqux foobar",
        );
        expect(Str.replaceFirst("bar?", "qux?", "foo/bar? foo/bar?")).toBe(
            "foo/qux? foo/bar?",
        );
        expect(Str.replaceFirst("bar", "", "foobar foobar")).toBe("foo foobar");
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

    it("replaceStart", () => {
        expect(Str.replaceStart("bar", "qux", "foobar foobar")).toBe(
            "foobar foobar",
        );
        expect(Str.replaceStart("bar?", "qux?", "foo/bar? foo/bar?")).toBe(
            "foo/bar? foo/bar?",
        );

        expect(Str.replaceStart("foo", "qux", "foobar foobar")).toBe(
            "quxbar foobar",
        );
        expect(Str.replaceStart("foo/bar?", "qux?", "foo/bar? foo/bar?")).toBe(
            "qux? foo/bar?",
        );
        expect(Str.replaceStart("foo", "", "foobar foobar")).toBe("bar foobar");
        expect(Str.replaceStart(0, "1", "0")).toBe("1");
        // Test for multibyte string support
        expect(Str.replaceStart("Jö", "xxx", "Jönköping Malmö")).toBe(
            "xxxnköping Malmö",
        );
        expect(Str.replaceStart("", "yyy", "Jönköping Malmö")).toBe(
            "Jönköping Malmö",
        );
    });

    it("replaceLast", () => {
        expect(Str.replaceLast("bar", "qux", "foobar foobar")).toBe(
            "foobar fooqux",
        );
        expect(Str.replaceLast("bar?", "qux?", "foo/bar? foo/bar?")).toBe(
            "foo/bar? foo/qux?",
        );
        expect(Str.replaceLast("bar", "", "foobar foobar")).toBe("foobar foo");
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

    it("startsWith", () => {
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

    it("replaceEnd", () => {
        expect(Str.replaceEnd("bar", "qux", "foobar foobar")).toBe(
            "foobar fooqux",
        );
        expect(Str.replaceEnd("bar?", "qux?", "foo/bar? foo/bar?")).toBe(
            "foo/bar? foo/qux?",
        );
        expect(Str.replaceEnd("bar", "", "foobar foobar")).toBe("foobar foo");
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

    it("replaceMatches", () => {
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
        expect(Str.replaceMatches("/ba(.)/", "ba$1", "foo baz baz", 1)).toBe(
            "foo baZ baz",
        );

        result = Str.replaceMatches(
            "/ba(.)/",
            (match) => "ba" + match[1]!.toUpperCase(),
            "foo baz baz bar",
            1,
        );
        expect(result).toBe("foo baZ baz bar");
    });

    it("stripTags", () => {
        expect(Str.stripTags('<p data-id="test">foo bar baz</p>')).toBe(
            "foo bar baz",
        );
        expect(
            Str.stripTags('<div id="test">Hello<br/> こんにちは</div>'),
        ).toBe("Hello こんにちは");
    });

    it("remove", () => {
        // Basic removal
        expect(Str.remove("bar", "foo bar baz")).toBe("foo  baz");
        // Multiple needles
        expect(Str.remove(["bar", "baz"], "foo bar baz qux")).toBe("foo   qux");
        // Case insensitive removal
        expect(Str.remove("BAR", "foo bAr BAR baz", false)).toBe("foo   baz");
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

    it("reverse", () => {
        expect(Str.reverse("raBooF")).toBe("FooBar");
        expect(Str.reverse("őtüzsineT")).toBe("Teniszütő");
        expect(Str.reverse("☆etyBitluM❤")).toBe("❤MultiByte☆");
    });

    it("start", () => {
        expect(Str.start("test/string", "/")).toBe("/test/string");
        expect(Str.start("/test/string", "/")).toBe("/test/string");
        expect(Str.start("//test/string", "/")).toBe("/test/string");
    });

    it("upper", () => {
        expect(Str.upper("foo bar baz")).toBe("FOO BAR BAZ");
        expect(Str.upper("foO bAr BaZ")).toBe("FOO BAR BAZ");
    });

    it("title", () => {
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

    it("headline", () => {
        expect(Str.headline("jefferson costella")).toBe("Jefferson Costella");
        expect(Str.headline("jefFErson coSTella")).toBe("Jefferson Costella");
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

    it("apa", () => {
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

        expect(Str.apa("TO KILL A MOCKINGBIRD")).toBe("To Kill a Mockingbird");
        expect(Str.apa("To Kill A Mockingbird")).toBe("To Kill a Mockingbird");
        expect(Str.apa("to kill a mockingbird")).toBe("To Kill a Mockingbird");

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

    it("ucsplit", () => {
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

    it("ulid", () => {
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
