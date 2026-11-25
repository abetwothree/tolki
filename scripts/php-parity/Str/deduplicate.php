<?php

/**
 * Ground truth for Str::deduplicate().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('deduplicate-astral', "Str::deduplicate('😀😀😀x', '😀') and Str::deduplicate('a😀😀b  c', ['😀', ' '])", fn () => [Str::deduplicate('😀😀😀x', '😀'), Str::deduplicate('a😀😀b  c', ['😀', ' '])]);
probe('deduplicate-regex-characters', "Str::deduplicate() of 'a..b' by '.', 'a//b' by '/', 'a--b' by '-', 'a**b' by '*' and 'ab  ab' by 'ab '", fn () => [Str::deduplicate('a..b', '.'), Str::deduplicate('a//b', '/'), Str::deduplicate('a--b', '-'), Str::deduplicate('a**b', '*'), Str::deduplicate('ab  ab', 'ab ')]);
// preg_replace() cannot compile '/+/u': it warns and returns null.
probe('deduplicate-empty-character', "@Str::deduplicate('abc', '')", fn () => @Str::deduplicate('abc', ''));

emit();
