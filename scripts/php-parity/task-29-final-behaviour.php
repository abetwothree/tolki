<?php

/**
 * Ground truth for the behaviour defects the whole-branch review found.
 *
 * Five groups:
 *  1. A Traversable backing, which `Collection` materializes through `Arr::from`, so the
 *     JS Set and generator that stand for one must answer what the list answers.
 *  2. `Arr::sortRecursive` branches on `array_is_list`: a LIST sorts by value, anything
 *     else by key. A JS record whose keys are exactly 0..n-1 spells a PHP list.
 *  3. `Arr::add` asks `is_null(Arr::get(...))`, not whether the key exists.
 *  4. `Arr::set` explodes on ".", so an EMPTY segment is a real array key.
 *  5. `Arr::query` is `http_build_query(..., PHP_QUERY_RFC3986)`, which percent-encodes
 *     brackets and the five characters `encodeURIComponent` leaves alone.
 *
 * Run: pnpm php:parity
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- 1. Traversable backing: what the JS Set and generator have to match.
/** The Traversable every probe below starts from, equal to the list [1, 2]. */
function traversable(): Generator
{
    yield 1;
    yield 2;
}

probe('count-traversable-backing', "collect(gen(1,2))->count()", fn () => (new Collection(traversable()))->count());
probe('mapWithKeys-traversable-backing', "collect(gen(1,2))->mapWithKeys(fn (\$v, \$k) => [\$k => \$v])", fn () => (new Collection(traversable()))->mapWithKeys(fn ($value, $key) => [$key => $value])->all());
probe('search-traversable-backing', "collect(gen(1,2))->search(2)", fn () => (new Collection(traversable()))->search(2));
probe('before-traversable-backing', "collect(gen(1,2))->before(2)", fn () => (new Collection(traversable()))->before(2));
probe('after-traversable-backing', "collect(gen(1,2))->after(1)", fn () => (new Collection(traversable()))->after(1));
probe('replace-traversable-backing', "collect(gen(1,2))->replace([0 => 9])", fn () => (new Collection(traversable()))->replace([0 => 9])->all());
probe('replaceRecursive-traversable-backing', "collect(gen(1,2))->replaceRecursive([0 => 9])", fn () => (new Collection(traversable()))->replaceRecursive([0 => 9])->all());

// ---- 2. sortRecursive's array_is_list branch.
probe('sortRecursive-list-of-ints', 'Arr::sortRecursive([3,1,2])', fn () => Arr::sortRecursive([3, 1, 2]));
probe('sortRecursive-explicit-zero-based-keys', 'Arr::sortRecursive([0=>3,1=>1,2=>2])', fn () => Arr::sortRecursive([0 => 3, 1 => 1, 2 => 2]));
probe('sortRecursiveDesc-explicit-zero-based-keys', 'Arr::sortRecursiveDesc([0=>3,1=>1,2=>2])', fn () => Arr::sortRecursiveDesc([0 => 3, 1 => 1, 2 => 2]));
probe('sortRecursive-nested-lists', 'Arr::sortRecursive([[3,1,2],[9,8]])', fn () => Arr::sortRecursive([[3, 1, 2], [9, 8]]));
probe('sortRecursiveDesc-nested-lists', 'Arr::sortRecursiveDesc([[3,1,2],[9,8]])', fn () => Arr::sortRecursiveDesc([[3, 1, 2], [9, 8]]));
probe('sortRecursive-string-keys-stay-ksorted', "Arr::sortRecursive(['b'=>2,'a'=>1])", fn () => Arr::sortRecursive(['b' => 2, 'a' => 1]));
probe('sortRecursiveDesc-string-keys-stay-krsorted', "Arr::sortRecursiveDesc(['b'=>2,'a'=>1])", fn () => Arr::sortRecursiveDesc(['b' => 2, 'a' => 1]));
probe('sortRecursive-gapped-int-keys-stay-ksorted', 'Arr::sortRecursive([0=>3,2=>1])', fn () => Arr::sortRecursive([0 => 3, 2 => 1]));

