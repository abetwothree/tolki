<?php

/**
 * Ground truth for Collection::reduce().
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

// EnumeratesValues.php:845 starts reduce at $initial and never throws; an empty backing
// with no initial value simply hands $initial (null) straight back.
probe('reduce-empty-no-initial', "(new Collection([]))->reduce(fn (\$c, \$v) => \$c + \$v) and the assoc backing", fn () => [
    'list' => (new Collection([]))->reduce(fn ($c, $v) => $c + $v),
    'assoc' => (new Collection((object) []))->reduce(fn ($c, $v) => $c + $v),
]);

// reduce without an initial value: $initial = null, every item reaches the callback
probe('C32-H-reduce-no-initial-trace', "carries/values/keys seen by (new Collection([10, 20, 30]))->reduce(fn (\$c, \$v, \$k) => \$v)", function () { $seen = []; (new Collection([10, 20, 30]))->reduce(function ($c, $v, $k) use (&$seen) { $seen[] = [$c, $v, $k]; return $v; }); return $seen; });
probe('C32-H-reduce-no-initial-single', "(new Collection([5]))->reduce(fn (\$c, \$v) => [\$c, \$v])", fn () => (new Collection([5]))->reduce(fn ($c, $v) => [$c, $v]));
probe('C32-H-reduce-family-out-of-order', "[reduce, reduceInto, reduceSpread] joining each key and value of [2 => 'c', 0 => 'a', 1 => 'b'] onto ''", fn () => [
    (new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->reduce(fn ($c, $v, $k) => $c.$k.$v, ''),
    (new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->reduceInto('', function (&$c, $v, $k) { $c .= $k.$v; }),
    (new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->reduceSpread(fn ($c, $v, $k) => [$c.$k.$v], ''),
]);

emit();
