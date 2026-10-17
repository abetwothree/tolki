<?php

/**
 * Ground truth for Str::trim().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

// Str::trim() and Str::rtrim() stay linear over a long interior whitespace run (laravel/framework 44836016d8).
$whitespace = str_repeat(" \u{200B}\t", 20000);
probe('trim-long-interior-run', 'StrTest::testTrimAndRtrimHandleLongInteriorWhitespaceRuns: its two long comparisons as booleans, its four short results as they are', fn () => [
    'trim' => Str::trim("{$whitespace}[{$whitespace}x{$whitespace}") === "[{$whitespace}x",
    'rtrim' => Str::rtrim("{$whitespace}[{$whitespace}x{$whitespace}") === "{$whitespace}[{$whitespace}x",
    'trim-run' => Str::trim($whitespace),
    'rtrim-run' => Str::rtrim($whitespace),
    'trim-mixed' => Str::trim(" a b c\u{00A0}\u{FEFF}\n"),
    'rtrim-mixed' => Str::rtrim(" a  b \u{3000}\r\n"),
]);
$letters = str_repeat('x', 120000);
probe('trim-charlist-long-interior-run', "Str::trim(\$x.'['.\$x.'y'.\$x, 'x') === '['.\$x.'y' for \$x = str_repeat('x', 120000)", fn () => Str::trim("{$letters}[{$letters}y{$letters}", 'x') === "[{$letters}y");

// What Str::trim(), ltrim() and rtrim() answer, which this port's own tests had pinned otherwise.
probe('trim-default-characters', 'every code point Str::trim() removes by default, as hex ranges; ltrim and rtrim remove the same ones', function () {
    $removed = [];

    for ($codePoint = 0; $codePoint <= 0x10FFFF; $codePoint++) {
        // Surrogates are not characters, and mb_chr() refuses them.
        if (($codePoint < 0xD800 || $codePoint > 0xDFFF) && Str::trim(mb_chr($codePoint, 'UTF-8')) === '') {
            $removed[] = $codePoint;
        }
    }

    $sides = array_filter($removed, fn (int $codePoint) => Str::ltrim(mb_chr($codePoint, 'UTF-8')) === '' && Str::rtrim(mb_chr($codePoint, 'UTF-8')) === '');

    return ['count' => count($removed), 'ranges' => codePointRanges($removed), 'ltrim-and-rtrim-agree' => count($sides) === count($removed)];
});
probe('trim-cases', 'Str::trim($value, $charlist) for each [$value, $charlist], a null charlist being the default, recorded as [$value, $charlist, result]', fn () => trimmed('trim', [
    [' foo bar ', ''], ['  hello  ', ''], [' foo bar ', ' '], ['-foo  bar_', '-_'],
    ["\n                foo bar\n            ", null], ["\n                foo\n                bar\n            ", null],
    ["\n    hello\n    world\n", null], ["    line1\nline2\n", null], ["  first\n  second\n  third\n", null], ["   \n   \n   ", null], ["hello\nworld", null],
    ["\u{0085}a\u{0085}", null], ['-^a^-', '^-'], ['\\a\\', '\\'], ['[[[hello]]]', '[]'], ['😀a😀', '😀'], ['你好你好hello你好你好', '你好'],
    ["\u{1D159}a\u{E0020}\u{1D173}", null],
]));
probe('trim-charlist-range-not-ported', "Str::trim('abcxcba', 'a..c'): PHP reads a..c as the range a to c", fn () => Str::trim('abcxcba', 'a..c'));

emit();
