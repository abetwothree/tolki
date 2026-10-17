<?php

/**
 * Ground truth for Collection::getOrPut().
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

probe('getOrPut-dot-path-is-a-literal-key', "\$c = collect(['a' => ['b' => 1]]); \$returned = \$c->getOrPut('a.b', 9)", function () {
    $c = collect(['a' => ['b' => 1]]);
    $returned = $c->getOrPut('a.b', 9);

    return ['returned' => $returned, 'all' => $c->all()];
});

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];
probe('C32-B-getOrPut-string-key-on-list', "\$c = collect([1, 2]); \$r = \$c->getOrPut('x', 3); views", function () use ($views) { $c = collect([1, 2]); $r = $c->getOrPut('x', 3); return ['returned' => $r] + $views($c, 'x'); });
probe('C32-B-getOrPut-memoizes-on-empty', "\$c = collect(); getOrPut('k', counter) twice", function () { $c = collect(); $calls = 0; $f = function () use (&$calls) { return 'v' . ++$calls; }; return ['first' => $c->getOrPut('k', $f), 'second' => $c->getOrPut('k', $f), 'calls' => $calls, 'all' => $c->all()]; });

emit();
