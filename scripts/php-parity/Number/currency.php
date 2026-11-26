<?php

/**
 * Ground truth for Number::currency().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

probe('currency-rounds-to-zero', 'Number::currency(-0.001)', fn () => Number::currency(-0.001));
probe('currency-float-noise', 'Number::currency(0.1 + 0.2 - 0.3 - 0.0000000001)', fn () => Number::currency(0.1 + 0.2 - 0.3 - 0.0000000001));
probe('currency-rounds-to-zero-no-digits', 'Number::currency(-0.4, precision: 0)', fn () => Number::currency(-0.4, precision: 0));
probe('currency-keeps-sign', 'Number::currency(-0.006)', fn () => Number::currency(-0.006));
probe('currency-negative-zero', 'Number::currency(-0.0)', fn () => Number::currency(-0.0));
probe('currency-rounds-to-zero-eur-de', "Number::currency(-0.001, in: 'EUR', locale: 'de')", fn () => Number::currency(-0.001, in: 'EUR', locale: 'de'));

probe('currency-locale-spellings', "Number::currency(1234.5, 'EUR', …) for pt_BR, pt-BR and ar_EG", fn () => array_combine(['pt_BR', 'pt-BR', 'ar_EG'], array_map(fn ($l) => Number::currency(1234.5, 'EUR', $l), ['pt_BR', 'pt-BR', 'ar_EG'])));
probe('currency-locale-unknown', "Number::currency(1234.5, 'EUR', 'xx')", fn () => Number::currency(1234.5, 'EUR', 'xx'));

emit();
