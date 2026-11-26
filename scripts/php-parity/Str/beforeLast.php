<?php

/**
 * Ground truth for Str::beforeLast().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('beforeLast-astral', "Str::beforeLast('😀a😀b', 'b') and Str::beforeLast('😀a😀b', '😀')", fn () => [Str::beforeLast('😀a😀b', 'b'), Str::beforeLast('😀a😀b', '😀')]);

emit();
