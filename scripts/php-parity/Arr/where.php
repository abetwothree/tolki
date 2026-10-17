<?php

/**
 * Ground truth for Arr::where().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- where
probe('whereKey-numeric', "Arr::where(['10'=>1,'foo'=>3,20=>2], fn(\$v,\$k)=>is_numeric(\$k))", fn () => Arr::where(['10' => 1, 'foo' => 3, 20 => 2], fn ($v, $k) => is_numeric($k)));
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
probe('callback-key where', 'Arr::where([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::where($intKeyed, $cb)));

// ==== where / reject / whereNotNull: key preservation and the no-callback reject form
probe('where-preserves-int-keys', "Arr::where(['100','200','300','400'], fn(\$v) => \$v === '200' || \$v === '400')", fn () => Arr::where(['100', '200', '300', '400'], fn ($v) => $v === '200' || $v === '400'));

// fix-round-1: dataWhere's "passes the key to the callback" list-backed assertion
// (['a','b','c'], key>0) wasn't the call "callback-key where" actually makes (that probe
// only records key TYPES on a different fixture). This is the real call.
probe('where-list-key-predicate', "array_values(Arr::where(['a','b','c'], fn(\$v,\$k)=>\$k>0))", fn () => array_values(Arr::where(['a', 'b', 'c'], fn ($v, $k) => $k > 0)));

probe('where-out-of-order-callback-order', "Arr::where([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::where(OUT_OF_ORDER, $cb), true));
probe('where-mixed-callback-order', "Arr::where(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::where(MIXED, $cb), true));
probe('where-out-of-order-first-two-visits', "Arr::where([2 => 'c', 0 => 'a', 1 => 'b'], a callback true for its first two calls)", fn () => arrayablePairs(Arr::where(OUT_OF_ORDER, firstVisits(2))));
probe('where-mixed-first-visit', "Arr::where(['x' => 1, 0 => 2, 'y' => 3], a callback true for its first call)", fn () => arrayablePairs(Arr::where(MIXED, firstVisits(1))));
probe('where-collision', "Arr::where([1 => 'a', 0 => 'z', '1' => 'b'], fn (\$v) => \$v === 'a')", fn () => arrayablePairs(Arr::where([1 => 'a', 0 => 'z', '1' => 'b'], fn ($v) => $v === 'a')));

emit();
