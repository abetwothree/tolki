<?php

/**
 * Ground truth for Collection::skipWhile().
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

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];

$c32KeysSeen = function (callable $run, bool $answer = false): array {
    $seen = [];
    $run(function ($v, $k) use (&$seen, $answer) {
        $seen[] = [gettype($k), $k];

        return $answer;
    });

    return $seen;
};

// whereIn / whereNotIn: in_array's loose == is PHP's, not JS's
$vs = fn (array $values) => new Collection(array_map(fn ($v) => ['v' => $v], $values));
probe('C32-D-skipWhile-keyed', "(new Collection(['a' => 1, 'b' => 2, 'c' => 1]))->skipWhile(1)", fn () => pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 1]))->skipWhile(1)));
probe('C32-D-skipWhile-list-keys', "(new Collection([1, 1, 2, 1]))->skipWhile(1)", fn () => pairs((new Collection([1, 1, 2, 1]))->skipWhile(1)));
probe('C32-D-skipWhile-strict-value', "(new Collection([1, 1, 2]))->skipWhile('1')", fn () => pairs((new Collection([1, 1, 2]))->skipWhile('1')));
probe('C32-D-skipWhile-callback-key', "(new Collection(['x', 'y', 'z']))->skipWhile(fn (\$v, \$k) => \$k < 1)", fn () => pairs((new Collection(['x', 'y', 'z']))->skipWhile(fn ($v, $k) => $k < 1)));
probe('C32-D-skip-take-out-of-order-keys', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b'])): skipWhile('c'), takeUntil('a') and takeWhile('c')", fn () => [
    'skipWhile' => pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->skipWhile('c')),
    'takeUntil' => pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->takeUntil('a')),
    'takeWhile' => pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->takeWhile('c')),
]);

emit();
