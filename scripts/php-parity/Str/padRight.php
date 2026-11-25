<?php

/**
 * Ground truth for Str::padRight().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('padRight-astral', "Str::padRight('😀', 3, '-') and Str::padRight('a', 4, '😀🎉')", fn () => [Str::padRight('😀', 3, '-'), Str::padRight('a', 4, '😀🎉')]);
probe('padRight-empty-pad', "Str::padRight('a', 3, ''), Str::padRight('abc', 2, '') and Str::padRight('abc', -1, '')", fn () => [attempt(fn () => Str::padRight('a', 3, '')), Str::padRight('abc', 2, ''), Str::padRight('abc', -1, '')]);

emit();
