<?php

/**
 * Ground truth for PHP's array_diff_uassoc().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('diffAssocUsing / diffKeysUsing with a real comparator', 'array_diff_uassoc / array_diff_ukey', function () {
    $cmp = fn ($a, $b) => $a <=> $b;

    return [
        'assoc' => array_diff_uassoc(nums(), [10, 999, 30, 40], $cmp),
        'keys' => array_diff_ukey(nums(), [1 => 'x', 3 => 'y'], $cmp),
    ];
});

emit();
