<?php

/**
 * Ground truth for Str::camel().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

// Str::camel() lowercases a multibyte first character (laravel/framework#61545).
probe('camel-multibyte-first-space', "Str::camel('Über uns')", fn () => Str::camel('Über uns'));
probe('camel-multibyte-first-snake', "Str::camel('émile_zola')", fn () => Str::camel('émile_zola'));
probe('camel-multibyte-first-kebab', "Str::camel('Élan-vital')", fn () => Str::camel('Élan-vital'));

emit();
