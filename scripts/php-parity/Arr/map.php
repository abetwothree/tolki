<?php

/**
 * Ground truth for Arr::map().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- map null values
probe('map-null-values', "Arr::map(['first'=>'taylor','last'=>null], fn(\$v,\$k)=>\$k.'-'.\$v)", fn () => Arr::map(['first' => 'taylor', 'last' => null], static fn ($value, $key) => $key . '-' . $value));
probe('map-by-reference-strrev', "Arr::map(['first'=>'taylor','last'=>'otwell'], 'strrev')", fn () => Arr::map(['first' => 'taylor', 'last' => 'otwell'], 'strrev'));
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
probe('callback-key map', 'Arr::map([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::map($intKeyed, $cb)));

// ==== map: empty input and source immutability (ArrTest::testMapWithEmptyArray / testMap)
probe('map-empty', "Arr::map([], fn(\$v) => \$v)", fn () => Arr::map([], fn ($v) => $v));
probe('map-source-unchanged', "Arr::map does not mutate its source", function () {
    $src = ['a' => 1, 'b' => 2];
    $mapped = Arr::map($src, fn ($v) => $v * 2);

    return ['source' => $src, 'mapped' => $mapped];
});
probe('map-list-index-key', "Arr::map(['a','b'], fn(\$v,\$k) => \"\$k-\$v\")", fn () => Arr::map(['a', 'b'], fn ($v, $k) => "{$k}-{$v}"));

// fix-round-1 (Important 2): dataMap's "leaves the source untouched" was object-only.
probe('map-source-unchanged-list', "Arr::map does not mutate its list source", function () {
    $src = [1, 2];
    $mapped = Arr::map($src, fn ($v) => $v * 2);

    return ['source' => $src, 'mapped' => $mapped];
});

// ---- 5. Mapping.
probe('map-out-of-order', "Arr::map([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => \$v . '!' . \$k)", fn () => arrayablePairs(Arr::map(OUT_OF_ORDER, fn ($v, $k) => $v . '!' . $k)));
probe('map-out-of-order-callback-order', "Arr::map([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => \$v) => keys seen", fn () => keysSeen(fn ($cb) => Arr::map(OUT_OF_ORDER, $cb), fn ($v) => $v));
probe('map-mixed-callback-order', "Arr::map(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => \$v) => keys seen", fn () => keysSeen(fn ($cb) => Arr::map(MIXED, $cb), fn ($v) => $v));
probe('map-out-of-order-visit-count', "Arr::map([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v) => \$v . ++\$calls)", function () {
    $calls = 0;

    return arrayablePairs(Arr::map(OUT_OF_ORDER, function ($v) use (&$calls) {
        return $v . ++$calls;
    }));
});
// [1 => 'a', 0 => 'z', '1' => 'b'] is [1 => 'b', 0 => 'z']: 'a' is gone before any callback runs, so a
// callback that counts its calls, tests for 'a' or keys by the value tells one entry from two.
probe('map-collision-visit-count', "Arr::map([1 => 'a', 0 => 'z', '1' => 'b'], fn (\$v) => \$v . ++\$calls)", function () {
    $calls = 0;

    return arrayablePairs(Arr::map([1 => 'a', 0 => 'z', '1' => 'b'], function ($v) use (&$calls) {
        return $v . ++$calls;
    }));
});

emit();
