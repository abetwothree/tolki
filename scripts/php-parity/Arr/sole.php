<?php

/**
 * Ground truth for Arr::sole().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- sole
probe('sole-rows-callback', "Arr::sole(['a'=>['name'=>'foo'],'b'=>['name'=>'bar']], fn(\$v)=>\$v['name']==='foo')", fn () => Arr::sole(['a' => ['name' => 'foo'], 'b' => ['name' => 'bar']], fn (array $value) => $value['name'] === 'foo'));
probe('sole-assoc-multi-callback', "Arr::sole(['a'=>'baz','b'=>'foo','c'=>'baz'], fn(\$v)=>\$v==='baz')", fn () => Arr::sole(['a' => 'baz', 'b' => 'foo', 'c' => 'baz'], fn ($v) => $v === 'baz'));

// ==== ArrTest parity: follow-up rows
probe('sole-none', "Arr::sole(['a'=>'foo'], fn(\$v)=>\$v==='baz')", fn () => Arr::sole(['a' => 'foo'], fn ($v) => $v === 'baz'));
probe('sole-multi-list', "Arr::sole(['baz','foo','baz'], fn(\$v)=>\$v==='baz')", fn () => Arr::sole(['baz', 'foo', 'baz'], fn ($v) => $v === 'baz'));
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
probe('callback-key sole', 'Arr::sole([1 => "a", "x" => "b"], $cb returning false)', fn () => $keyTypes(fn ($cb) => Arr::sole($intKeyed, $cb), false));

// ==== sole: the empty-input throw with no callback (the callback forms are earlier in this file).
probe('sole-empty-no-callback', "Arr::sole([])", fn () => Arr::sole([]));
probe('sole-multi-no-callback', "Arr::sole(['a' => 1, 'b' => 2])", fn () => Arr::sole(['a' => 1, 'b' => 2]));
probe('sole-single-no-callback', "Arr::sole(['only' => 42])", fn () => Arr::sole(['only' => 42]));

probe('sole-out-of-order-callback', "Arr::sole([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v) => \$v === 'c')", fn () => Arr::sole(OUT_OF_ORDER, fn ($v) => $v === 'c'));
probe('sole-out-of-order-callback-order', "Arr::sole([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => \$v === 'c') => keys seen", fn () => keysSeen(fn ($cb) => Arr::sole(OUT_OF_ORDER, $cb), fn ($v) => $v === 'c'));
probe('sole-out-of-order-first-call-only', "Arr::sole([2 => 'c', 0 => 'a', 1 => 'b'], a callback true only on its first call)", fn () => Arr::sole(OUT_OF_ORDER, firstVisits(1)));
probe('sole-mixed-callback-order', "Arr::sole(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => \$v === 2) => keys seen", fn () => keysSeen(fn ($cb) => Arr::sole(MIXED, $cb), fn ($v) => $v === 2));
probe('sole-collision', "Arr::sole([1 => 'a', '1' => 'b'])", fn () => Arr::sole([1 => 'a', '1' => 'b']));
probe('sole-true-key-collision', "Arr::sole([1 => 'a', true => 'b'])", fn () => Arr::sole([1 => 'a', true => 'b']));

emit();
