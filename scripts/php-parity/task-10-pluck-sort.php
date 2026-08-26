<?php

declare(strict_types=1);

// The "missing key field vs explicit null key" probe below deliberately
// triggers PHP 8.1+'s "Using null as an array offset is deprecated"
// notice (Arr.php:823's `$results[$itemKey] = ...` with $itemKey === null)
// - that's the exact behaviour under test. Silencing E_DEPRECATED keeps
// the notice off stdout, where it would otherwise corrupt emit()'s JSON.
error_reporting(E_ALL & ~E_DEPRECATED);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;

probe('Arr::pluck wildcard path', 'Arr::pluck($d, "users.*.first")', function () {
    $d = [
        'a' => ['account' => 'a', 'users' => [['first' => 'taylor']]],
        'b' => ['account' => 'b', 'users' => [['first' => 'abigail'], ['first' => 'dayle']]],
    ];

    return Arr::pluck($d, 'users.*.first');
});

probe('Arr::pluck wildcard + key', 'Arr::pluck($d, "users.*.first", "account")', function () {
    $d = [
        'a' => ['account' => 'a', 'users' => [['first' => 'taylor']]],
        'b' => ['account' => 'b', 'users' => [['first' => 'abigail'], ['first' => 'dayle']]],
    ];

    return Arr::pluck($d, 'users.*.first', 'account');
});

probe('Arr::pluck array path', 'Arr::pluck($d, ["developer","name"])', function () {
    $d = ['a' => ['developer' => ['name' => 'Taylor']], 'b' => ['developer' => ['name' => 'Abigail']]];

    return Arr::pluck($d, ['developer', 'name']);
});

probe('Arr::pluck null value keeps the item', 'Arr::pluck($d, null, "name")', function () {
    return Arr::pluck(['a' => ['name' => 'Taylor', 'role' => 'dev']], null, 'name');
});

probe('Arr::pluck missing path', 'Arr::pluck($d, "foo")', function () {
    return Arr::pluck(['a' => ['name' => 'x'], 'b' => ['name' => 'y']], 'foo');
});

probe('Arr::sort multi-key', 'Arr::sort($u, ["name","age","meta.key"])', function () {
    $u = [
        'd' => ['name' => 'Item', 'age' => 10, 'meta' => ['key' => 3]],
        'a' => ['name' => 'Item', 'age' => 2,  'meta' => ['key' => 1]],
        'c' => ['name' => 'Apple','age' => 10, 'meta' => ['key' => 2]],
    ];

    return array_values(Arr::sort($u, ['name', 'age', 'meta.key']));
});

probe('Arr::sortDesc numeric comparison', 'Arr::sortDesc([1,10,9])', function () {
    return array_values(Arr::sortDesc([1, 10, 9]));
});

// The four direction forms. Collection.php:1638-1640 is
//   match (Arr::get($comparison, 1, true)) {
//       true, 'asc',  SortDirection::Ascending  => Ascending,
//       false, 'desc', SortDirection::Descending => Descending,
//       default => Descending, // for backwards compatibility
//   }
// so `true` means ASCENDING, an omitted direction defaults to `true`, and
// anything unrecognized falls through to DESCENDING.
probe('direction tuple [age,false] — descending', 'Arr::sort($u, ["name",["age",false]])', function () {
    $u = ['a' => ['name' => 'Item', 'age' => 2], 'b' => ['name' => 'Item', 'age' => 10]];

    return array_values(Arr::sort($u, ['name', ['age', false]]));
});

probe('direction tuple [age,true] — ascending', 'Arr::sort($u, ["name",["age",true]])', function () {
    $u = ['a' => ['name' => 'Item', 'age' => 10], 'b' => ['name' => 'Item', 'age' => 2]];

    return array_values(Arr::sort($u, ['name', ['age', true]]));
});

probe('direction tuple [age,"desc"] — string form', 'Arr::sort($u, [["age","desc"]])', function () {
    return array_values(Arr::sort(['a' => ['age' => 2], 'b' => ['age' => 10]], [['age', 'desc']]));
});

probe('direction tuple [age] — omitted defaults to ascending', 'Arr::sort($u, [["age"]])', function () {
    return array_values(Arr::sort(['a' => ['age' => 10], 'b' => ['age' => 2]], [['age']]));
});

probe('direction tuple [age,"BOGUS"] — default arm is DESCENDING', 'Arr::sort($u, [["age","BOGUS"]])', function () {
    return array_values(Arr::sort(['a' => ['age' => 2], 'b' => ['age' => 10]], [['age', 'BOGUS']]));
});

