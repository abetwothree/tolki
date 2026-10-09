<?php

/**
 * Ground truth for Collection::offsetUnset().
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

probe('order-offsetUnset', '$c = collect(base); $c->offsetUnset(0)', function () {
    $c = collect(d8Base());
    $c->offsetUnset(0);

    return d8Views($c);
});
probe('C32-B-offsetUnset-negative-on-list', "\$c = collect(['a', 'b', 'c']); \$c->offsetUnset(-1); \$c->all()", function () { $c = collect(['a', 'b', 'c']); $c->offsetUnset(-1); return $c->all(); });
probe('C32-B-offsetUnset-string-on-list', "\$c = collect(['a', 'b', 'c']); \$c->offsetUnset('x'); \$c->all()", function () { $c = collect(['a', 'b', 'c']); $c->offsetUnset('x'); return $c->all(); });

emit();
