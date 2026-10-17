<?php

/**
 * Ground truth for Arr::reject().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- callback key types: PHP hands a callback an integer key as an int
$keyTypes = function (callable $run, mixed $result = true): array {
    $seen = [];

    try {
        $run(function ($value, $key) use (&$seen, $result) {
            $seen[] = gettype($key);

            return $result;
        });
    } catch (\Throwable) {
    }

    return $seen;
};
$intKeyed = [1 => 'a', 'x' => 'b'];
probe('callback-key reject', 'Arr::reject([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::reject($intKeyed, $cb)));
probe('reject-preserves-int-keys', "Arr::reject([1,2,3,4,5], fn(\$v) => \$v % 2 === 0)", fn () => Arr::reject([1, 2, 3, 4, 5], fn ($v) => $v % 2 === 0));

// fix-round-1: dataReject's "passes the key to the callback" cited "callback-key reject", a
// key-TYPE probe on a different fixture; this is the actual ['a'=>1,'b'=>2] call it makes.
probe('reject-key-predicate', "Arr::reject(['a'=>1,'b'=>2], fn(\$v,\$k)=>\$k==='a')", fn () => Arr::reject(['a' => 1, 'b' => 2], fn ($v, $k) => $k === 'a'));

probe('reject-out-of-order-callback-order', "Arr::reject([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::reject(OUT_OF_ORDER, $cb), false));
probe('reject-mixed-callback-order', "Arr::reject(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::reject(MIXED, $cb), false));
probe('reject-out-of-order-first-visit', "Arr::reject([2 => 'c', 0 => 'a', 1 => 'b'], a callback true for its first call)", fn () => arrayablePairs(Arr::reject(OUT_OF_ORDER, firstVisits(1))));
probe('reject-mixed-first-visit', "Arr::reject(['x' => 1, 0 => 2, 'y' => 3], a callback true for its first call)", fn () => arrayablePairs(Arr::reject(MIXED, firstVisits(1))));
probe('reject-collision', "Arr::reject([1 => 'a', 0 => 'z', '1' => 'b'], fn (\$v) => \$v === 'b')", fn () => arrayablePairs(Arr::reject([1 => 'a', 0 => 'z', '1' => 'b'], fn ($v) => $v === 'b')));

emit();
