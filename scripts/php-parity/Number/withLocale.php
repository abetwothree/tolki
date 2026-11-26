<?php

/**
 * Ground truth for Number::withLocale().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

probe('withLocale-spellings', 'withLocale(…, fn () => [format(1234.5, 2), defaultLocale()]) for pt_BR and pt-BR', fn () => array_combine(['pt_BR', 'pt-BR'], array_map(fn ($l) => Number::withLocale($l, fn () => [Number::format(1234.5, 2), Number::defaultLocale()]), ['pt_BR', 'pt-BR'])));
probe('withLocale-restores-after-throw', "withLocale('xx', fn () => format(1)) throws, then defaultLocale()", fn () => [attempt(fn () => Number::withLocale('xx', fn () => Number::format(1))), Number::defaultLocale()]);

emit();
