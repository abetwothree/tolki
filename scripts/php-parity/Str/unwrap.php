<?php

/**
 * Ground truth for Str::unwrap().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('unwrap-astral', "Str::unwrap('😀x😀', '😀') and Str::unwrap('😀[x]😀', '😀[', ']😀')", fn () => [Str::unwrap('😀x😀', '😀'), Str::unwrap('😀[x]😀', '😀[', ']😀')]);

emit();
