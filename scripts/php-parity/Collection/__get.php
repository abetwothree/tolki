<?php

/**
 * Ground truth for Collection::__get().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;

probe('__get-unknown-property-throws', 'collect([1])->a', fn () => collect([1])->a);

emit();
