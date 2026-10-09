<?php

/**
 * Ground truth for Collection::whereNotIn().
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
probe('C32-D-whereNotIn-null-loose', "whereNotIn('v', [null]) over v = 0, '', false, null, '0', 'a', []", fn () => $vs([0, '', false, null, '0', 'a', []])->whereNotIn('v', [null])->keys()->all());
probe('C32-D-whereNotIn-true-loose', "whereNotIn('v', [true]) over v = 'x', 1, 0, '', null, '0', [1]", fn () => $vs(['x', 1, 0, '', null, '0', [1]])->whereNotIn('v', [true])->keys()->all());
probe('C32-D-whereNotIn-numbers-and-strings-loose', "whereNotIn('v', [1, 'abc']) over v = 1, '1', 'abc', 'ABC', 2, true", fn () => $vs([1, '1', 'abc', 'ABC', 2, true])->whereNotIn('v', [1, 'abc'])->keys()->all());

emit();
