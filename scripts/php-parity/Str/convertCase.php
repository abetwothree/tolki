<?php

/**
 * Ground truth for Str::convertCase().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('convertCase-title-astral', "Str::convertCase('𐐨𐐨 𐐨', MB_CASE_TITLE)", fn () => Str::convertCase('𐐨𐐨 𐐨', MB_CASE_TITLE));

emit();
