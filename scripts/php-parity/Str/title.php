<?php

/**
 * Ground truth for Str::title().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('title-astral', "Str::title('𐐨𐐨 𐐨') and Str::title('😀foo bar')", fn () => [Str::title('𐐨𐐨 𐐨'), Str::title('😀foo bar')]);

emit();
