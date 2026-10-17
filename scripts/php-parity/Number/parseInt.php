<?php

/**
 * Ground truth for Number::parseInt().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

// Number::parseInt() parses 64-bit integers (laravel/framework#61691).
probe('parseInt-past-int32', "Number::parseInt('3,000,000,000')", fn () => Number::parseInt('3,000,000,000'));
probe('parseInt-past-int32-negative', "Number::parseInt('-3,000,000,000')", fn () => Number::parseInt('-3,000,000,000'));
probe('parseInt-max-safe-integer', "Number::parseInt('9007199254740991')", fn () => Number::parseInt('9007199254740991'));
probe('parseInt-php-int-max', '(string) Number::parseInt((string) PHP_INT_MAX)', fn () => (string) Number::parseInt((string) PHP_INT_MAX));

emit();
