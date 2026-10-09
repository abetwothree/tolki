<?php

/**
 * Ground truth for Collection::has().
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

probe('has-traversable-backing', "(new Collection(new ArrayIterator([1, 2, 3])))->has(0)", fn () => (new Collection(new ArrayIterator([1, 2, 3])))->has(0));
probe('has-traversable-backing-last-index', "(new Collection(new ArrayIterator([1, 2, 3])))->has(2)", fn () => (new Collection(new ArrayIterator([1, 2, 3])))->has(2));
probe('has-traversable-backing-past-end', "(new Collection(new ArrayIterator([1, 2, 3])))->has(3)", fn () => (new Collection(new ArrayIterator([1, 2, 3])))->has(3));
probe('has-dot-path-is-a-literal-key', "collect(['a' => ['b' => 1]])->has('a.b')", fn () => collect(['a' => ['b' => 1]])->has('a.b'));

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];
probe('C32-B-has-null-key', "[collect(['a' => 1])->has(null), collect(['' => 1])->has(null)]", fn () => [collect(['a' => 1])->has(null), collect(['' => 1])->has(null)]);
probe('C32-B-has-empty-key-list', "[collect(['a' => 1])->has([]), collect([])->has([])]", fn () => [collect(['a' => 1])->has([]), collect([])->has([])]);
probe('C32-B-has-array-ignores-extra-args', "[collect(['first' => 1])->has(['first'], 'third'), collect(['first' => 1])->hasAny(['third'], 'first')]", fn () => [collect(['first' => 1])->has(['first'], 'third'), collect(['first' => 1])->hasAny(['third'], 'first')]);

// keys no PHP array can hold: each call over a list and a keyed backing, and what each holds after
$overBackings = fn (callable $call) => array_map(fn (Collection $c) => ['outcome' => c32c_outcome(fn () => $call($c)), 'all' => $c->all()], [collect(['a', 'b']), collect(['a' => 1, 'b' => 2])]);
probe('C32-B-has-illegal-key', "has([['a']]), has([\$first, ['b']]) and has(['zz', ['b']]) over both backings, \$first the backing's first key", fn () => [
    $overBackings(fn (Collection $c) => $c->has([['a']])),
    $overBackings(fn (Collection $c) => $c->has([$c->keys()->first(), ['b']])),
    $overBackings(fn (Collection $c) => $c->has(['zz', ['b']])),
]);

emit();
