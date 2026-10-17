<?php

/**
 * Ground truth for Collection::hasAny().
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
probe('C32-B-hasAny-null-key', "[collect(['' => 1])->hasAny(null), collect(['a' => 1])->hasAny(null), collect(['' => 1])->hasAny([null])]", fn () => [collect(['' => 1])->hasAny(null), collect(['a' => 1])->hasAny(null), collect(['' => 1])->hasAny([null])]);
probe('C32-B-hasAny-dot-path-is-literal', "[collect(['a' => ['b' => 1]])->hasAny('a.b'), collect(['a.b' => 1])->hasAny('a.b')]", fn () => [collect(['a' => ['b' => 1]])->hasAny('a.b'), collect(['a.b' => 1])->hasAny('a.b')]);

// keys no PHP array can hold: each call over a list and a keyed backing, and what each holds after
$overBackings = fn (callable $call) => array_map(fn (Collection $c) => ['outcome' => c32c_outcome(fn () => $call($c)), 'all' => $c->all()], [collect(['a', 'b']), collect(['a' => 1, 'b' => 2])]);
probe('C32-B-hasAny-illegal-key', "hasAny([['a']]), hasAny([\$first, ['b']]) and hasAny(['zz', ['b']]) over both backings, \$first the backing's first key, then hasAny([['a']]) over collect([])", fn () => [
    $overBackings(fn (Collection $c) => $c->hasAny([['a']])),
    $overBackings(fn (Collection $c) => $c->hasAny([$c->keys()->first(), ['b']])),
    $overBackings(fn (Collection $c) => $c->hasAny(['zz', ['b']])),
    collect([])->hasAny([['a']]),
]);
probe('C32-B-hasAny-empty-reads-no-key', "collect()->hasAny('key', 'any', [0, 1], 'test')", fn () => collect()->hasAny('key', 'any', [0, 1], 'test'));

emit();
