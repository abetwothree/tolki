<?php

/**
 * Ground truth for PHP's sort().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// B6 — numeric-string ordering
probe('sort orders numeric strings numerically', 'sort(["9","10"])', function () { $a = ['9', '10']; sort($a); return $a; });

emit();
