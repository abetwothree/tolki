<?php

/**
 * Ground truth for Number::format().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

// Number::format(), percentage() and currency() no longer return "-0" (laravel/framework#61716).
probe('format-negative-zero', 'Number::format(-0.0)', fn () => Number::format(-0.0));
probe('format-rounds-to-zero', 'Number::format(-0.4, precision: 0)', fn () => Number::format(-0.4, precision: 0));
probe('format-rounds-to-zero-one-digit', 'Number::format(-0.04, precision: 1)', fn () => Number::format(-0.04, precision: 1));
probe('format-keeps-sign', 'Number::format(-0.06, precision: 1)', fn () => Number::format(-0.06, precision: 1));
probe('format-default-precision', 'Number::format(-0.4)', fn () => Number::format(-0.4));
probe('format-max-precision-rounds-to-zero', 'Number::format(-0.0004, maxPrecision: 2)', fn () => Number::format(-0.0004, maxPrecision: 2));
probe('format-rounds-to-zero-de', "Number::format(-0.04, precision: 1, locale: 'de')", fn () => Number::format(-0.04, precision: 1, locale: 'de'));

emit();
