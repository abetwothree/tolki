<?php

/**
 * Ground truth for Collection::each().
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
probe('C32-E-each-mixed-keys', "collect([1, 2, 'foo' => 'bar', 'bam' => 'baz'])->each(copy)", function () { $r = []; (new Collection([1, 2, 'foo' => 'bar', 'bam' => 'baz']))->each(function ($v, $k) use (&$r) { $r[] = [$k, gettype($k), $v]; }); return $r; });
probe('C32-E-each-stop-on-string-key', "same, returning false on the first string key", function () { $r = []; (new Collection([1, 2, 'foo' => 'bar', 'bam' => 'baz']))->each(function ($v, $k) use (&$r) { $r[] = [$k, gettype($k), $v]; if (is_string($k)) { return false; } }); return $r; });
probe('C32-E-each-key-type-array-items', "collect([['a' => 1], ['b' => 2]])->each(gettype(\$k)) and collect([5 => ['a' => 1]])", function () { $r = []; (new Collection([['a' => 1], ['b' => 2]]))->each(function ($v, $k) use (&$r) { $r[] = gettype($k); }); (new Collection([5 => ['a' => 1]]))->each(function ($v, $k) use (&$r) { $r[] = gettype($k); }); return $r; });
probe('C32-E-each-out-of-order-keys', "collect([2 => 'c', 0 => 'a', 1 => 'b'])->each(): keys seen", function () {
    $seen = [];
    (new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->each(function ($v, $k) use (&$seen) { $seen[] = $k; });

    return $seen;
});

emit();
