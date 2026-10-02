<?php

/**
 * Ground truth for the Laravel v13.34 (+ unreleased 13.x) stub sync.
 *
 * Collection::shift() on an empty collection, lazy collections inside collapse(), collapseWithKeys() and flatten(),
 * and Str's finish(), start(), trim(), ltrim(), rtrim(), limit() and excerpt().
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

class Task33Basket extends Collection {}

/**
 * Encode $value so JSON keeps what it is: a LazyCollection as ['lazy' => items], a Collection as
 * ['collection' => items], and a keyed array as a list of [key, value] pairs, since a JSON object loses key order.
 */
function shown(mixed $value): mixed
{
    if ($value instanceof LazyCollection) {
        return ['lazy' => shown($value->all())];
    }

    if ($value instanceof Collection) {
        return ['collection' => shown($value->all())];
    }

    if (! is_array($value)) {
        return $value;
    }

    if (array_is_list($value)) {
        return array_map(shown(...), $value);
    }

    $out = [];

    foreach ($value as $key => $item) {
        $out[] = [$key, shown($item)];
    }

    return $out;
}

/** What shift(...$count) answers on a collection of $items, and what the collection holds after. */
function shifted(mixed $items, mixed ...$count): array
{
    $collection = new Collection($items);

    return ['returned' => shown($collection->shift(...$count)), 'left' => $collection->all()];
}

/** Run each [$value, $charlist] case through Str::$method, recording [$value, $charlist, result]. */
function trimmed(string $method, array $cases): array
{
    return array_map(
        fn (array $case) => [...$case, $case[1] === null ? Str::$method($case[0]) : Str::$method(...$case)],
        $cases,
    );
}

/** Collapse a sorted list of code points into "XXXX" and "XXXX-YYYY" hex ranges. */
function codePointRanges(array $codePoints): array
{
    $ranges = [];

    foreach ($codePoints as $codePoint) {
        $last = array_key_last($ranges);

        if ($last !== null && $ranges[$last][1] === $codePoint - 1) {
            $ranges[$last][1] = $codePoint;
        } else {
            $ranges[] = [$codePoint, $codePoint];
        }
    }

    return array_map(
        fn (array $range) => $range[0] === $range[1] ? sprintf('%04X', $range[0]) : sprintf('%04X-%04X', ...$range),
        $ranges,
    );
}

// shift($count) on an empty collection answers an empty collection unless $count is 1 (laravel/framework#61723).
$counts = ['0' => 0, '1' => 1, '2' => 2, '3' => 3, '0.5' => 0.5, '1.5' => 1.5, '2.5' => 2.5, 'NAN' => NAN, 'INF' => INF];
probe('shift-empty-counts', 'shift() and shift($count) on collect([]) for 0, 1, 2, 3, 0.5, 1.5, 2.5, NAN and INF: what it returns and what is left', fn () => ['none' => shifted([])] + array_map(fn ($count) => shifted([], $count), $counts));
probe('shift-null-backed-counts', 'shift(), shift(0) and shift(2) on new Collection(null)', fn () => ['none' => shifted(null), '0' => shifted(null, 0), '2' => shifted(null, 2)]);
probe('shift-empty-subclass', 'get_class() of shift(2) and shift(0) on an empty subclass of Collection', fn () => ['2' => get_class((new Task33Basket([]))->shift(2)), '0' => get_class((new Task33Basket([]))->shift(0))]);
probe('shift-drained-then-again', '$c = collect([1, 2, 3]); $c->shift(2) three times, then $c->shift()', function () {
    $c = new Collection([1, 2, 3]);

    return [shown($c->shift(2)), shown($c->shift(2)), shown($c->shift(2)), $c->shift()];
});

