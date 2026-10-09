<?php

/**
 * Ground truth for Collection::sliding().
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
probe('C32-G-sliding-assoc', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->sliding()",
    fn () => $pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->sliding()));
probe('C32-G-sliding-size-over-count', '(new Collection([1, 2, 3]))->sliding(5)->all()',
    fn () => (new Collection([1, 2, 3]))->sliding(5)->all());
probe('C32-G-sliding-subclass', 'get_class of (new SubCollection([1, 2, 3]))->sliding() and of its first window', function () {
    $sub = new class([1, 2, 3]) extends Collection {};

    return [get_class($sub->sliding()) === get_class($sub), get_class($sub->sliding()->first()) === get_class($sub)];
});
probe('C32-G-sliding-counts', "(new Collection([1, 2, 3, 4, 5]))->sliding(\$size) for 1.5, 2.5, NAN, INF and 1e19, ->sliding(2, \$step) for 1.5, NAN, INF and 1e19, and (new Collection([]))->sliding(2, INF)", fn () => [
    'size' => array_map(fn (float $size) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->sliding($size))), ['1.5' => 1.5, '2.5' => 2.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19]),
    'step' => array_map(fn (float $step) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->sliding(2, $step))), ['1.5' => 1.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19]),
    'empty step INF' => c32c_outcome(fn () => $pairs(@(new Collection([]))->sliding(2, INF))),
]);
probe('C32-G-sliding-out-of-order-keys', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->sliding()", fn () => $pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->sliding()));

emit();
