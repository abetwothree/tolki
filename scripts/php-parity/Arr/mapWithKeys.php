<?php

/**
 * Ground truth for Arr::mapWithKeys().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('Arr::mapWithKeys numeric-like keys', 'Arr::mapWithKeys([...])', function () {
    return Arr::mapWithKeys(['a' => 1, 'b' => 2], fn ($v) => [$v => $v]);
});

probe('X30 mapWithKeys returns one plain container', "Arr::mapWithKeys(...)", function () {
    $records = [['id' => 3, 'name' => 'c'], ['id' => 1, 'name' => 'a'], ['id' => 2, 'name' => 'b']];

    return [
        'stringKeys' => Arr::mapWithKeys($records, fn ($i) => [$i['name'] => $i['id']]),
        'numericKeys' => Arr::mapWithKeys($records, fn ($i) => [$i['id'] => $i['name']]),
    ];
});
probe('mapWithKeys-assoc-rows', "Arr::mapWithKeys(['b'=>[...],'c'=>[...],'d'=>[...]], fn(\$p)=>[\$p['name']=>\$p['type']])", fn () => Arr::mapWithKeys(['b' => ['name' => 'Blastoise', 'type' => 'Water', 'idx' => 9], 'c' => ['name' => 'Charmander', 'type' => 'Fire', 'idx' => 4], 'd' => ['name' => 'Dragonair', 'type' => 'Dragon', 'idx' => 148]], fn ($p) => [$p['name'] => $p['type']]));
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
probe('callback-key mapWithKeys', 'Arr::mapWithKeys([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::mapWithKeys($intKeyed, $cb), ['k' => 'v']));

// ==== Task D6 Step 4b: what mapWithKeys does with a LIST return (the PHP equivalent of a
// ==== JavaScript [key, value] tuple). Both wrap the same foreach over the returned array.
probe('d6-map-with-keys-list-return', "Arr::mapWithKeys(['a' => 1, 'b' => 2], fn (\$v, \$k) => [\"key_\$k\", \$v * 2])", function () {
    return [
        'arr-assoc' => Arr::mapWithKeys(['a' => 1, 'b' => 2], fn ($v, $k) => ["key_$k", $v * 2]),
        'collection-assoc' => (new Collection(['a' => 1, 'b' => 2]))->mapWithKeys(fn ($v, $k) => ["key_$k", $v * 2])->all(),
        'collection-list' => (new Collection([1, 2]))->mapWithKeys(fn ($v, $k) => ["key_$k", $v * 2])->all(),
        'arr-single-row' => Arr::mapWithKeys(['a' => 1], fn ($v, $k) => ["key_$k", $v * 2]),
        'arr-pair-return' => Arr::mapWithKeys(['a' => 1, 'b' => 2], fn ($v, $k) => [$k => $v * 2]),
    ];
});

probe('mapWithKeys-out-of-order', "Arr::mapWithKeys([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => ['k' . \$k => \$v])", fn () => arrayablePairs(Arr::mapWithKeys(OUT_OF_ORDER, fn ($v, $k) => ['k' . $k => $v])));
probe('mapWithKeys-mixed', "Arr::mapWithKeys(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => ['k' . \$k => \$v])", fn () => arrayablePairs(Arr::mapWithKeys(MIXED, fn ($v, $k) => ['k' . $k => $v])));
probe('mapWithKeys-out-of-order-collision', "Arr::mapWithKeys([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v) => ['same' => \$v])", fn () => arrayablePairs(Arr::mapWithKeys(OUT_OF_ORDER, fn ($v) => ['same' => $v])));
probe('mapWithKeys-out-of-order-int-collision', "Arr::mapWithKeys([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v) => [0 => \$v])", fn () => arrayablePairs(Arr::mapWithKeys(OUT_OF_ORDER, fn ($v) => [0 => $v])));
probe('mapWithKeys-out-of-order-callback-order', "Arr::mapWithKeys([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => []) => keys seen", fn () => keysSeen(fn ($cb) => Arr::mapWithKeys(OUT_OF_ORDER, $cb), fn () => []));
probe('mapWithKeys-mixed-callback-order', "Arr::mapWithKeys(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => []) => keys seen", fn () => keysSeen(fn ($cb) => Arr::mapWithKeys(MIXED, $cb), fn () => []));
probe('mapWithKeys-collision', "Arr::mapWithKeys([1 => 'a', 0 => 'z', '1' => 'b'], fn (\$v, \$k) => [\$v => \$k])", fn () => arrayablePairs(Arr::mapWithKeys([1 => 'a', 0 => 'z', '1' => 'b'], fn ($v, $k) => [$v => $k])));

emit();
