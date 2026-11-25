<?php

/**
 * Ground truth for Str::between().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('between-astral', "Str::between('😀a😀b😀', '😀', '😀') and Str::between('😀a😀b😀', 'a', '😀')", fn () => [Str::between('😀a😀b😀', '😀', '😀'), Str::between('😀a😀b😀', 'a', '😀')]);

emit();
