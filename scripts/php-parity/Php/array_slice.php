<?php

/**
 * Ground truth for PHP's array_slice().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

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

emit();