// Arr::collapse() and Arr::flatten() read any Enumerable through all(), a LazyCollection too (laravel/framework#61811).
probe('collapse-lazy-list', 'Arr::collapse([[1], new LazyCollection([2, 3]), collect([4])])', fn () => Arr::collapse([[1], new LazyCollection([2, 3]), collect([4])]));
probe('collapse-lazy-nested-kept', 'Arr::collapse([new LazyCollection([[1, 2], new LazyCollection([3])])])', fn () => shown(Arr::collapse([new LazyCollection([[1, 2], new LazyCollection([3])])])));
probe('collapse-lazy-assoc-outer', "Arr::collapse(['x' => [1], 'y' => new LazyCollection([2, 3]), 'z' => collect([4])])", fn () => Arr::collapse(['x' => [1], 'y' => new LazyCollection([2, 3]), 'z' => collect([4])]));
probe('collapse-lazy-keyed', "Arr::collapse(['first' => ['a' => 1], 'second' => new LazyCollection(['b' => 2, 'a' => 3])])", fn () => shown(Arr::collapse(['first' => ['a' => 1], 'second' => new LazyCollection(['b' => 2, 'a' => 3])])));
probe('flatten-lazy-list', "Arr::flatten([new LazyCollection(['#foo', ['#bar']]), ['#baz', new LazyCollection(['#zap'])]])", fn () => Arr::flatten([new LazyCollection(['#foo', ['#bar']]), ['#baz', new LazyCollection(['#zap'])]]));
probe('flatten-lazy-depth-1', 'Arr::flatten([new LazyCollection([1, [2, [3]]]), [4, new LazyCollection([5])]], 1)', fn () => shown(Arr::flatten([new LazyCollection([1, [2, [3]]]), [4, new LazyCollection([5])]], 1)));
probe('flatten-lazy-depth-2', 'Arr::flatten([new LazyCollection([1, [2, [3]]]), [4, new LazyCollection([5, [6]])]], 2)', fn () => shown(Arr::flatten([new LazyCollection([1, [2, [3]]]), [4, new LazyCollection([5, [6]])]], 2)));
probe('flatten-lazy-assoc', "Arr::flatten(['a' => new LazyCollection(['x' => '#foo', 'y' => ['#bar']]), 'b' => ['c' => '#baz', 'd' => new LazyCollection(['#zap'])]])", fn () => Arr::flatten(['a' => new LazyCollection(['x' => '#foo', 'y' => ['#bar']]), 'b' => ['c' => '#baz', 'd' => new LazyCollection(['#zap'])]]));

// Collection::collapse(), collapseWithKeys() and flatten() over mixed collection types (laravel/framework#61811).
probe('collapse-mixed-collection-types', '(new Collection([new Collection([1, 2]), new LazyCollection([3, 4]), [5]]))->collapse()->all()', fn () => (new Collection([new Collection([1, 2]), new LazyCollection([3, 4]), [5]]))->collapse()->all());
probe('collapseWithKeys-mixed-collection-types', "(new Collection([new Collection(['a' => 1, 'b' => 2]), new LazyCollection(['b' => 3, 'c' => 4])]))->collapseWithKeys()", fn () => shown((new Collection([new Collection(['a' => 1, 'b' => 2]), new LazyCollection(['b' => 3, 'c' => 4])]))->collapseWithKeys()->all()));
probe('flatten-mixed-collection-types', "(new Collection([new Collection(['#foo', new LazyCollection(['#bar'])]), new LazyCollection(['#baz', new Collection(['#zap'])])]))->flatten()->all()", fn () => (new Collection([new Collection(['#foo', new LazyCollection(['#bar'])]), new LazyCollection(['#baz', new Collection(['#zap'])])]))->flatten()->all());
probe('collapseWithKeys-lazy-lists', '(new Collection([new LazyCollection([1, 2]), [3]]))->collapseWithKeys()', fn () => shown((new Collection([new LazyCollection([1, 2]), [3]]))->collapseWithKeys()->all()));
probe('collapseWithKeys-lazy-only', "(new Collection([new LazyCollection(['a' => 1]), new LazyCollection(['a' => 2, 'b' => 3])]))->collapseWithKeys()", fn () => shown((new Collection([new LazyCollection(['a' => 1]), new LazyCollection(['a' => 2, 'b' => 3])]))->collapseWithKeys()->all()));
probe('collapseWithKeys-lazy-then-array', "(new Collection([new LazyCollection(['a' => 1, 'b' => 2]), ['b' => 9]]))->collapseWithKeys()", fn () => shown((new Collection([new LazyCollection(['a' => 1, 'b' => 2]), ['b' => 9]]))->collapseWithKeys()->all()));
probe('collapseWithKeys-lazy-int-keys', "(new Collection([[5 => 'a'], new LazyCollection([5 => 'b', 6 => 'c'])]))->collapseWithKeys()", fn () => shown((new Collection([[5 => 'a'], new LazyCollection([5 => 'b', 6 => 'c'])]))->collapseWithKeys()->all()));
probe('collapseWithKeys-array-item-all-member-is-data', "(new Collection([['all' => fn () => ['z' => 9], 'b' => 2]]))->collapseWithKeys()->keys()->all()", fn () => (new Collection([['all' => fn () => ['z' => 9], 'b' => 2]]))->collapseWithKeys()->keys()->all());
probe('collapseWithKeys-null-item', "(new Collection([null, ['a' => 1]]))->collapseWithKeys(), then (new Collection([null]))->collapseWithKeys()", fn () => [shown((new Collection([null, ['a' => 1]]))->collapseWithKeys()->all()), (new Collection([null]))->collapseWithKeys()->all()]);

