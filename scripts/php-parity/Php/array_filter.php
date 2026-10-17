<?php

/**
 * Ground truth for PHP's array_filter().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;

probe('NAN is truthy for array_filter', 'array_keys(array_filter(["n"=>NAN,"z"=>0.0]))', function () {
    return ['bool_cast' => @((bool) NAN), 'kept' => array_keys(@array_filter(['n' => NAN, 'z' => 0.0]))];
});

emit();
