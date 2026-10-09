<?php

/**
 * Ground truth for PHP's array_keys().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('phpArrayKey-extra-string-keys', "array_keys(['-0' => 1, 'abc' => 2, '' => 3])", fn () => array_keys(['-0' => 1, 'abc' => 2, '' => 3]));

emit();
