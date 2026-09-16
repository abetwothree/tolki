<?php

/**
 * Ground truth for `Collection::search`, which `dataSearch` ports.
 *
 * `search()` runs PHP's own `===`/`==` (via `in_array`-style comparison in the
 * non-callable branch), and PHP compares arrays BY VALUE: same keys in the same
 * order with the same types for `===`, same key/value pairs after the usual
 * casts for `==`. JavaScript's `===`/`==` compare objects by reference, so an
 * array or object needle written as a literal could never match.
 *
 * Run: pnpm php:parity
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Collection;

/** Record one `Collection::search` call under a label. */
function search(string $label, string $expression, array $items, mixed $needle, bool $strict): void
{
    probe($label, $expression, fn () => (new Collection($items))->search($needle, $strict));
}

// The core defect: an array needle against a list of arrays.
search('search-array-needle-strict', "collect([[1,2],[3]])->search([1,2], true)", [[1, 2], [3]], [1, 2], true);
search('search-array-needle-loose', "collect([[1,2],[3]])->search([1,2], false)", [[1, 2], [3]], [1, 2], false);
search('search-array-needle-wrong-order-strict', "collect([[1,2]])->search([2,1], true)", [[1, 2]], [2, 1], true);
search('search-empty-array-needle-loose', "collect([[]])->search([], false)", [[]], [], false);

// Keyed needle against a keyed backing: the answer is the record's own key.
search('search-keyed-needle-strict', "collect(['x'=>['a'=>1]])->search(['a'=>1], true)", ['x' => ['a' => 1]], ['a' => 1], true);
search('search-keyed-needle-loose', "collect(['x'=>['a'=>1]])->search(['a'=>1], false)", ['x' => ['a' => 1]], ['a' => 1], false);

// `===` on arrays is key-ORDER sensitive; `==` is not. This is the pair that
// separates `strictEqual` from `looseEqual` in @tolki/utils.
search('search-reordered-keys-strict', "collect([['b'=>2,'a'=>1]])->search(['a'=>1,'b'=>2], true)", [['b' => 2, 'a' => 1]], ['a' => 1, 'b' => 2], true);
search('search-reordered-keys-loose', "collect([['b'=>2,'a'=>1]])->search(['a'=>1,'b'=>2], false)", [['b' => 2, 'a' => 1]], ['a' => 1, 'b' => 2], false);

// `===` on arrays compares element TYPES too; `==` casts them.
search('search-numeric-string-element-strict', "collect([[1,2]])->search([1,'2'], true)", [[1, 2]], [1, '2'], true);
search('search-numeric-string-element-loose', "collect([[1,2]])->search([1,'2'], false)", [[1, 2]], [1, '2'], false);

// Scalar needles, the cells the port already agreed on, kept as a control.
search('search-int-needle-on-numeric-string-strict', "collect(['1',2])->search(1, true)", ['1', 2], 1, true);
search('search-int-needle-on-numeric-string-loose', "collect(['1',2])->search(1, false)", ['1', 2], 1, false);
search('search-string-needle-strict', "collect([0,'a'])->search('a', true)", [0, 'a'], 'a', true);
search('search-string-needle-loose', "collect([0,'a'])->search('a', false)", [0, 'a'], 'a', false);

// PHP's `0 == null` is true, which JavaScript's `==` denies.
search('search-null-needle-on-zero-strict', "collect([0])->search(null, true)", [0], null, true);
search('search-null-needle-on-zero-loose', "collect([0])->search(null, false)", [0], null, false);

// `before()` and `after()` call `search()` first, so they inherit its rule.
probe('before-array-needle', "collect([[0],[1,2]])->before([1,2])", fn () => (new Collection([[0], [1, 2]]))->before([1, 2]));
probe('after-array-needle', "collect([[1,2],[9]])->after([1,2])", fn () => (new Collection([[1, 2], [9]]))->after([1, 2]));
probe('before-keyed-needle', "collect(['a'=>['k'=>0],'b'=>['k'=>1]])->before(['k'=>1])", fn () => (new Collection(['a' => ['k' => 0], 'b' => ['k' => 1]]))->before(['k' => 1]));
probe('after-keyed-needle', "collect(['a'=>['k'=>0],'b'=>['k'=>1]])->after(['k'=>0])", fn () => (new Collection(['a' => ['k' => 0], 'b' => ['k' => 1]]))->after(['k' => 0]));

emit();
