<?php

/**
 * Ground truth for Collection::sortKeys().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Collection;

probe('order-sortKeys', 'collect(base)->sortKeys()', fn () => d8Views(collect(d8Base())->sortKeys()));

emit();
