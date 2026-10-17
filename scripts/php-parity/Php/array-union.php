<?php

/**
 * Ground truth for PHP's + operator on arrays.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;

probe('union — left wins, including null', '["a"=>null] + ["a"=>1]', function () {
    return ['a' => null] + ['a' => 1];
});

emit();
