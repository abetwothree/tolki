<?php

/**
 * Ground truth for Collection::whereIn().
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
probe('C32-D-whereIn-null-loose', "whereIn('v', [null]) over v = 0, '', false, null, '0', 'a', []", fn () => $vs([0, '', false, null, '0', 'a', []])->whereIn('v', [null])->keys()->all());
probe('C32-D-whereIn-numeric-string-loose', "whereIn('v', ['1e1']) over v = 10, '10', '1e1', '010', 'x'", fn () => $vs([10, '10', '1e1', '010', 'x'])->whereIn('v', ['1e1'])->keys()->all());
probe('C32-D-whereIn-true-loose', "whereIn('v', [true]) over v = 'x', 1, 0, '', null, '0', [1]", fn () => $vs(['x', 1, 0, '', null, '0', [1]])->whereIn('v', [true])->keys()->all());
probe('C32-D-whereIn-array-loose', "whereIn('v', [[1, 2]]) over v = [1, 2], ['1', '2'], [2, 1]", fn () => $vs([[1, 2], ['1', '2'], [2, 1]])->whereIn('v', [[1, 2]])->keys()->all());
probe('C32-D-whereIn-collection-values', "whereIn('v', new Collection(['a' => 1, 'b' => 3])) over v = 1..4", fn () => $vs([1, 2, 3, 4])->whereIn('v', new Collection(['a' => 1, 'b' => 3]))->keys()->all());
probe('C32-D-whereIn-null-key', "(new Collection([1, 2, 3]))->whereIn(null, [1, 3])", fn () => pairs((new Collection([1, 2, 3]))->whereIn(null, [1, 3])));
probe('C32-D-whereIn-numbers-and-strings-loose', "whereIn('v', [1, '2', ' 3', '4 ', 'abc', '0.5']) over v = 1, '1', '1.0', 2, '02', 3, '3', 4, 'ABC', 'abc', 0.5, '.5', '5'", fn () => $vs([1, '1', '1.0', 2, '02', 3, '3', 4, 'ABC', 'abc', 0.5, '.5', '5'])->whereIn('v', [1, '2', ' 3', '4 ', 'abc', '0.5'])->keys()->all());
probe('C32-D-whereIn-integer-strings-past-2-53-loose', "whereIn('v', ['9007199254740993']) over v = 9007199254740992, '9007199254740993', '9007199254740993.0', '9007199254740992'", fn () => $vs([9007199254740992, '9007199254740993', '9007199254740993.0', '9007199254740992'])->whereIn('v', ['9007199254740993'])->keys()->all());
probe('C32-D-whereIn-inf-loose', "whereIn('v', ['INF', '1e999']) over v = INF, 'INF', '1e999', '1e1000', 'inf'", fn () => $vs([INF, 'INF', '1e999', '1e1000', 'inf'])->whereIn('v', ['INF', '1e999'])->keys()->all());
probe('C32-D-where-in-collection-rows', "c32c_rows(list | keyed): whereIn('k', ['a']) / whereNotIn('k', ['a']) / whereNotBetween('v', [2, 2]) keys, containsStrict('k', 'a')", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->whereIn('k', ['a'])->keys()->all(),
    c32c_rows($keyed)->whereNotIn('k', ['a'])->keys()->all(),
    c32c_rows($keyed)->whereNotBetween('v', [2, 2])->keys()->all(),
    c32c_rows($keyed)->containsStrict('k', 'a'),
], ['list' => false, 'keyed' => true]));

emit();
