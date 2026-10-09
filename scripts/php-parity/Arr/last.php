<?php

/**
 * Ground truth for Arr::last().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('last-assoc-key-callback', "Arr::last(['first' => 100, 'second' => 200, 'third' => 300], fn (\$v, \$k) => \$k !== 'third')", fn () => Arr::last(['first' => 100, 'second' => 200, 'third' => 300], fn ($v, $k) => $k !== 'third'));
probe('last-assoc-no-match', "Arr::last(['a' => 100, 'b' => 200, 'c' => 300], fn (\$v) => \$v > 300)", fn () => Arr::last(['a' => 100, 'b' => 200, 'c' => 300], fn ($v) => $v > 300));
probe('last-assoc-closure-default', "Arr::last(assoc, fn > 300, fn () => 'baz')", fn () => Arr::last(['a' => 100, 'b' => 200, 'c' => 300], fn ($v) => $v > 300, fn () => 'baz'));
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
probe('callback-key last', 'Arr::last([1 => "a", "x" => "b"], $cb returning false)', fn () => $keyTypes(fn ($cb) => Arr::last($intKeyed, $cb), false));
probe('arr-last-out-of-order', 'Arr::last([2 => "c", 0 => "a", 1 => "b"])', fn () => Arr::last(e0Base()));
probe('arr-last-out-of-order-callback', "Arr::last(base, fn (\$v) => \$v !== 'b')", fn () => Arr::last(e0Base(), fn ($v) => $v !== 'b'));
probe('arr-last-out-of-order-key-order', '$keys seen by Arr::last(base, $cb returning false)', function () {
    $seen = [];
    Arr::last(e0Base(), function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return false;
    });

    return $seen;
});
probe('last-out-of-order', "Arr::last([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => Arr::last(OUT_OF_ORDER));
probe('last-mixed', "Arr::last(['x' => 1, 0 => 2, 'y' => 3])", fn () => Arr::last(MIXED));
probe('last-out-of-order-callback', "Arr::last([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v) => \$v !== 'b')", fn () => Arr::last(OUT_OF_ORDER, fn ($v) => $v !== 'b'));
probe('last-out-of-order-callback-order', "Arr::last([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::last(OUT_OF_ORDER, $cb), false));
probe('last-collision', "Arr::last([1 => 'a', 0 => 'z', '1' => 'b'])", fn () => Arr::last([1 => 'a', 0 => 'z', '1' => 'b']));

emit();
