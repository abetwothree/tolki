<?php

/**
 * Ground truth for PHP's usort().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;

probe('usort orders two DateTime objects chronologically', "usort([new DateTime('2021-01-01'), new DateTime('2020-01-01')], fn (\$x, \$y) => \$x <=> \$y)", function () {
    $dates = [new DateTime('2021-01-01'), new DateTime('2020-01-01')];
    usort($dates, fn ($x, $y) => $x <=> $y);

    return array_map(fn (DateTime $date) => $date->format('Y'), $dates);
});

emit();