// Supplementary probe, added beyond the brief's given list: obj.spec.ts has
// an existing test ("should handle missing key field (itemKey is
// null/undefined)") asserting a *JS-native* coercion quirk (a null itemKey
// key-cast to the string "null") rather than PHP's actual behaviour. Since
// Task 10 touches this exact code path (pluck's key-casting branch), this
// probe pins the real PHP result so the existing test can be corrected
// against ground truth instead of against its own prior (wrong) assumption.
probe('Arr::pluck — missing key field vs explicit null key', 'Arr::pluck($u, "name", "id")', function () {
    $u = [
        'user1' => ['name' => 'John'],       // no 'id' field
        'user2' => ['name' => 'Jane', 'id' => null], // 'id' present but null
    ];

    return Arr::pluck($u, 'name', 'id');
});

// ---------------------------------------------------------------------
// Review round 1 additions: pin values the arr/collection review found
// diverging from PHP.
// ---------------------------------------------------------------------

// Critical 1: data_get()'s "*" arm gates on is_iterable(), true for a plain
// (associative) PHP array. Both a keyed-by-string outer array and a plain
// list outer array should wildcard-expand an associative inner value the
// same way - there is only one Arr::pluck in PHP, so "array-backed" vs
// "object-backed" is purely a JS-side distinction that must not change the
// result.
probe('Arr::pluck wildcard over an associative (object-shaped) target, string-keyed outer', 'Arr::pluck(["a"=>$shape], "meta.*.v")', function () {
    $shape = ['meta' => ['x' => ['v' => 1], 'y' => ['v' => 2]]];

    return Arr::pluck(['a' => $shape], 'meta.*.v');
});

probe('Arr::pluck wildcard over an associative (object-shaped) target, list outer', 'Arr::pluck([$shape], "meta.*.v")', function () {
    $shape = ['meta' => ['x' => ['v' => 1], 'y' => ['v' => 2]]];

    return Arr::pluck([$shape], 'meta.*.v');
});

// Critical 2: Collection::sortByMany's direction match-arm compares against
// the SortDirection enum and booleans; the string forms 'asc'/'desc' and any
// unrecognized value must still route through the same match arms.
probe('Collection::sortBy — string "desc" direction sorts descending', 'sortBy([["age","desc"]])', function () {
    $c = new \Illuminate\Support\Collection(['a' => ['age' => 2], 'b' => ['age' => 10]]);

    return $c->sortBy([['age', 'desc']])->values()->all();
});

probe('Collection::sortBy — unrecognized direction sorts descending (default arm)', 'sortBy([["age","BOGUS"]])', function () {
    $c = new \Illuminate\Support\Collection(['a' => ['age' => 2], 'b' => ['age' => 10]]);

    return $c->sortBy([['age', 'BOGUS']])->values()->all();
});

// "Also fix": sortBy's array form discards $descending entirely
// (`return $this->sortByMany($callback, $options);` never forwards it) - a
// direction-less descriptor inside an array callback ignores the third
// argument to sortBy and always defaults to ascending.
probe('Collection::sortBy — global $descending=true is ignored for the array-of-descriptors form', 'sortBy([["age"]], SORT_REGULAR, true)', function () {
    $c = new \Illuminate\Support\Collection(['a' => ['age' => 10], 'b' => ['age' => 2]]);

    return $c->sortBy([['age']], SORT_REGULAR, true)->values()->all();
});

// Important 3 / "Also fix": an empty comparisons array is a true no-op in
// PHP - uasort's comparator closure has an empty foreach body, so it falls
// off the end and implicitly returns null (coerced to 0 for every pair),
// leaving insertion order untouched. This is NOT the same as "sort
// naturally by value".
probe('Arr::sort — empty descriptor array preserves insertion order', 'Arr::sort($u, [])', function () {
    return array_values(Arr::sort(['a' => 5, 'b' => 1, 'c' => 3], []));
});

// Minor 7: PHP casts a boolean array key to int (true -> 1, false -> 0),
// not to the string "true"/"false".
probe('Arr::pluck — boolean key casts to int, not string', 'Arr::pluck($u, "name", "flag")', function () {
    $u = [
        'a' => ['flag' => true, 'name' => 'X'],
        'b' => ['flag' => false, 'name' => 'Y'],
    ];

    return Arr::pluck($u, 'name', 'flag');
});

