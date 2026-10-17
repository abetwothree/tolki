<?php

/**
 * Ground truth for Str::of()->trim().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

probe('stringable-trim-empty-charlist', "(string) Str::of('  hello  ')->trim(''), ->ltrim('') and ->rtrim('')", fn () => [(string) Str::of('  hello  ')->trim(''), (string) Str::of('  hello  ')->ltrim(''), (string) Str::of('  hello  ')->rtrim('')]);

emit();
