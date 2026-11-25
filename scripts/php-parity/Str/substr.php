<?php

/**
 * Ground truth for Str::substr().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('substr-fractional', "Str::substr() of ('abcd', -2.5), ('abcd', 1.5, 2), ('abcd', 0, -0.5), ('abcd', 1, 1.9) and ('abcd', 0, -1.5), with PHP's deprecations", fn () => withDeprecations(fn () => [Str::substr('abcd', -2.5), Str::substr('abcd', 1.5, 2), Str::substr('abcd', 0, -0.5), Str::substr('abcd', 1, 1.9), Str::substr('abcd', 0, -1.5)]));
probe('substr-non-finite', "What Str::substr('abcd', NAN), Str::substr('abcd', 0, NAN) and Str::substr('abcd', INF) throw", fn () => [attempt(fn () => Str::substr('abcd', NAN)), attempt(fn () => Str::substr('abcd', 0, NAN)), attempt(fn () => Str::substr('abcd', INF))]);

emit();