// Str::finish() and Str::start() return early for an empty or absent cap (laravel/framework#61803).
$slashes = str_repeat('/', 100000);
probe('finish-cases', 'Str::finish($value, $cap) for each [$value, $cap], recorded as [$value, $cap, result]', fn () => array_map(fn (array $pair) => [...$pair, Str::finish(...$pair)], [
    ['ab', 'bc'], ['abbcbc', 'bc'], ['abcbbcbc', 'bc'], ['test/string', '/'], ['test/string/', '/'], ['test/string//', '/'], ['test/string', ''], ['', ''],
    ['', '/'], ['///', '/'], ['a.b..', '.'], ['a$$', '$'], ['x[[', '['], ['x\\\\', '\\'], ['añññ', 'ñ'], ['😀😀', '😀'], ['a', 'abc'], ['a/b/c', '/'],
    ['aaa', 'aa'], ['aaaa', 'aa'], ['aaaaa', 'aa'], ['abab', 'ab'],
]));
probe('finish-long-interior-run', "Str::finish(str_repeat('/', 100000).'x', '/') === str_repeat('/', 100000).'x/'", fn () => Str::finish($slashes . 'x', '/') === $slashes . 'x/');
probe('finish-long-interior-run-then-caps', "Str::finish(str_repeat('/', 100000).'x//', '/'): PCRE gives up on the run, so only the cap comes back", fn () => Str::finish($slashes . 'x//', '/'));
probe('start-cases', 'Str::start($value, $prefix) for each [$value, $prefix], recorded as [$value, $prefix, result]', fn () => array_map(fn (array $pair) => [...$pair, Str::start(...$pair)], [
    ['test/string', '/'], ['/test/string', '/'], ['//test/string', '/'], ['test/string', ''], ['', ''],
    ['', '/'], ['///', '/'], ['..a.b', '.'], ['$$a', '$'], ['[[x', '['], ['ñññz', 'ñ'], ['😀😀x', '😀'], ['a', 'abc'],
    ['aaa', 'aa'], ['aaaa', 'aa'], ['aaaaa', 'aa'], ['abab', 'ab'],
]));
probe('start-long-run', "Str::start('x'.str_repeat('/', 100000), '/') === '/x'.str_repeat('/', 100000)", fn () => Str::start('x' . $slashes, '/') === '/x' . $slashes);
probe('start-long-leading-run', "Str::start(str_repeat('/', 100000).'x', '/'): PCRE gives up on the run, so only the prefix comes back", fn () => Str::start($slashes . 'x', '/'));

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
probe('rtrim-charlist-long-interior-run', "Str::rtrim(\$x.'['.\$x.'y'.\$x, 'x') === \$x.'['.\$x.'y' for \$x = str_repeat('x', 120000)", fn () => Str::rtrim("{$letters}[{$letters}y{$letters}", 'x') === "{$letters}[{$letters}y");
$spaces = str_repeat(' ', 100000);
probe('limit-long-interior-run', "Str::limit() past a run of 100000 spaces: plain === \$s.'x...', and with preserveWords === 'x'.\$s.'x...'", fn () => [
    'plain' => Str::limit("{$spaces}x{$spaces}x", 200001) === "{$spaces}x...",
    'preserve-words' => Str::limit("{$spaces}x{$spaces}x y", 200001, '...', true) === "x{$spaces}x...",
]);

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
probe('ltrim-cases', 'Str::ltrim($value, $charlist) for each [$value, $charlist], a null charlist being the default, recorded as [$value, $charlist, result]', fn () => trimmed('ltrim', [
    ['  hello', ''], ['  hello ', null], ['  hello  ', null], ['  hello   ', null], ["  hello \n", null], ["  hello \t", null],
    ["\u{0085}a\u{0085}", null], ["\n foo bar \n", null], ["\0 foo bar \0", null],
]));
probe('rtrim-cases', 'Str::rtrim($value, $charlist) for each [$value, $charlist], a null charlist being the default, recorded as [$value, $charlist, result]', fn () => trimmed('rtrim', [
    ['hello  ', ''], ["line1\nline2   ", null], ["line1\n    line2\n        ", null], ["hello\n    world\n      ", null], ["line1\n\nline2\n   ", null],
    ["\u{0085}a\u{0085}", null], ["a\u{1D159}\u{E0020}", null], ['a😀😀b😀', '😀'], ['a]]', ']'],
]));
probe('trim-charlist-range-not-ported', "Str::trim('abcxcba', 'a..c'): PHP reads a..c as the range a to c", fn () => Str::trim('abcxcba', 'a..c'));
probe('excerpt-two-spaces-before-phrase', "Str::excerpt('This is  my name', 'my'), then with ['radius' => 3]", fn () => [Str::excerpt('This is  my name', 'my'), Str::excerpt('This is  my name', 'my', ['radius' => 3])]);

emit();
