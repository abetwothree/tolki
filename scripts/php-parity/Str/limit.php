<?php

/**
 * Ground truth for Str::limit().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

$spaces = str_repeat(' ', 100000);
probe('limit-long-interior-run', "Str::limit() past a run of 100000 spaces: plain === \$s.'x...', and with preserveWords === 'x'.\$s.'x...'", fn () => [
    'plain' => Str::limit("{$spaces}x{$spaces}x", 200001) === "{$spaces}x...",
    'preserve-words' => Str::limit("{$spaces}x{$spaces}x y", 200001, '...', true) === "x{$spaces}x...",
]);
probe('limit-preserve-words-no-whitespace', "Str::limit(str_repeat('x', 200000), 100000, '...', true) === str_repeat('x', 100000).'...'", fn () => Str::limit(str_repeat('x', 200000), 100000, '...', true) === str_repeat('x', 100000) . '...');

emit();
