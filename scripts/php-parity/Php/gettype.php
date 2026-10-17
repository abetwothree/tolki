<?php

/**
 * Ground truth for PHP's gettype().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// Task 20 — gettype() names for the value-assertion messages (typeOf leaks JS names)
probe('gettype of an integer', 'gettype(1)', fn () => gettype(1));
probe('gettype of a float', 'gettype(1.5)', fn () => gettype(1.5));
probe('gettype of a string', 'gettype("s")', fn () => gettype('s'));
probe('gettype of a boolean', 'gettype(true)', fn () => gettype(true));
probe('gettype of null', 'gettype(null)', fn () => gettype(null));
probe('gettype of an array', 'gettype([1])', fn () => gettype([1]));
probe('gettype of an object', 'gettype(new stdClass())', fn () => gettype(new stdClass()));

emit();
