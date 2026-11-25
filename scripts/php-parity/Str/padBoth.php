<?php

/**
 * Ground truth for Str::padBoth().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('padBoth-astral', "Str::padBoth('😀', 3 and 4, '-') and Str::padBoth('a', 5 and 6, '😀🎉')", fn () => [Str::padBoth('😀', 3, '-'), Str::padBoth('😀', 4, '-'), Str::padBoth('a', 5, '😀🎉'), Str::padBoth('a', 6, '😀🎉')]);
probe('padBoth-empty-pad', "Str::padBoth('a', 3, ''), Str::padBoth('abc', 2, '') and Str::padBoth('abc', 3, '')", fn () => [attempt(fn () => Str::padBoth('a', 3, '')), Str::padBoth('abc', 2, ''), Str::padBoth('abc', 3, '')]);

emit();
