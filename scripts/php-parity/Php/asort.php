<?php

/**
 * Ground truth for PHP's asort().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;

// Keeps PHP's deprecation notices off stdout, where they would corrupt emit()'s JSON.
error_reporting(E_ALL & ~E_DEPRECATED);

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

// B6 — the falsy ties, seen through asort/arsort, that obj.spec pins. PHP has
// no `undefined`; the rows below drop it and this port compares it as null.
probe('asort ties zero and null, keeping insertion order', 'asort(["user1"=>0,"user2"=>null,"user3"=>25])', function () {
    $a = ['user1' => 0, 'user2' => null, 'user3' => 25];
    asort($a);
    return array_keys($a);
});
$falsy = ['user0' => 100, 'user1' => 30, 'user2' => null, 'user3' => 25, 'user4' => []];
probe('asort ties null and an empty array, keeping insertion order', 'asort(["user2"=>null,"user4"=>[],...])', function () use ($falsy) {
    asort($falsy);
    return array_keys($falsy);
});

// B6 follow-up — an object-backed natural sort, which the list rows above do
// not cover: obj.spec pins asort/arsort over this literal, not sort/rsort.
$keyed = ['a' => '9', 'b' => '10', 'c' => '1', 'd' => 5];
probe('asort over a keyed mix of numeric strings and an int', 'asort(["a"=>"9","b"=>"10","c"=>"1","d"=>5])', function () use ($keyed) {
    asort($keyed);
    return array_values($keyed);
});

emit();
