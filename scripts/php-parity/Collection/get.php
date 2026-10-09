<?php

/**
 * Ground truth for Collection::get().
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

probe('collection-get-list-non-canonical-index', "(new Collection(['x', 'y']))->get('01', 'd')", fn () => (new Collection(['x', 'y']))->get('01', 'd'));

// ==== F-15: Collection's key lookups are a literal array_key_exists, never a dot path.
// ==== Recorded so the JS extension is documented against ground truth, not settled here.
probe('get-dot-path-is-a-literal-key', "collect(['a' => ['b' => 1]])->get('a.b', 'fallback')", fn () => collect(['a' => ['b' => 1]])->get('a.b', 'fallback'));

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];
probe('C32-B-get-null-on-list', "collect([1, 2, 3])->get(null)", fn () => collect([1, 2, 3])->get(null));
probe('C32-B-get-null-empty-string-key', "collect(['' => 'x'])->get(null)", fn () => collect(['' => 'x'])->get(null));
probe('C32-B-get-stored-null-beats-default', "collect(['a' => null])->get('a', 'd')", fn () => collect(['a' => null])->get('a', 'd'));
probe('C32-B-get-has-literal-dotted-key', "[get('products.desk'), has('products.desk')] on collect(['products.desk' => ['price' => 100]])", fn () => [collect(['products.desk' => ['price' => 100]])->get('products.desk'), collect(['products.desk' => ['price' => 100]])->has('products.desk')]);

// keys no PHP array can hold: each call over a list and a keyed backing, and what each holds after
$overBackings = fn (callable $call) => array_map(fn (Collection $c) => ['outcome' => c32c_outcome(fn () => $call($c)), 'all' => $c->all()], [collect(['a', 'b']), collect(['a' => 1, 'b' => 2])]);
$illegalKeys = ['array' => ['a'], 'object' => new stdClass, 'closure' => fn () => 1];
probe('C32-B-get-illegal-key', "get(\$key) and getOrPut(\$key, 9) over both backings, for \$key = ['a'], new stdClass and fn () => 1", fn () => array_map(fn ($key) => [
    'get' => $overBackings(fn (Collection $c) => $c->get($key)),
    'getOrPut' => $overBackings(fn (Collection $c) => $c->getOrPut($key, 9)),
], $illegalKeys));

emit();
