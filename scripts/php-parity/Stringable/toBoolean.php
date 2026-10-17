<?php

/**
 * Ground truth for Str::of()->toBoolean().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

probe('toBoolean-wrapped-in-whitespace', 'Str::of($value)->toBoolean() for " true ", "\u{0085}true" and "\u{00A0}true": filter_var() trims ASCII whitespace only', fn () => [Str::of(' true ')->toBoolean(), Str::of("\u{0085}true")->toBoolean(), Str::of("\u{00A0}true")->toBoolean()]);

emit();
