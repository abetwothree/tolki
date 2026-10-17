<?php

/**
 * Ground truth for PHP's array_pad().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('pad negative on assoc', 'array_pad(["a"=>1,"b"=>2],-5,0)', function () {
    return array_pad(['a' => 1, 'b' => 2], -5, 0);
});

probe('pad positive on assoc', 'array_pad(["a"=>1,"b"=>2],5,0)', function () {
    return array_pad(['a' => 1, 'b' => 2], 5, 0);
});

probe('pad when no padding needed', 'array_pad(["a"=>1,"b"=>2],2,0)', function () {
    return array_pad(['a' => 1, 'b' => 2], 2, 0);
});

probe('X17 pad numbers negative pad slots from 0', "array_pad(['a'=>1,'b'=>2],-5,0)", function () {
    return ['strings' => array_pad(['a' => 1, 'b' => 2], -5, 0), 'ints' => array_pad(nums(), -6, 0)];
});

probe('pad appends after the original entries', 'array_pad([10,20,30,40],6,0)', function () {
    return array_pad([10, 20, 30, 40], 6, 0);
});

probe('pad with string keys numbers the pad slots from 0', "array_pad(['a'=>1,'b'=>2],4,0)", function () {
    return array_pad(['a' => 1, 'b' => 2], 4, 0);
});

probe('pad with mixed keys continues past the highest integer key', "array_pad([0=>'a','x'=>1],4,'p')", function () {
    return array_pad([0 => 'a', 'x' => 1], 4, 'p');
});

probe('negative pad numbers the pad slots first', 'array_pad([10,20,30,40],-6,0)', function () {
    return array_pad([10, 20, 30, 40], -6, 0);
});

emit();
