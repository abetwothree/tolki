<?php

/**
 * Ground truth for Str::charAt().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('charAt-astral', "Str::charAt('😀a', …) at 1, 0, -2, 2 and -3, and Str::charAt('', 0)", fn () => [Str::charAt('😀a', 1), Str::charAt('😀a', 0), Str::charAt('😀a', -2), Str::charAt('😀a', 2), Str::charAt('😀a', -3), Str::charAt('', 0)]);

emit();
