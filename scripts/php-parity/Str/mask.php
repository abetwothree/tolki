<?php

/**
 * Ground truth for Str::mask().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('mask-astral', "Str::mask('😀😀😀😀', '*', …) at (1, 2), (-2) and (-9, 2), and Str::mask('😀😀', '*', 5)", fn () => [Str::mask('😀😀😀😀', '*', 1, 2), Str::mask('😀😀😀😀', '*', -2), Str::mask('😀😀😀😀', '*', -9, 2), Str::mask('😀😀', '*', 5)]);
probe('mask-astral-character', "Str::mask('abcd', '🔒', 1) and Str::mask('ab', '😀🎉', 0)", fn () => [Str::mask('abcd', '🔒', 1), Str::mask('ab', '😀🎉', 0)]);

probe('mask-fractional', "Str::mask('abcd', '*', …) at (0, -0.5), (1.5), (-2.5) and (1, 2.5), and what (NAN) throws, with PHP's deprecations", fn () => withDeprecations(fn () => [Str::mask('abcd', '*', 0, -0.5), Str::mask('abcd', '*', 1.5), Str::mask('abcd', '*', -2.5), Str::mask('abcd', '*', 1, 2.5), attempt(fn () => Str::mask('abcd', '*', NAN))]));

emit();
