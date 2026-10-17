<?php

/**
 * Ground truth for Collection::prepend().
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

probe('order-prepend', "\$c = collect(base); \$c->prepend('x')", function () {
    $c = collect(d8Base());
    $c->prepend('x');

    return d8Views($c);
});
probe('order-prepend-with-key', "\$c = collect(base); \$c->prepend('x', 'k')", function () {
    $c = collect(d8Base());
    $c->prepend('x', 'k');

    return d8Views($c);
});
probe('order-prepend-with-null-key', "\$c = collect(base); \$c->prepend('x', null)", function () {
    $c = collect(d8Base());
    $c->prepend('x', null);

    return d8Views($c);
});
probe('order-prepend-with-existing-key', "\$c = collect(base); \$c->prepend('x', 1)", function () {
    $c = collect(d8Base());
    $c->prepend('x', 1);

    return d8Views($c);
});
probe('C32-B-prepend-string-key-on-list-order', "\$c = collect(['b', 'c'])->prepend('a', 'k'); values/keys/first/last", function () { $c = collect(['b', 'c'])->prepend('a', 'k'); return ['values' => $c->values()->all(), 'keys' => $c->keys()->all(), 'first' => $c->first(), 'last' => $c->last()]; });

emit();