probe('pluck wildcard over a non-iterable', 'Arr::pluck([["meta"=>"x"]], "meta.*.v")', function () {
    return [
        'scalar_string' => Arr::pluck([['meta' => 'not-iterable']], 'meta.*.v'),
        'null' => Arr::pluck([['meta' => null]], 'meta.*.v'),
        'int' => Arr::pluck([['meta' => 5]], 'meta.*.v'),
        'assoc_target' => Arr::pluck(['a' => ['meta' => 'not-iterable']], 'meta.*.v'),
    ];
});

// Task 7 (U2): sortBy(null) is asort() on RAW values, so -1 precedes 0. The
// TS port ordered PHP-falsy values ahead of everything and treated them as
// equal, which put 0 before -1.
probe('sort orders falsy values by value, not by falsiness', 'asort([-1,0,5])', function () {
    $natural = ['a' => -1, 'b' => 0, 'c' => 5];
    asort($natural);

    return [
        'natural' => $natural,
        'arr_sort' => Arr::sort([-1, 0, 5]),
        'collection_sortby_null' => (new \Illuminate\Support\Collection(['a' => -1, 'b' => 0, 'c' => 5]))->sortBy(null)->all(),
        'sortdesc_values' => (new \Illuminate\Support\Collection([3, 1, 2]))->sortDesc()->values()->all(),
        'reverse_values' => (new \Illuminate\Support\Collection([3, 1, 2]))->reverse()->values()->all(),
    ];
});

// Task 7 (U2): the same falsy set behind a string field path, which the TS
// port sorted with its own hand-rolled falsy-first comparison.
probe('sort by a string field orders falsy field values by value', 'Arr::sort($u, "n")', function () {
    $u = ['a' => ['n' => -1], 'b' => ['n' => 0], 'c' => ['n' => 5]];

    return [
        'arr_sort_field' => Arr::sort($u, 'n'),
        'collection_sortby_field' => (new \Illuminate\Support\Collection($u))->sortBy('n')->all(),
    ];
});

// Task 7 (U3): every member of the sort/reverse family is key-PRESERVING in
// PHP (asort/arsort/array_reverse($x, true)), on integer keys included.
probe('sort/sortDesc/reverse preserve integer keys and their order', 'asort/arsort/array_reverse on [0=>3,1=>1,2=>2]', function () {
    $c = new \Illuminate\Support\Collection([0 => 3, 1 => 1, 2 => 2]);

    return [
        'sort_all' => $c->sort()->all(),
        'sort_values' => $c->sort()->values()->all(),
        'sortdesc_all' => $c->sortDesc()->all(),
        'sortdesc_values' => $c->sortDesc()->values()->all(),
        'reverse_all' => $c->reverse()->all(),
        'reverse_values' => $c->reverse()->values()->all(),
    ];
});

// Task 7 (U3): all() and values() must agree about ORDER for sortBy and
// sortByDesc over integer keys - values() is just all() with keys dropped.
probe('sortBy/sortByDesc: all() and values() agree on order', 'sortBy/sortByDesc over [0=>3,1=>1,2=>2]', function () {
    $c = new \Illuminate\Support\Collection([0 => ['v' => 3], 1 => ['v' => 1], 2 => ['v' => 2]]);

    return [
        'sortby_all' => $c->sortBy('v')->all(),
        'sortby_values' => $c->sortBy('v')->values()->all(),
        'sortbydesc_all' => $c->sortByDesc('v')->all(),
        'sortbydesc_values' => $c->sortByDesc('v')->values()->all(),
        'sortbymany_values' => $c->sortBy([['v']])->values()->all(),
    ];
});

// Task 7 (integer-key policy): PHP's own int-key grammar. array_unshift
// renumbers "-5" but not "-0"; asort/array_reverse renumber NOTHING, so a
// negative key keeps both its name and its slot in the reversed order.
probe('negative integer keys under the sort/reverse family', 'array_reverse/asort with negative keys', function () {
    return [
        'reverse_negative_keys' => array_reverse([-1 => 'a', -2 => 'b', 'x' => 'c'], true),
        'asort_negative_keys' => (function () {
            $v = [-1 => 'b', -2 => 'a', 'x' => 'c'];
            asort($v);

            return $v;
        })(),
        'unshift_renumbers_negative' => (function () {
            $v = ['-5' => 'a', 'x' => 'b'];
            array_unshift($v, 9);

            return $v;
        })(),
    ];
});


