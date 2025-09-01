import { describe, expect, it } from "vitest";
import { Str, Stringable } from "@laravel-js-support/str";

describe("Str tests", () => {
    it('of tests', () => {
        expect(Str.of("ééé hannah")).toBeInstanceOf(Stringable);
    });

    it("after tests", () => {
        expect(Str.after("hannah", "han")).toBe("nah");
        expect(Str.after("hannah", "n")).toBe("nah");
        expect(Str.after("ééé hannah", "han")).toBe("nah");
        expect(Str.after("hannah", "xxxx")).toBe("hannah");
        expect(Str.after("hannah", "")).toBe("hannah");
        expect(Str.after("han0nah", "0")).toBe("nah");
        expect(Str.after("han0nah", 0)).toBe("nah");
        expect(Str.after("han2nah", 2)).toBe("nah");
    });

    it("afterLast tests", () => {
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

    it('ascii tests', () => {
        expect(Str.ascii("@")).toBe("@");
        expect(Str.ascii("ü")).toBe("u");
        expect(Str.ascii("")).toBe("");
        expect(Str.ascii("a!2ë")).toBe("a!2e");

        expect(Str.ascii('х Х щ Щ ъ Ъ иа йо')).toBe("h H shch Shch   ia yo");
        expect(Str.ascii('ä ö ü Ä Ö Ü')).toBe('a o u A O U');

        expect(Str.ascii("ééé hannah")).toBe("eee hannah");
        expect(Str.ascii("Héllo Wörld")).toBe("Hello World");
        expect(Str.ascii("Füße")).toBe("Fusse");
        expect(Str.ascii("Straße")).toBe("Strasse");
    });

    it('transliterate tests', () => {
        [
            ['ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ', 'abcdefghijklmnopqrstuvwxyz'],
            ['⓪①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳', '01234567891011121314151617181920'],
            ['⓵⓶⓷⓸⓹⓺⓻⓼⓽⓾', '12345678910'],
            ['⓿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴', '011121314151617181920'],
            ['ⓣⓔⓢⓣ@ⓛⓐⓡⓐⓥⓔⓛ.ⓒⓞⓜ', 'test@laravel.com'],
            ['🎂', ':birthday:'],
            ['abcdefghijklmnopqrstuvwxyz', 'abcdefghijklmnopqrstuvwxyz'],
            ['0123456789', '0123456789'],
        ].forEach(([input, expected]) => {
            expect(Str.transliterate(String(input))).toBe(expected);
        });
    })

    it('before tests', () => {
        expect(Str.before('hannah', 'nah')).toBe('han');
        expect(Str.before('hannah', 'n')).toBe('ha');
        expect(Str.before('ééé hannah', 'han')).toBe('ééé ');
        expect(Str.before('hannah', 'xxxx')).toBe('hannah');
        expect(Str.before('hannah', '')).toBe('hannah');
        expect(Str.before('han0nah', '0')).toBe('han');
        expect(Str.before('han0nah', 0)).toBe('han');
        expect(Str.before('han2nah', 2)).toBe('han');
        expect(Str.before('', '')).toBe('');
        expect(Str.before('', 'a')).toBe('');
        expect(Str.before('a', 'a')).toBe('');
        expect(Str.before('foo@bar.com', '@')).toBe('foo');
        expect(Str.before('foo@@bar.com', '@')).toBe('foo');
        expect(Str.before('@foo@bar.com', '@')).toBe('');
    })
});
