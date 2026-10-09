<?php

/**
 * Ground truth for Collection::last().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Collection;

probe('order-last', 'collect(base)->last()', fn () => collect(d8Base())->last());
probe('order-last-callback', "collect(base)->last(fn (\$v) => \$v !== 'b')", fn () => collect(d8Base())->last(fn ($v) => $v !== 'b'));
probe('order-last-no-match-default', "collect(base)->last(fn (\$v) => false, 'fallback')", fn () => collect(d8Base())->last(fn ($v) => false, 'fallback'));

emit();