// The ArrTest literal, respelled the way JavaScript can hold it: a plain object always
// enumerates integer keys ascending, so `[2=>'a',1=>'b',0=>'c']` arrives as `[0=>'c',...]`,
// which IS a list, and sorts by value rather than by key.
$srJs = [
    'users' => [
        ['name' => 'joe', 'mail' => 'joe@example.com', 'numbers' => [2, 1, 0]],
        ['name' => 'jane', 'age' => 25],
    ],
    'repositories' => [['id' => 1], ['id' => 0]],
    20 => [2, 1, 0],
    30 => [0 => 'c', 1 => 'b', 2 => 'a'],
];
probe('sortRecursive-literal-js-spelling', 'Arr::sortRecursive($srJs)', fn () => Arr::sortRecursive($srJs));

// ---- 3. Arr::add against a key that already holds null.
probe('add-over-null-list-value', 'Arr::add([null], 0, 9)', fn () => Arr::add([null], 0, 9));
probe('add-over-null-keyed-value', "Arr::add(['a'=>null], 'a', 9)", fn () => Arr::add(['a' => null], 'a', 9));
probe('add-over-null-nested-list', "Arr::add([['b'=>null]], '0.b', 9)", fn () => Arr::add([['b' => null]], '0.b', 9));
probe('add-over-null-nested-keyed', "Arr::add(['a'=>['b'=>null]], 'a.b', 9)", fn () => Arr::add(['a' => ['b' => null]], 'a.b', 9));
probe('add-leaves-false-alone', 'Arr::add([false], 0, 9)', fn () => Arr::add([false], 0, 9));
probe('add-leaves-zero-alone', "Arr::add(['a'=>0], 'a', 9)", fn () => Arr::add(['a' => 0], 'a', 9));

// ---- 4. An empty dot-path segment.
/** Run one `Arr::set` on a fresh empty array and record what it wrote. */
function setOn(string $label, string $expression, string $key): void
{
    probe($label, $expression, function () use ($key) {
        $target = [];
        Arr::set($target, $key, 9);

        return $target;
    });
}

setOn('set-interior-empty-segment', "Arr::set(\$a, 'a..b', 9)", 'a..b');
setOn('set-leading-empty-segment', "Arr::set(\$a, '.a', 9)", '.a');
setOn('set-trailing-empty-segment', "Arr::set(\$a, 'a.', 9)", 'a.');
setOn('set-only-empty-segments', "Arr::set(\$a, '..', 9)", '..');
setOn('set-empty-key', "Arr::set(\$a, '', 9)", '');
probe('get-through-empty-segment', "Arr::get(['a'=>[''=>['b'=>7]]], 'a..b')", fn () => Arr::get(['a' => ['' => ['b' => 7]]], 'a..b'));

// ---- 5. Arr::query's RFC3986 encoding.
probe('query-nested-key-brackets', "Arr::query(['a'=>['b'=>1]])", fn () => Arr::query(['a' => ['b' => 1]]));
probe('query-list-value-brackets', "Arr::query(['a'=>[1,2]])", fn () => Arr::query(['a' => [1, 2]]));
probe('query-deep-nested-brackets', "Arr::query(['a'=>['b'=>['c'=>1]]])", fn () => Arr::query(['a' => ['b' => ['c' => 1]]]));
probe('query-bracket-inside-a-key', "Arr::query(['a[b]'=>1])", fn () => Arr::query(['a[b]' => 1]));
probe('query-rfc3986-sub-delimiters', "Arr::query([\"k!'()*~-._\" => \"v!'()*~-._\"])", fn () => Arr::query(["k!'()*~-._" => "v!'()*~-._"]));
probe('query-space-and-plus', "Arr::query(['a b'=>'c d','f+o'=>'b&r'])", fn () => Arr::query(['a b' => 'c d', 'f+o' => 'b&r']));
probe('query-flat-list', 'Arr::query([1,2,3])', fn () => Arr::query([1, 2, 3]));

emit();
