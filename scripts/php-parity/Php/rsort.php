<?php

/**
 * Ground truth for PHP's rsort().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('rsort orders numeric strings numerically', 'rsort(["9","10"])', function () { $a = ['9', '10']; rsort($a); return $a; });

emit();
