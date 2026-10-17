<?php

/**
 * Ground truth for PHP's is_numeric().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;

probe('is_numeric matrix for CSS-helper keys', 'is_numeric($key) for each input', function () {
    $cases = [
        '', ' ', '0x10', '1e3', 'Infinity', 'NAN', 'INF',
        ' 42', '42 ', ' 42 ', '+42', '-42', '3.14', '-3.14',
        '1e-3', '1E3', '007', '0', '00', '.5', '5.', '5.5e2',
        'abc', '1abc', 'abc1', '1_000', '0b101', '0o17',
        "\t5", "5\n", "\n5\n", "5\t", '5,5', '  ',
    ];

    $result = [];
    foreach ($cases as $c) {
        $result[] = ['input' => $c, 'is_numeric' => is_numeric($c)];
    }

    return $result;
});

emit();
