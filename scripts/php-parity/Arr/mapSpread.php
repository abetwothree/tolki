<?php

/**
 * Ground truth for Arr::mapSpread().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- mapSpread
$ms = ['x' => [1, 'a'], 'y' => [2, 'b']];
probe('mapSpread-tuples', "Arr::mapSpread(\$ms, fn(\$n,\$c) => \"\$n-\$c\")", fn () => Arr::mapSpread($ms, fn ($n, $c) => "{$n}-{$c}"));
probe('mapSpread-tuples-key', "Arr::mapSpread(\$ms, fn(\$n,\$c,\$k) => \"\$n-\$c-\$k\")", fn () => Arr::mapSpread($ms, fn ($n, $c, $k) => "{$n}-{$c}-{$k}"));
probe('mapSpread-assoc-rows', "Arr::mapSpread(['user1'=>['name'=>'John','age'=>25]], fn(\$n,\$a)=>\"\$n is \$a\")", fn () => Arr::mapSpread(['user1' => ['name' => 'John', 'age' => 25]], fn ($n, $a) => "$n is $a"));
probe('mapSpread-scalar-row', "Arr::mapSpread(['item2'=>'simple_value'], fn(...\$a)=>count(\$a))", fn () => Arr::mapSpread(['item2' => 'simple_value'], fn (...$a) => count($a)));
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
probe('callback-key mapSpread', 'Arr::mapSpread([1 => ["a"], "x" => ["b"]], fn ($v, $k) => ...)', fn () => $keyTypes(fn ($cb) => Arr::mapSpread([1 => ['a'], 'x' => ['b']], $cb)));

/** Render a probe result as its JSON shape plus the PHP type of every top-level key. */
$d4Shape = fn (array $array): array => [
    'json' => json_decode(json_encode($array, JSON_UNESCAPED_SLASHES), true),
    'keys' => array_map(fn ($k) => gettype($k) . ':' . $k, array_keys($array)),
];

// ==== fix-round-1 Group H: the own-property channel. PHP holds '01', '' and '-1' as real
// ==== array keys, so the write is readable again and survives the other helpers; the port
// ==== stores them as the list's own properties, which only some helpers carry.
$h1Shape = function (array $a) {
    $keys = [];
    foreach (array_keys($a) as $k) {
        $keys[] = gettype($k) . ':' . $k;
    }

    return ['json' => $a, 'keys' => $keys];
};

// ==== Task D6 Step 3 (F-14): a Collection row is spread through its ITEMS, because
// ==== `$chunk[] = $key` appends to the Collection and `...$chunk` walks the Traversable.
probe('d6-map-spread-collection-row', "\$rows = [new Collection([1, 'a'])]; Arr::mapSpread(\$rows, fn (\$n, \$c, \$k) => \"\$n-\$c-\$k\")", function () {
    $rows = [new Collection([1, 'a']), new Collection([2, 'b'])];
    $listResult = Arr::mapSpread($rows, fn ($n, $c, $k) => "$n-$c-$k");
    $assocRows = ['x' => new Collection([1, 'a']), 'y' => new Collection([2, 'b'])];
    $assocResult = Arr::mapSpread($assocRows, fn ($n, $c, $k) => "$n-$c-$k");

    return [
        'list' => $listResult,
        'assoc' => $assocResult,
        'row-mutated-to' => $rows[0]->all(),
        'collection-mapSpread' => (new Collection([new Collection([1, 'a']), new Collection([2, 'b'])]))
            ->mapSpread(fn ($n, $c, $k) => "$n-$c-$k")->all(),
    ];
});

$spreadRows = [2 => ['c', 1], 0 => ['a', 2], 1 => ['b', 3]];
probe('mapSpread-out-of-order', "Arr::mapSpread([2 => ['c', 1], 0 => ['a', 2], 1 => ['b', 3]], fn (\$x, \$y, \$k) => \$x . \$y . \$k)", fn () => arrayablePairs(Arr::mapSpread($spreadRows, fn ($x, $y, $k) => $x . $y . $k)));
probe('mapSpread-out-of-order-callback-order', "Arr::mapSpread([2 => ['c', 1], 0 => ['a', 2], 1 => ['b', 3]], fn (\$x, \$y, \$k) => null) => keys seen", function () use ($spreadRows) {
    $seen = [];

    Arr::mapSpread($spreadRows, function ($x, $y, $key) use (&$seen) {
        $seen[] = $key;

        return null;
    });

    return $seen;
});
probe('mapSpread-mixed-callback-order', "Arr::mapSpread(['x' => [1, 'p'], 0 => [2, 'q'], 'y' => [3, 'r']], fn (\$x, \$y, \$k) => null) => keys seen", function () {
    $seen = [];

    Arr::mapSpread(['x' => [1, 'p'], 0 => [2, 'q'], 'y' => [3, 'r']], function ($x, $y, $key) use (&$seen) {
        $seen[] = $key;

        return null;
    });

    return $seen;
});
probe('mapSpread-collision-visit-count', "Arr::mapSpread([1 => ['a', 1], 0 => ['z', 2], '1' => ['b', 3]], fn (\$x, \$y, \$k) => \$x . \$y . \$k . '#' . ++\$calls)", function () {
    $calls = 0;

    return arrayablePairs(Arr::mapSpread([1 => ['a', 1], 0 => ['z', 2], '1' => ['b', 3]], function ($x, $y, $k) use (&$calls) {
        return $x . $y . $k . '#' . ++$calls;
    }));
});

emit();
