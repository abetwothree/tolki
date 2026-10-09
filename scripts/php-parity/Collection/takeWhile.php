<?php

/**
 * Ground truth for Collection::takeWhile().
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
probe('C32-D-takeWhile-strict-value', "(new Collection([1, 1, 2]))->takeWhile('1')", fn () => pairs((new Collection([1, 1, 2]))->takeWhile('1')));
probe('C32-D-takeWhile-keyed', "(new Collection(['a' => 1, 'b' => 1, 'c' => 2, 'd' => 1]))->takeWhile(1)", fn () => pairs((new Collection(['a' => 1, 'b' => 1, 'c' => 2, 'd' => 1]))->takeWhile(1)));
probe('C32-D-takeWhile-callback-key', "(new Collection(['x', 'y', 'z']))->takeWhile(fn (\$v, \$k) => \$k < 2)", fn () => pairs((new Collection(['x', 'y', 'z']))->takeWhile(fn ($v, $k) => $k < 2)));
probe('C32-D-takeWhile-null-value', "(new Collection([null, null, 0]))->takeWhile(null)", fn () => pairs((new Collection([null, null, 0]))->takeWhile(null)));

emit();
