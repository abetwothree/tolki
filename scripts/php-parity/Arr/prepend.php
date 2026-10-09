<?php

/**
 * Ground truth for Arr::prepend().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- prepend
probe('prepend-empty-key', "Arr::prepend(['one'=>1,'two'=>2], 0, '')", fn () => Arr::prepend(['one' => 1, 'two' => 2], 0, ''));
probe('prepend-null-key', "Arr::prepend(['one'=>1,'two'=>2], 0, null)", fn () => @Arr::prepend(['one' => 1, 'two' => 2], 0, null));
probe('prepend-existing-empty-key', "Arr::prepend(['one','two',''=>'three'], ['zero'], '')", fn () => Arr::prepend(['one', 'two', '' => 'three'], ['zero'], ''));
probe('prepend-existing-empty-key-null', "Arr::prepend(['one','two',''=>'three'], ['zero'], null)", fn () => @Arr::prepend(['one', 'two', '' => 'three'], ['zero'], null));
probe('prepend-existing-key-assoc', "Arr::prepend(['a'=>1,'b'=>2], 9, 'b')", fn () => Arr::prepend(['a' => 1, 'b' => 2], 9, 'b'));
probe('prepend-existing-key-assoc-keys', "array_keys(Arr::prepend(['a'=>1,'b'=>2], 9, 'b'))", fn () => array_keys(Arr::prepend(['a' => 1, 'b' => 2], 9, 'b')));
probe('prepend-zero-key-order', "array_keys(Arr::prepend(['one'=>1,'two'=>2], 0, 'zero'))", fn () => array_keys(Arr::prepend(['one' => 1, 'two' => 2], 0, 'zero')));

// ==== ArrTest parity: follow-up rows
probe('prepend-list-null-empty-key', "prepend(['one','two'], null, '')", fn () => Arr::prepend(['one', 'two'], null, ''));
probe('prepend-list-array-key', "prepend(['one','two'], ['zero'], 'key')", fn () => Arr::prepend(['one', 'two'], ['zero'], 'key'));
probe('prepend-list-array-empty-key', "prepend(['one','two'], ['zero'], '')", fn () => Arr::prepend(['one', 'two'], ['zero'], ''));

// ---- prepend's two-argument form is array_unshift
probe('prepend-assoc-no-key', "Arr::prepend(['one' => 1, 'two' => 2], 0)", fn () => Arr::prepend(['one' => 1, 'two' => 2], 0));
probe('prepend-mixed-no-key', "Arr::prepend([5 => 'five', 'one' => 1], 0)", fn () => Arr::prepend([5 => 'five', 'one' => 1], 0));
probe('prepend-negative-int-key-no-key', "Arr::prepend([-1 => 'a', 'x' => 'b'], 'z')", fn () => Arr::prepend([-1 => 'a', 'x' => 'b'], 'z'));
probe('prepend-key-cast', "@Arr::prepend(['a' => 1, 1 => 'x'], 'v', 1.5), @(['a' => 1], 'v', -2.7), (['a' => 1], 'v', true), (['a' => 1, 0 => 'x'], 'v', false)", fn () => [
    'float' => @Arr::prepend(['a' => 1, 1 => 'x'], 'v', 1.5),
    'negative-float' => @Arr::prepend(['a' => 1], 'v', -2.7),
    'true' => Arr::prepend(['a' => 1], 'v', true),
    'false' => Arr::prepend(['a' => 1, 0 => 'x'], 'v', false),
]);
probe('prepend-list-with-key', "Arr::prepend(['b', 'c'], 'a', 0), (..., 1), (..., 5), @(..., 1.5), (..., 'k'), (new Collection(['b', 'c']))->prepend('a', 0), ->prepend('a', 'k'), ->prepend('a', 1)", fn () => [
    'zero' => Arr::prepend(['b', 'c'], 'a', 0),
    'one' => Arr::prepend(['b', 'c'], 'a', 1),
    'five' => Arr::prepend(['b', 'c'], 'a', 5),
    'float' => @Arr::prepend(['b', 'c'], 'a', 1.5),
    'string' => Arr::prepend(['b', 'c'], 'a', 'k'),
    'collection-zero' => (new Collection(['b', 'c']))->prepend('a', 0)->all(),
    'collection-string' => (new Collection(['b', 'c']))->prepend('a', 'k')->all(),
    'collection-one' => (new Collection(['b', 'c']))->prepend('a', 1)->all(),
]);

/** Render a probe result as its JSON shape plus the PHP type of every top-level key. */
$d4Shape = fn (array $array): array => [
    'json' => json_decode(json_encode($array, JSON_UNESCAPED_SLASHES), true),
    'keys' => array_map(fn ($k) => gettype($k) . ':' . $k, array_keys($array)),
];

