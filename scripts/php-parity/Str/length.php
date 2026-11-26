<?php

/**
 * Ground truth for Str::length().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('length-astral', "Str::length() of '😀😀😀', '𝒳', \"e\u{0301}\", the ZWJ family emoji and ''", fn () => [Str::length('😀😀😀'), Str::length('𝒳'), Str::length("e\u{0301}"), Str::length("\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}"), Str::length('')]);

emit();
