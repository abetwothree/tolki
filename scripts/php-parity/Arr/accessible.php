<?php

/**
 * Ground truth for Arr::accessible().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// --- accessible / arrayable analogues
probe('accessible-datetime', 'Arr::accessible(new DateTime)', fn () => Arr::accessible(new DateTime));

emit();
