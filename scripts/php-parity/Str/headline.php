<?php

/**
 * Ground truth for Str::headline().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('headline-astral', "Str::headline('𐐨𐐨_𐐨') and Str::headline('😀FooBar')", fn () => [Str::headline('𐐨𐐨_𐐨'), Str::headline('😀FooBar')]);

emit();
