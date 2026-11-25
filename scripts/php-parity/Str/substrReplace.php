<?php

/**
 * Ground truth for Str::substrReplace().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('substrReplace-fractional', "Str::substrReplace('abcd', 'x', …) at (1.5), (1, 1.5) and (-2.5, 1), with PHP's deprecations", fn () => withDeprecations(fn () => [Str::substrReplace('abcd', 'x', 1.5), Str::substrReplace('abcd', 'x', 1, 1.5), Str::substrReplace('abcd', 'x', -2.5, 1)]));
probe('substrReplace-non-finite', "What Str::substrReplace('abcd', 'x', NAN) and Str::substrReplace('abcd', 'x', 0, NAN) throw", fn () => [attempt(fn () => Str::substrReplace('abcd', 'x', NAN)), attempt(fn () => Str::substrReplace('abcd', 'x', 0, NAN))]);

emit();
