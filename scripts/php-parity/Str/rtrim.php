<?php

/**
 * Ground truth for Str::rtrim().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

$letters = str_repeat('x', 120000);
probe('rtrim-charlist-long-interior-run', "Str::rtrim(\$x.'['.\$x.'y'.\$x, 'x') === \$x.'['.\$x.'y' for \$x = str_repeat('x', 120000)", fn () => Str::rtrim("{$letters}[{$letters}y{$letters}", 'x') === "{$letters}[{$letters}y");
probe('rtrim-cases', 'Str::rtrim($value, $charlist) for each [$value, $charlist], a null charlist being the default, recorded as [$value, $charlist, result]', fn () => trimmed('rtrim', [
    ['hello  ', ''], ["line1\nline2   ", null], ["line1\n    line2\n        ", null], ["hello\n    world\n      ", null], ["line1\n\nline2\n   ", null],
    ["\u{0085}a\u{0085}", null], ["a\u{1D159}\u{E0020}", null], ['a😀😀b😀', '😀'], ['a]]', ']'],
]));

emit();
