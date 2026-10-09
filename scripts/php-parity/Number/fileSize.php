<?php

/**
 * Ground truth for Number::fileSize().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

// fileSize() formats through format(), so it inherits the same guard.
probe('fileSize-rounds-to-zero', 'Number::fileSize(-0.4)', fn () => Number::fileSize(-0.4));
probe('fileSize-negative-zero', 'Number::fileSize(-0.0)', fn () => Number::fileSize(-0.0));

emit();
