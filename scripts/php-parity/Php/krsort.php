<?php

/**
 * Ground truth for PHP's krsort().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('krsort on integer keys', 'krsort([5=>"e",2=>"b",9=>"z"])', function () { $a = [5 => 'e', 2 => 'b', 9 => 'z']; krsort($a); return $a; });
probe('krsort on a packed list', 'krsort([0=>"a",1=>"b",2=>"c"])', function () { $a = [0 => 'a', 1 => 'b', 2 => 'c']; krsort($a); return $a; });
probe('krsort mixes integer and string keys', 'krsort([10=>"j","b"=>"bee",2=>"c"])', function () { $a = [10 => 'j', 'b' => 'bee', 2 => 'c']; krsort($a); return $a; });

emit();
