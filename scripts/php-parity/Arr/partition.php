<?php

/**
 * Ground truth for Arr::partition().
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
probe('callback-key partition', 'Arr::partition([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::partition($intKeyed, $cb)));

// ==== partition: key preservation (ArrTest::testPartition, CollectionTest::testPartitionPreservesKeys)
probe('partition-preserves-keys', "Arr::partition(['John','Jane','Greg'], fn(\$v) => \$v !== 'Greg')", fn () => Arr::partition(['John', 'Jane', 'Greg'], fn ($v) => $v !== 'Greg'));
probe('partition-empty', "Arr::partition([], fn () => true)", fn () => Arr::partition([], fn () => true));
probe('partition-assoc-preserves-keys', "Arr::partition(['a'=>1,'b'=>2,'c'=>3], fn(\$v) => \$v > 1)", fn () => Arr::partition(['a' => 1, 'b' => 2, 'c' => 3], fn ($v) => $v > 1));

// fix-round-1: dataPartition's "passes the key to the callback" cited "callback-key
// partition", whose callback always returns true and only records key types. This is real.
probe('partition-key-predicate', "Arr::partition([1=>'a','x'=>'b'], fn(\$v,\$k)=>is_numeric(\$k))", fn () => Arr::partition([1 => 'a', 'x' => 'b'], fn ($v, $k) => is_numeric($k)));

probe('partition-out-of-order-callback-order', "Arr::partition([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::partition(OUT_OF_ORDER, $cb), true));
probe('partition-mixed-callback-order', "Arr::partition(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::partition(MIXED, $cb), true));
probe('partition-out-of-order-first-visit', "Arr::partition([2 => 'c', 0 => 'a', 1 => 'b'], a callback true for its first call)", fn () => arrayablePairs(Arr::partition(OUT_OF_ORDER, firstVisits(1))));
probe('partition-mixed-first-visit', "Arr::partition(['x' => 1, 0 => 2, 'y' => 3], a callback true for its first call)", fn () => arrayablePairs(Arr::partition(MIXED, firstVisits(1))));
probe('partition-collision', "Arr::partition([1 => 'a', 0 => 'z', '1' => 'b'], fn (\$v) => \$v === 'b')", fn () => arrayablePairs(Arr::partition([1 => 'a', 0 => 'z', '1' => 'b'], fn ($v) => $v === 'b')));

emit();
