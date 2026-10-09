<?php

/**
 * Ground truth for Collection::forget().
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

probe('order-forget', '$c = collect(base); $c->forget(0)', function () {
    $c = collect(d8Base());
    $c->forget(0);

    return d8Views($c);
});
probe('order-forget-many', '$c = collect(base); $c->forget([0, 1])', function () {
    $c = collect(d8Base());
    $c->forget([0, 1]);

    return d8Views($c);
});

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];
probe('C32-B-forget-dot-path-is-literal', "collect(['a' => ['b' => 1]])->forget('a.b')->all()", fn () => collect(['a' => ['b' => 1]])->forget('a.b')->all());
probe('C32-B-forget-max-int-key-then-push', "collect([5 => 'a', 6 => 'b'])->forget(6)->push('x')->all()", fn () => collect([5 => 'a', 6 => 'b'])->forget(6)->push('x')->all());
probe('C32-B-forget-repeated-key-on-list', "collect(['a', 'b', 'c'])->forget([1, 1])->all()", fn () => collect(['a', 'b', 'c'])->forget([1, 1])->all());

// keys no PHP array can hold: each call over a list and a keyed backing, and what each holds after
$overBackings = fn (callable $call) => array_map(fn (Collection $c) => ['outcome' => c32c_outcome(fn () => $call($c)), 'all' => $c->all()], [collect(['a', 'b']), collect(['a' => 1, 'b' => 2])]);
$illegalKeys = ['array' => ['a'], 'object' => new stdClass, 'closure' => fn () => 1];
probe('C32-B-forget-illegal-key', "forget([\$key]) over both backings for \$key = ['a'], new stdClass and fn () => 1, then forget([\$first, ['b']]) with \$first the backing's first key", fn () => [
    'keys' => array_map(fn ($key) => $overBackings(fn (Collection $c) => $c->forget([$key])->all()), $illegalKeys),
    'after-a-legal-key' => $overBackings(fn (Collection $c) => $c->forget([$c->keys()->first(), ['b']])->all()),
]);

emit();