$d4Set = function (array $array, string $key) use ($d4Shape): array {
    Arr::set($array, $key, 'V');

    return $d4Shape($array);
};

// ==== Task D6 citation audit: prepend onto an EXISTING integer key of a keyed array, and
// ==== the list form of the nested-list descend the row above records for a keyed one.
probe('d6-prepend-existing-integer-key', "Arr::prepend([1 => 'a', 'b' => 2], 'z', 1)", function () {
    $result = Arr::prepend([1 => 'a', 'b' => 2], 'z', 1);

    return ['result' => $result, 'keys' => array_keys($result)];
});

// ==== fix-round-3 Group E: obj-writes.test-d.ts:149 asserted a prepend call this row
// ==== never recorded, and :169's `-0.5` note had no probe behind it at all.
probe('r3-prepend-extra-keys', "Arr::prepend([1 => 'a', 2 => 'b', 'c' => 3], 'z', 2) and @Arr::prepend(['a' => 1], 'v', -0.5)", function () {
    $middle = Arr::prepend([1 => 'a', 2 => 'b', 'c' => 3], 'z', 2);
    $minusHalf = @Arr::prepend(['a' => 1], 'v', -0.5);

    return [
        'existing-integer-key-2' => [
            'result' => $middle,
            'keys' => array_map(fn ($key) => get_debug_type($key) . ':' . $key, array_keys($middle)),
        ],
        'negative-float-above-minus-one' => [
            'result' => $minusHalf,
            'keys' => array_map(fn ($key) => get_debug_type($key) . ':' . $key, array_keys($minusHalf)),
        ],
    ];
});

probe('prepend-out-of-order', "Arr::prepend([2 => 'c', 0 => 'a', 1 => 'b'], 'z')", fn () => arrayablePairs(Arr::prepend(OUT_OF_ORDER, 'z')));
probe('prepend-mixed', "Arr::prepend(['x' => 1, 0 => 2, 'y' => 3], 'z')", fn () => arrayablePairs(Arr::prepend(MIXED, 'z')));
probe('prepend-out-of-order-string-key', "Arr::prepend([2 => 'c', 0 => 'a', 1 => 'b'], 'z', 'k')", fn () => arrayablePairs(Arr::prepend(OUT_OF_ORDER, 'z', 'k')));
probe('prepend-out-of-order-existing-int-key', "Arr::prepend([2 => 'c', 0 => 'a', 1 => 'b'], 'z', 0)", fn () => arrayablePairs(Arr::prepend(OUT_OF_ORDER, 'z', 0)));
probe('prepend-negative-key-first', "Arr::prepend([-1 => 'm', 5 => 'f'], 'z')", fn () => arrayablePairs(Arr::prepend([-1 => 'm', 5 => 'f'], 'z')));
probe('prepend-collision', "Arr::prepend([1 => 'a', 'x' => 'b', '1' => 'c'], 'z')", fn () => arrayablePairs(Arr::prepend([1 => 'a', 'x' => 'b', '1' => 'c'], 'z')));

emit();
