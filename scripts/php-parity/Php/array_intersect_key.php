<?php

/**
 * Ground truth for PHP's array_intersect_key().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('array_intersect_key never compares values', 'array_intersect_key(["a"=>0],["a"=>"zzz"])', fn () => array_intersect_key(['a' => 0], ['a' => 'zzz']));

emit();
