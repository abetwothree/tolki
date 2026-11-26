<?php

/**
 * Ground truth for Str::charAt().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('charAt-astral', "Str::charAt('😀a', …) at 1, 0, -2, 2 and -3, and Str::charAt('', 0)", fn () => [Str::charAt('😀a', 1), Str::charAt('😀a', 0), Str::charAt('😀a', -2), Str::charAt('😀a', 2), Str::charAt('😀a', -3), Str::charAt('', 0)]);
probe('charAt-fractional', "Str::charAt('abc', 1.5) and Str::charAt('abc', -2.5), with PHP's deprecations", fn () => withDeprecations(fn () => [Str::charAt('abc', 1.5), Str::charAt('abc', -2.5)]));

// The bounds check reads the float as given; only mb_substr() converts it to an int.
probe('charAt-fractional-bounds', "Str::charAt('abc', 2.5) and Str::charAt('abc', -3.5), and what Str::charAt('abc', NAN) throws", fn () => [Str::charAt('abc', 2.5), Str::charAt('abc', -3.5), attempt(fn () => Str::charAt('abc', NAN))]);

emit();
