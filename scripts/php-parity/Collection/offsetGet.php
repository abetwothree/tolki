<?php

/**
 * Ground truth for Collection::offsetGet().
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

// keys no PHP array can hold: each call over a list and a keyed backing, and what each holds after
$overBackings = fn (callable $call) => array_map(fn (Collection $c) => ['outcome' => c32c_outcome(fn () => $call($c)), 'all' => $c->all()], [collect(['a', 'b']), collect(['a' => 1, 'b' => 2])]);
$illegalKeys = ['array' => ['a'], 'object' => new stdClass, 'closure' => fn () => 1];
probe('C32-B-offset-illegal-key', "offsetGet(\$key), offsetExists(\$key) and offsetUnset(\$key) over both backings, for \$key = ['a'], new stdClass and fn () => 1", fn () => array_map(fn ($key) => [
    'offsetGet' => $overBackings(fn (Collection $c) => $c->offsetGet($key)),
    'offsetExists' => $overBackings(fn (Collection $c) => $c->offsetExists($key)),
    'offsetUnset' => $overBackings(fn (Collection $c) => $c->offsetUnset($key)),
], $illegalKeys));

emit();
