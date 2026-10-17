<?php

/**
 * Ground truth for Arr::some().
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
probe('callback-key some', 'Arr::some([1 => "a", "x" => "b"], $cb returning false)', fn () => $keyTypes(fn ($cb) => Arr::some($intKeyed, $cb), false));
probe('some-out-of-order-callback-order', "Arr::some([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::some(OUT_OF_ORDER, $cb), false));
probe('some-out-of-order-early-exit-callback-order', "Arr::some([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::some(OUT_OF_ORDER, $cb), true));
probe('some-mixed-callback-order', "Arr::some(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::some(MIXED, $cb), false));
probe('some-collision', "Arr::some([1 => 'a', '1' => 'b'], fn (\$v) => \$v === 'a')", fn () => Arr::some([1 => 'a', '1' => 'b'], fn ($v) => $v === 'a'));

emit();
