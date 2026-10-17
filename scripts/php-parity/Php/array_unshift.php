<?php

/**
 * Ground truth for PHP's array_unshift().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('push/prepend equivalent of array_unshift', 'array_unshift on assoc', function () {
    $a = ['x' => 1, 'y' => 2];
    array_unshift($a, 9);

    return $a;
});

probe('unshift renumbers existing integer keys', 'array_unshift([10,20,30,40],1,2)', function () {
    $a = [10, 20, 30, 40];
    array_unshift($a, 1, 2);

    return $a;
});

probe('unshift keeps string keys, prepends at 0', "array_unshift(['x'=>1,'y'=>2],9)", function () {
    $a = ['x' => 1, 'y' => 2];
    array_unshift($a, 9);

    return $a;
});

probe('unshift on mixed keys: integers renumber, strings stay', "array_unshift([0=>'a','x'=>1,1=>'b'],9)", function () {
    $a = [0 => 'a', 'x' => 1, 1 => 'b'];
    array_unshift($a, 9);

    return $a;
});

emit();
