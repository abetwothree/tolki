<?php

/**
 * Ground truth for Arr::every().
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
probe('callback-key every', 'Arr::every([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::every($intKeyed, $cb)));

probe('every-out-of-order-callback-order', "Arr::every([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::every(OUT_OF_ORDER, $cb), true));
probe('every-out-of-order-early-exit-callback-order', "Arr::every([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::every(OUT_OF_ORDER, $cb), false));
probe('every-mixed-callback-order', "Arr::every(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::every(MIXED, $cb), true));
probe('every-numeric-string-keys-callback-order', "Arr::every(['2' => 'c', '0' => 'a'], fn (\$v, \$k) => true) => keys seen, with deprecations", fn () => withDeprecations(fn () => keysSeen(fn ($cb) => Arr::every(['2' => 'c', '0' => 'a'], $cb))));
probe('every-true-key-callback-order', "Arr::every([true => 'a'], fn (\$v, \$k) => true) => keys seen, with deprecations", fn () => withDeprecations(fn () => keysSeen(fn ($cb) => Arr::every([true => 'a'], $cb))));
probe('every-null-key-callback-order', "Arr::every([null => 'a'], fn (\$v, \$k) => true) => keys seen, with deprecations", fn () => withDeprecations(fn () => keysSeen(fn ($cb) => Arr::every([null => 'a'], $cb))));
probe('every-float-key-callback-order', "Arr::every([1.5 => 'a'], fn (\$v, \$k) => true) => keys seen, with deprecations", fn () => withDeprecations(fn () => keysSeen(fn ($cb) => Arr::every([1.5 => 'a'], $cb))));
probe('every-collision-callback-pairs', "Arr::every([1 => 'a', 0 => 'z', '1' => 'b'], fn (\$v, \$k) => true) => [key, value] seen", function () {
    $seen = [];

    Arr::every([1 => 'a', 0 => 'z', '1' => 'b'], function ($value, $key) use (&$seen) {
        $seen[] = [$key, $value];

        return true;
    });

    return $seen;
});

emit();
