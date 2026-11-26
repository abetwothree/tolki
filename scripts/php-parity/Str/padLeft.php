<?php

/**
 * Ground truth for Str::padLeft().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('padLeft-astral', "Str::padLeft('😀', 3, '-') and Str::padLeft('a', 4, '😀🎉')", fn () => [Str::padLeft('😀', 3, '-'), Str::padLeft('a', 4, '😀🎉')]);
probe('padLeft-empty-pad', "Str::padLeft('a', 3, ''), Str::padLeft('abc', 2, '') and Str::padLeft('abc', -1, '')", fn () => [attempt(fn () => Str::padLeft('a', 3, '')), Str::padLeft('abc', 2, ''), Str::padLeft('abc', -1, '')]);

probe('padLeft-fractional-length', "Str::padLeft() of ('😀', 1.5, ''), ('a', 2.5, '-'), ('a', 3.9, '-') and ('a', -1.5, ''), with PHP's deprecations", fn () => withDeprecations(fn () => [Str::padLeft('😀', 1.5, ''), Str::padLeft('a', 2.5, '-'), Str::padLeft('a', 3.9, '-'), Str::padLeft('a', -1.5, '')]));
probe('padLeft-non-finite-length', "What Str::padLeft('a', NAN, '-') and Str::padLeft('a', INF, '-') throw", fn () => [attempt(fn () => Str::padLeft('a', NAN, '-')), attempt(fn () => Str::padLeft('a', INF, '-'))]);

emit();
