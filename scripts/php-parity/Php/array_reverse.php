<?php

/**
 * Ground truth for PHP's array_reverse().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;

// Keeps PHP's deprecation notices off stdout, where they would corrupt emit()'s JSON.
error_reporting(E_ALL & ~E_DEPRECATED);

// Task 7 (integer-key policy): PHP's own int-key grammar. array_unshift
// renumbers "-5" but not "-0"; asort/array_reverse renumber NOTHING, so a
// negative key keeps both its name and its slot in the reversed order.
probe('negative integer keys under the sort/reverse family', 'array_reverse/asort with negative keys', function () {
    return [
        'reverse_negative_keys' => array_reverse([-1 => 'a', -2 => 'b', 'x' => 'c'], true),
        'asort_negative_keys' => (function () {
            $v = [-1 => 'b', -2 => 'a', 'x' => 'c'];
            asort($v);

            return $v;
        })(),
        'unshift_renumbers_negative' => (function () {
            $v = ['-5' => 'a', 'x' => 'b'];
            array_unshift($v, 9);

            return $v;
        })(),
    ];
});

emit();
