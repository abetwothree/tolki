<?php

/**
 * Ground truth for PHP's array_slice().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('slice(-2,5) preserve_keys', 'array_slice($a,-2,5,true)', function () {
    $a = ['a'=>1,'b'=>2,'c'=>3,'d'=>4,'e'=>5,'f'=>6,'g'=>7,'h'=>8];

    return array_slice($a, -2, 5, true);
});

probe('slice(-2,2) preserve_keys', 'array_slice($a,-2,2,true)', function () {
    $a = ['a'=>1,'b'=>2,'c'=>3,'d'=>4,'e'=>5,'f'=>6,'g'=>7,'h'=>8];

    return array_slice($a, -2, 2, true);
});

probe('slice(1,0)', 'array_slice($a,1,0,true)', function () {
    return array_slice(['a'=>1,'b'=>2,'c'=>3], 1, 0, true);
});

probe('slice over-negative length clamps to empty', 'array_slice($a,0,-5,true)', function () {
    return [
        'assoc_0_neg5' => Arr::get(['v' => array_slice(['a' => 1, 'b' => 2, 'c' => 3], 0, -5, true)], 'v'),
        'assoc_neg5_neg5' => array_slice(['a' => 1, 'b' => 2, 'c' => 3], -5, -5, true),
        'list_0_neg5' => array_slice([1, 2, 3], 0, -5),
        'list_neg5_neg5' => array_slice([1, 2, 3], -5, -5),
        'assoc_0_neg6_of5' => array_slice(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5], 0, -6, true),
    ];
});

emit();
