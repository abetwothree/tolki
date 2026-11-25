<?php

/**
 * Ground truth for Str::padLeft().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('padLeft-astral', "Str::padLeft('😀', 3, '-') and Str::padLeft('a', 4, '😀🎉')", fn () => [Str::padLeft('😀', 3, '-'), Str::padLeft('a', 4, '😀🎉')]);
probe('padLeft-empty-pad', "Str::padLeft('a', 3, ''), Str::padLeft('abc', 2, '') and Str::padLeft('abc', -1, '')", fn () => [attempt(fn () => Str::padLeft('a', 3, '')), Str::padLeft('abc', 2, ''), Str::padLeft('abc', -1, '')]);

emit();
