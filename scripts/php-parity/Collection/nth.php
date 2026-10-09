<?php

/**
 * Ground truth for Collection::nth().
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
probe('C32-G-nth-assoc', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5]))->nth(2)",
    fn () => $pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5]))->nth(2)));
probe('C32-G-nth-and-split-by-a-count-cast-to-0', "(new Collection([1, 2, 3]))->nth(2**64) and ->split(2**64), whose % casts the count to the int 0: the class and message thrown", fn () => [
    'nth' => c32c_outcome(fn () => @(new Collection([1, 2, 3]))->nth(18446744073709551616.0)->all()),
    'split' => c32c_outcome(fn () => @(new Collection([1, 2, 3]))->split(18446744073709551616.0)->all()),
]);
probe('C32-G-nth-counts', "(new Collection([1, 2, 3, 4, 5]))->nth(\$step) for 1.5, 2.5, NAN, INF and 1e19, ->nth(1, \$offset) for 1.5, NAN and 1e19, and (new Collection([]))->nth(NAN)", fn () => [
    'step' => array_map(fn (float $step) => c32c_outcome(fn () => @(new Collection([1, 2, 3, 4, 5]))->nth($step)->all()), ['1.5' => 1.5, '2.5' => 2.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19]),
    'offset' => array_map(fn (float $offset) => c32c_outcome(fn () => @(new Collection([1, 2, 3, 4, 5]))->nth(1, $offset)->all()), ['1.5' => 1.5, 'NAN' => NAN, '1e19' => 1e19]),
    'empty NAN' => c32c_outcome(fn () => @(new Collection([]))->nth(NAN)->all()),
]);
probe('C32-G-nth-out-of-order-offset', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->nth(1, \$offset) for NAN and 1e19: the class and message thrown", fn () => array_map(
    fn (float $offset) => c32c_outcome(fn () => @(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->nth(1, $offset)->all()),
    ['NAN' => NAN, '1e19' => 1e19],
));

emit();
