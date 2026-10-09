<?php

/**
 * Ground truth for Collection::whereInStrict().
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
probe('C32-D-whereInStrict-array', "whereInStrict('v', [[1, 2]]) over v = [1, 2], ['1', '2']", fn () => $vs([[1, 2], ['1', '2']])->whereInStrict('v', [[1, 2]])->keys()->all());
probe('C32-D-whereInStrict-scalars', "whereInStrict('v', [1, '2', null, NAN]) over v = 1, '1', 2, '2', null, false, NAN", fn () => $vs([1, '1', 2, '2', null, false, NAN])->whereInStrict('v', [1, '2', null, NAN])->keys()->all());

emit();
