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

emit();
