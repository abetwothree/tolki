<?php

/**
 * Ground truth for PHP's array_splice().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('splice on numeric keys — reindexes', 'array_splice([10=>a,20=>b,30=>c],1,1)', function () {
    $a = [10 => 'a', 20 => 'b', 30 => 'c'];
    $cut = array_splice($a, 1, 1);

    return ['remaining' => $a, 'cut' => $cut];
});

probe('splice discards replacement keys', 'array_splice($a,1,1,["foo"=>"bar"])', function () {
    $simple = ['x' => 1, 'y' => 2, 'z' => 3];
    array_splice($simple, 1, 1, ['foo' => 'bar']);

    $multi = ['a' => 1, 'b' => 2, 'c' => 3];
    array_splice($multi, 1, 1, ['x' => 10, 'y' => 20]);

    $collision = ['a' => 1, 'b' => 2, 'c' => 3];
    array_splice($collision, 1, 1, ['a' => 9]);

    $insert = ['a' => 1, 'b' => 2, 'c' => 3];
    array_splice($insert, 1, 0, [10]);

    return ['simple' => $simple, 'multi' => $multi, 'collision' => $collision, 'insert' => $insert];
});

probe('array_splice negative length — associative, single removal', 'array_splice($a,1,-1)', function () {
    $a = ['a' => 1, 'b' => 2, 'c' => 3];
    $cut = array_splice($a, 1, -1);

    return ['remaining' => $a, 'cut' => $cut];
});

probe('array_splice negative length — numeric, five offset/length combinations', 'array_splice($a,$offset,$length)', function () {
    $cases = [];
    foreach ([[1, -1], [-3, -1], [0, -5], [-2, -1], [1, -2]] as [$offset, $length]) {
        $a = [1, 2, 3, 4, 5];
        $cut = array_splice($a, $offset, $length);
        $cases["{$offset},{$length}"] = ['remaining' => $a, 'cut' => $cut];
    }

    return $cases;
});

probe('X8 splice keeps string keys, reindexes integer keys', "array_splice(['x'=>1,'y'=>2,'z'=>3],1,1)", function () {
    $a = ['x' => 1, 'y' => 2, 'z' => 3];
    $removed = array_splice($a, 1, 1);
    $b = [10 => 'a', 20 => 'b', 30 => 'c'];
    $removedB = array_splice($b, 1, 1);

    return ['strRemoved' => $removed, 'strAfter' => $a, 'intRemoved' => $removedB, 'intAfter' => $b];
});

probe('PHP casts "-1" to int(-1) and array_splice renumbers it too (JS does not)', "array_splice(\$a=['-1'=>'x','b'=>'y','c'=>'z'], 1, 1)", function () {
    $a = ['-1' => 'x', 'b' => 'y', 'c' => 'z'];
    array_splice($a, 1, 1);

    return $a;
});

emit();
