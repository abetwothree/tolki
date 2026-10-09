<?php

/**
 * Ground truth for Arr::keyBy().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- keyBy
probe('keyBy-assoc-rows', "Arr::keyBy(['x'=>['id'=>'123','data'=>'abc'],'y'=>['id'=>'345','data'=>'def'],'z'=>['id'=>'498','data'=>'hgi']], 'id')", fn () => Arr::keyBy(['x' => ['id' => '123', 'data' => 'abc'], 'y' => ['id' => '345', 'data' => 'def'], 'z' => ['id' => '498', 'data' => 'hgi']], 'id'));
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
probe('callback-key keyBy', 'Arr::keyBy([1 => ["id" => 1], "x" => ["id" => 2]], $cb)', fn () => $keyTypes(fn ($cb) => Arr::keyBy([1 => ['id' => 1], 'x' => ['id' => 2]], $cb), 'k'));
probe('keyBy callback receives the key', 'Arr::keyBy(["x" => ["id" => 1]], fn ($item, $key) => $key)', fn () => Arr::keyBy(['x' => ['id' => 1]], fn ($item, $key) => $key));

// ---- keyBy hands a list callback the item's index
probe('keyBy-list-callback-key', "Arr::keyBy([['id' => 1], ['id' => 2]], fn (\$item, \$key) => 'k' . \$key)", fn () => Arr::keyBy([['id' => 1], ['id' => 2]], fn ($item, $key) => 'k' . $key));

// ---- keyBy stores the resolved key as an array offset: a bool is 0/1, null is '', a float truncates (INF, NAN: 0)
probe('keyBy-scalar-key-cast', "@Arr::keyBy([['v' => 1]], fn () => \$key) for true, false, null, 1.5, -1.5, -0.0, INF, NAN, 1e20, '05', '5': the key stored, as [type, string]", function () {
    $keys = ['true' => true, 'false' => false, 'null' => null, '1.5' => 1.5, '-1.5' => -1.5, '-0.0' => -0.0, 'INF' => INF, 'NAN' => NAN, '1e20' => 1e20, "'05'" => '05', "'5'" => '5'];
    $result = [];

    foreach ($keys as $label => $key) {
        $stored = array_keys(@Arr::keyBy([['v' => 1]], fn () => $key))[0];
        $result[$label] = [gettype($stored), (string) $stored];
    }

    return $result + ['field' => array_keys(Arr::keyBy([['k' => true], ['k' => false], ['k' => null]], 'k'))];
});

$keyedRows = [2 => ['id' => 'r'], 0 => ['id' => 'p'], 1 => ['id' => 'q']];
$collidingRows = [2 => ['id' => 'x', 'n' => 'c'], 0 => ['id' => 'x', 'n' => 'a'], 1 => ['id' => 'y', 'n' => 'b']];
probe('keyBy-out-of-order-rows', "Arr::keyBy([2 => ['id' => 'r'], 0 => ['id' => 'p'], 1 => ['id' => 'q']], 'id')", fn () => arrayablePairs(Arr::keyBy($keyedRows, 'id')));
probe('keyBy-out-of-order-rows-collision', "Arr::keyBy([2 => ['id' => 'x', 'n' => 'c'], 0 => ['id' => 'x', 'n' => 'a'], 1 => ['id' => 'y', 'n' => 'b']], 'id')", fn () => arrayablePairs(Arr::keyBy($collidingRows, 'id')));
probe('keyBy-out-of-order-rows-callback-order', "Arr::keyBy([2 => ['id' => 'r'], 0 => ['id' => 'p'], 1 => ['id' => 'q']], fn (\$item, \$key) => \$item['id']) => keys seen", fn () => keysSeen(fn ($cb) => Arr::keyBy($keyedRows, $cb), fn ($item) => $item['id']));
probe('keyBy-mixed-callback', "Arr::keyBy(['x' => 1, 0 => 2, 'y' => 3], fn (\$item, \$key) => 'k' . \$item)", fn () => arrayablePairs(Arr::keyBy(MIXED, fn ($item, $key) => 'k' . $item)));
probe('keyBy-mixed-callback-order', "Arr::keyBy(['x' => 1, 0 => 2, 'y' => 3], fn (\$item, \$key) => 'k' . \$item) => keys seen", fn () => keysSeen(fn ($cb) => Arr::keyBy(MIXED, $cb), fn ($item) => 'k' . $item));

emit();
