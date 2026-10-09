<?php

/**
 * Ground truth for PHP's arsort().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;

$falsy = ['user0' => 100, 'user1' => 30, 'user2' => null, 'user3' => 25, 'user4' => []];
probe('arsort over the same null and empty-array fixture', 'arsort(["user2"=>null,"user4"=>[],...])', function () use ($falsy) {
    arsort($falsy);
    return array_keys($falsy);
});

// B6 follow-up — an object-backed natural sort, which the list rows above do
// not cover: obj.spec pins asort/arsort over this literal, not sort/rsort.
$keyed = ['a' => '9', 'b' => '10', 'c' => '1', 'd' => 5];
probe('arsort over a keyed mix of numeric strings and an int', 'arsort(["a"=>"9","b"=>"10","c"=>"1","d"=>5])', function () use ($keyed) {
    arsort($keyed);
    return array_values($keyed);
});

emit();
