<?php

/**
 * Ground truth for Number::ordinal().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

probe('ordinal-locale-unknown', "Number::ordinal(1, 'xx')", fn () => Number::ordinal(1, 'xx'));
probe('ordinal-locale-malformed', "Number::ordinal(1, '-en')", fn () => Number::ordinal(1, '-en'));

emit();
