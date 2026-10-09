<?php

/**
 * Ground truth for Collection::splitIn().
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
probe('C32-G-splitIn-keeps-keys', '(new Collection(range(1, 10)))->splitIn(3)',
    fn () => $pairs((new Collection(range(1, 10)))->splitIn(3)));
probe('C32-G-splitIn-more-groups-than-items', '(new Collection([1, 2, 3]))->splitIn(5)',
    fn () => $pairs((new Collection([1, 2, 3]))->splitIn(5)));
probe('C32-G-splitIn-empty', '(new Collection([]))->splitIn(2)->all()',
    fn () => (new Collection([]))->splitIn(2)->all());
probe('C32-G-splitIn-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->splitIn(2)",
    fn () => $pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->splitIn(2)));
probe('C32-G-splitIn-counts', "(new Collection([1, 2, 3, 4, 5]))->splitIn(\$groups) for 1.5, NAN, INF and 1e19", fn () => array_map(
    fn (float $groups) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->splitIn($groups))),
    ['1.5' => 1.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19],
));

emit();
