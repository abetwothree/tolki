<?php

/**
 * Ground truth for Str::ltrim().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

probe('ltrim-cases', 'Str::ltrim($value, $charlist) for each [$value, $charlist], a null charlist being the default, recorded as [$value, $charlist, result]', fn () => trimmed('ltrim', [
    ['  hello', ''], ['  hello ', null], ['  hello  ', null], ['  hello   ', null], ["  hello \n", null], ["  hello \t", null],
    ["\u{0085}a\u{0085}", null], ["\n foo bar \n", null], ["\0 foo bar \0", null],
]));

emit();
