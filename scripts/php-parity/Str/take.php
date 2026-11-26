<?php

/**
 * Ground truth for Str::take().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

// Called through array_map(), as app code without strict_types calls it, so PHP converts the float limit.
probe('take-fractional', "array_map([Str::class, 'take'], ['abcd', 'abcd', 'abcd'], [-0.5, 2.5, -1.5]), with PHP's deprecations", fn () => withDeprecations(fn () => array_map([Str::class, 'take'], ['abcd', 'abcd', 'abcd'], [-0.5, 2.5, -1.5])));
probe('take-non-finite', "What array_map([Str::class, 'take'], ['abcd'], [NAN]) throws", fn () => attempt(fn () => array_map([Str::class, 'take'], ['abcd'], [NAN])));

emit();
