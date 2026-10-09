<?php

/**
 * Ground truth for Collection::offsetSet().
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

probe('order-offsetSet-null-key', "\$c = collect(base); \$c->offsetSet(null, 'z')", function () {
    $c = collect(d8Base());
    $c->offsetSet(null, 'z');

    return d8Views($c);
});
probe('append-key-offsetSet-null-matches-add', "\$c = collect([5 => 'a']); \$c->offsetSet(null, 'z')", function () {
    $c = collect([5 => 'a']);
    $c->offsetSet(null, 'z');

    return d8Views($c);
});
// PHP has no Collection::set; ArrayAccess is the nearest analogue of the JS extension.
probe('order-array-set-new-key', "\$c = collect(base); \$c['k'] = 'z'", function () {
    $c = collect(d8Base());
    $c['k'] = 'z';

    return d8Views($c);
});
probe('order-array-set-existing-key', "\$c = collect(base); \$c[0] = 'z'", function () {
    $c = collect(d8Base());
    $c[0] = 'z';

    return d8Views($c);
});

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];
probe('C32-B-offsetSet-string-key-on-list', "\$c = collect([1, 2]); \$c->offsetSet('x', 3); views", function () use ($views) { $c = collect([1, 2]); $c->offsetSet('x', 3); return $views($c, 'x'); });

emit();
