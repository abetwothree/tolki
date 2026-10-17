<?php

/**
 * Ground truth for PHP's array_diff_assoc().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('array_diff_assoc casts values to string', 'array_diff_assoc(["a"=>0],["a"=>"0"])', fn () => array_diff_assoc(['a' => 0], ['a' => '0']));
probe('array_diff_assoc casts a float to string', 'array_diff_assoc(["a"=>1.0],["a"=>"1"])', fn () => array_diff_assoc(['a' => 1.0], ['a' => '1']));

emit();
