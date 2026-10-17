<?php

/**
 * Ground truth for PHP's array_intersect_assoc().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('intersectAssoc / intersectAssocUsing / intersectByKeys', 'array_intersect_assoc family', function () {
    $cmp = fn ($a, $b) => $a <=> $b;

    return [
        'assoc' => array_intersect_assoc(nums(), [10, 999, 30]),
        'assocUsing' => array_intersect_uassoc(nums(), [10, 999, 30], $cmp),
        'byKeys' => array_intersect_key(nums(), [1 => 'x', 3 => 'y']),
    ];
});

// B7 — assoc family string-cast comparison
probe('array_intersect_assoc casts values to string', 'array_intersect_assoc(["a"=>0],["a"=>"0"])', fn () => array_intersect_assoc(['a' => 0], ['a' => '0']));

emit();
