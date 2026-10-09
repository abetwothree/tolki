<?php

/**
 * Ground truth for PHP's array_combine().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('array_combine mismatch', 'array_combine(["a","b"],[1])', function () {
    return array_combine(['a', 'b'], [1]);
});

probe('X19 combine throws on a key/value count mismatch', "array_combine(['a','b'],[1])", function () {
    return array_combine(['a', 'b'], [1]);
});

emit();
