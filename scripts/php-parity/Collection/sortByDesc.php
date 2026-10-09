<?php

/**
 * Ground truth for Collection::sortByDesc().
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

// B5 — sortByMany's comparison is <=>, not a string cast
$mixed = [['item' => '1'], ['item' => '10'], ['item' => 5], ['item' => 20]];
probe('sortByMany forced descending over the same mixed items', 'collect($mixed)->sortByDesc(["item"])->values()->pluck("item")', fn () => collect($mixed)->sortByDesc(['item'])->values()->pluck('item')->all());

// B6 — the same ordering seen through every sort entry point the port mirrors.
$mixed = ['9', '10', '1', 5];
probe('Collection::sortByDesc(null) orders numeric strings numerically', 'collect(["9","10","1",5])->sortByDesc(null)->values()', fn () => collect($mixed)->sortByDesc(null)->values()->all());
probe('C32-G-sortByDesc-descriptor-mixed-directions', "sortByDesc([['name', 'asc'], ['age', 'desc']]) over four people",
    fn () => (new Collection([['name' => 'b', 'age' => 1], ['name' => 'a', 'age' => 1], ['name' => 'a', 'age' => 3], ['name' => 'b', 'age' => 2]]))->sortByDesc([['name', 'asc'], ['age', 'desc']])->values()->all());
probe('C32-G-sortByDesc-id-then-name', "sortByDesc(['id'])->sortByDesc(['id', 'name']) (testSortByCallableStringDesc)",
    fn () => (new Collection([['id' => 1, 'name' => 'foo'], ['id' => 2, 'name' => 'bar'], ['id' => 2, 'name' => 'baz']]))->sortByDesc(['id'])->sortByDesc(['id', 'name'])->values()->all());
probe('C32-G-sortByDesc-bool-comparator', "sortByDesc() and Arr::sortDesc() with a comparator answering a bool, which the descending direction never reverses", fn () => [
    'sortByDesc' => @(new Collection([3, 1, 2]))->sortByDesc([fn ($a, $b) => $a > $b])->values()->all(),
    'Arr::sortDesc list' => @Arr::sortDesc([3, 1, 2], [fn ($a, $b) => $a > $b]),
    'Arr::sortDesc keyed' => @Arr::sortDesc(['c' => 3, 'a' => 1, 'b' => 2], [fn ($a, $b) => $a > $b]),
]);

emit();
