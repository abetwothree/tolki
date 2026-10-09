<?php

/**
 * Ground truth for Collection::split().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

// ---- Family G ------------------------------------------------------------

// Key-preserving probes return [[key, value], ...] so integer keys and order survive json_encode.
$pairs = function ($items) use (&$pairs) {
    $out = [];
    foreach ($items instanceof Collection ? $items->all() : $items as $k => $v) {
        $out[] = [$k, $v instanceof Collection ? $pairs($v) : $v];
    }

    return $out;
};
probe('C32-G-split-int-keys-renumber', "(new Collection([5 => 'a', 6 => 'b', 7 => 'c']))->split(2)",
    fn () => $pairs((new Collection([5 => 'a', 6 => 'b', 7 => 'c']))->split(2)));
probe('C32-G-split-assoc-keys', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->split(2)",
    fn () => $pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->split(2)));
probe('C32-G-split-more-groups-than-items', '(new Collection([1, 2, 3]))->split(5)',
    fn () => $pairs((new Collection([1, 2, 3]))->split(5)));
probe('C32-G-split-infinite-groups', '(new Collection([1, 2, 3]))->split(INF)',
    fn () => @(new Collection([1, 2, 3]))->split(INF)->all());
probe('C32-G-split-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->split(2) and (new Collection([2 => 'c', 'x' => 'a', 1 => 'b']))->split(2)", fn () => [
    'out-of-order' => $pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->split(2)),
    'mixed' => $pairs((new Collection([2 => 'c', 'x' => 'a', 1 => 'b']))->split(2)),
]);
// split(1e19) is left out: its loop counts to the number of groups, so PHP never returns.
probe('C32-G-split-counts', "(new Collection([1, 2, 3, 4, 5]))->split(\$groups) for 1.5, 2.5, 5.5 and NAN, and (new Collection([]))->split(\$groups) for NAN and INF", fn () => [
    'groups' => array_map(fn (float $groups) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->split($groups))), ['1.5' => 1.5, '2.5' => 2.5, '5.5' => 5.5, 'NAN' => NAN]),
    'empty' => array_map(fn (float $groups) => c32c_outcome(fn () => $pairs(@(new Collection([]))->split($groups))), ['NAN' => NAN, 'INF' => INF]),
]);

emit();
