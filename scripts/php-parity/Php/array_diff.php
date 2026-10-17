<?php

/**
 * Ground truth for PHP's array_diff().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// Task 14 (parity-review-fixes) — C7: diff/intersect compare values by
// (string) cast in real PHP, not strict ===. @ suppresses the "Array to
// string conversion" warning array_intersect emits for array operands.
probe('diff and intersect compare by string cast', 'array_diff([0],["0"])', function () {
    return [
        'diff_int_string' => array_diff([0], ['0']),
        'diff_null_empty' => array_diff([null], ['']),
        'diff_int_empty' => array_diff([0], ['']),
        'diff_int_exponential_string' => array_diff([100], ['1e2']),
        'intersect_int_string' => array_intersect([0], ['0']),
        'intersect_int_empty' => array_intersect([0], ['']),
        'intersect_bool_one' => array_intersect([true], ['1']),
        'intersect_arrays' => @array_intersect([['id' => 1], ['id' => 2]], [['id' => 1]]),
    ];
});

// The docblock on phpValueMatch claimed high-precision floats bail out to
// identity; PHP's precision=14 (string) cast is what actually collapses them.
probe('array_diff matches a high-precision float against its precision=14 cast', 'array_diff([0.1 + 0.2], ["0.3"])', function () {
    return [
        'diff_precision' => array_diff([0.1 + 0.2], ['0.3']),
        'string_cast' => (string) (0.1 + 0.2),
    ];
});

emit();
