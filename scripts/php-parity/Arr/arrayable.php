<?php

/**
 * Ground truth for Arr::arrayable().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('arrayable-datetime', 'Arr::arrayable(new DateTime)', fn () => Arr::arrayable(new DateTime));

emit();
