<?php

/**
 * Ground truth for PHP's ksort().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// B3 — krsort / ksort key ordering
probe('ksort on integer keys', 'ksort([5=>"e",2=>"b",9=>"z"])', function () { $a = [5 => 'e', 2 => 'b', 9 => 'z']; ksort($a); return $a; });

emit();