// Task 7 (U2): the mixed-value set the pinned obj.sort falsy tests use, in
// its closest PHP analogue. JS `undefined` and a plain `{}` have no PHP
// counterpart, so only the null/false/0/[] members are oracled here.
probe('asort over PHP-falsy mixed values', 'asort([0, null, false, []])', function () {
    $falsy = ['a' => 0, 'b' => null, 'd' => false, 'e' => []];
    asort($falsy);

    $desc = ['a' => -1, 'b' => 0, 'c' => 5];
    arsort($desc);

    return [
        'falsy_keys' => array_keys($falsy),
        'arsort_falsy_values' => $desc,
        'null_vs_zero' => [null <=> 0, 0 <=> null],
        'false_vs_zero' => [false <=> 0, 0 <=> false],
        'empty_array_vs_zero' => [[] <=> 0, 0 <=> []],
        'null_vs_empty_array' => [null <=> [], [] <=> null],
        'empty_array_vs_one' => [[] <=> 1, 1 <=> []],
    ];
});

// Task 7: which callbacks count as "no callback". Collection::sort's own test
// is `$callback && is_callable($callback)` - PHP falsiness - so a non-callable
// string never reaches uasort; it is forwarded to asort as a SORT_* flag and
// PHP 8 rejects it outright. Real Laravel therefore gives NO answer for the
// string-as-field-path form the TS port adds, which is why cross-backing
// agreement with Arr.sort (isFalsy) settles the dispatch guard instead.
probe('Collection::sort — a string callback is a sort flag, not a field path', 'sort(""), sort("0"), sort("age")', function () {
    $c = new \Illuminate\Support\Collection(['a' => 3, 'b' => 1, 'c' => 2]);

    $attempt = static function (string $callback) use ($c) {
        try {
            return $c->sort($callback)->all();
        } catch (\Throwable $e) {
            return ['threw' => get_class($e), 'message' => $e->getMessage()];
        }
    };

    return [
        'empty_string' => $attempt(''),
        'zero_string' => $attempt('0'),
        'non_callable_string' => $attempt('age'),
        'is_callable_age' => is_callable('age'),
    ];
});

// Task 7: Collection::mode's inner `->sort()` runs over a set whose values
// are all equal to $highestValue, so asort leaves it untouched - the keys it
// then reads are the filtered order either way. The TS port drops that sort
// because sort() renumbers integer keys there.
probe('Collection::mode — the inner sort before keys() is a no-op', 'mode() and its filtered-then-sorted keys', function () {
    $counts = new \Illuminate\Support\Collection([1 => 2, 2 => 2, 3 => 1]);
    $filtered = $counts->filter(fn ($value) => $value == 2);

    return [
        'mode_single' => (new \Illuminate\Support\Collection([1, 2, 3, 4, 4, 5]))->mode(),
        'mode_tie' => (new \Illuminate\Support\Collection([1, 2, 2, 1]))->mode(),
        'mode_assoc_tie' => (new \Illuminate\Support\Collection(['a' => 1, 'b' => 1, 'c' => 2, 'd' => 2, 'e' => 3]))->mode(),
        'filtered_keys' => $filtered->keys()->all(),
        'filtered_sorted_keys' => $filtered->sort()->keys()->all(),
    ];
});

// Task 7 (U3): the sortBy/sortByMany rows whose TS expectations had frozen
// the pre-fix no-op - an integer-keyed backing simply kept its input order.
probe('sortBy/sortByMany over an integer-keyed backing', 'sortBy(fn), sortBy([[key]]), sortBy([comparator])', function () {
    $words = new \Illuminate\Support\Collection(['taylor', 'dayle']);
    $imgs = new \Illuminate\Support\Collection([
        ['item' => 'img1'], ['item' => 'img101'], ['item' => 'img10'], ['item' => 'img11'],
    ]);
    $vals = new \Illuminate\Support\Collection([['value' => 10], ['value' => 5], ['value' => 20]]);
    $nums = new \Illuminate\Support\Collection([3, 1, 2]);
    $byValue = static fn ($a, $b) => $a['value'] <=> $b['value'];

    $records = new \Illuminate\Support\Collection([['sort' => 2], ['sort' => 1]]);

    return [
        'words_all' => $words->sortBy(fn ($x) => $x)->all(),
        'words_values' => $words->sortBy(fn ($x) => $x)->values()->all(),
        'records_all' => $records->sortBy('sort')->all(),
        'records_values' => $records->sortBy('sort')->values()->all(),
        'imgs_plucked' => $imgs->sortBy([['item']])->pluck('item')->all(),
        'vals_plucked' => $vals->sortBy([$byValue])->pluck('value')->all(),
        'nums_all' => $nums->sortBy([static fn ($a, $b) => $a <=> $b])->all(),
        'nums_values' => $nums->sortBy([static fn ($a, $b) => $a <=> $b])->values()->all(),
    ];
});


emit();
