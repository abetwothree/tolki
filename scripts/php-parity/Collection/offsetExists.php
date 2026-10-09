<?php

/**
 * Ground truth for Collection::offsetExists().
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
probe('C32-B-offsetExists-falsy-values', "collect([0, false, '', [], '0']) offsetExists(0..4)", function () { $c = collect([0, false, '', [], '0']); return array_map(fn ($k) => $c->offsetExists($k), [0, 1, 2, 3, 4]); });
probe('C32-B-offsetExists-zero-on-record', "collect(['a' => 0])->offsetExists('a')", fn () => collect(['a' => 0])->offsetExists('a'));

emit();
