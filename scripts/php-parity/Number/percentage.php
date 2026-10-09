<?php

/**
 * Ground truth for Number::percentage().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

probe('percentage-rounds-to-zero', 'Number::percentage(-0.4)', fn () => Number::percentage(-0.4));
probe('percentage-rounds-to-zero-one-digit', 'Number::percentage(-0.04, precision: 1)', fn () => Number::percentage(-0.04, precision: 1));
probe('percentage-keeps-sign-one-digit', 'Number::percentage(-0.4, precision: 1)', fn () => Number::percentage(-0.4, precision: 1));
probe('percentage-keeps-sign', 'Number::percentage(-5)', fn () => Number::percentage(-5));
probe('percentage-max-precision-rounds-to-zero', 'Number::percentage(-0.004, maxPrecision: 2)', fn () => Number::percentage(-0.004, maxPrecision: 2));

emit();
