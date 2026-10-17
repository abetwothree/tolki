<?php

/**
 * Ground truth for Collection::concat().
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

// ==== concat returns a new collection and leaves the receiver exactly as it found it ====
probe('concat-list-leaves-the-receiver-alone', "\$c = collect([1, 2, 3]); \$c->concat(['z']); \$c", function () {
    $c = collect([1, 2, 3]);
    $c->concat(['z']);

    return e0Views($c);
});
probe('concat-list-result', "collect([1, 2, 3])->concat(['z'])", fn () => e0Views(collect([1, 2, 3])->concat(['z'])));
probe('concat-keyed-leaves-the-receiver-alone', "\$c = collect(['a' => 1, 'b' => 2]); \$c->concat(['z']); \$c", function () {
    $c = collect(['a' => 1, 'b' => 2]);
    $c->concat(['z']);

    return e0Views($c);
});
probe('concat-keyed-result', "collect(['a' => 1, 'b' => 2])->concat(['z'])", fn () => e0Views(collect(['a' => 1, 'b' => 2])->concat(['z'])));
probe('concat-out-of-order-leaves-the-receiver-alone', "\$c = collect(base); \$c->concat(['z']); \$c", function () {
    $c = collect(e0Base());
    $c->concat(['z']);

    return e0Views($c);
});
probe('concat-out-of-order-result', "collect(base)->concat(['z'])", fn () => e0Views(collect(e0Base())->concat(['z'])));
probe('concat-collection-operand-result', "collect([1, 2])->concat(collect(['x' => 'z']))", fn () => e0Views(
    collect([1, 2])->concat(collect(['x' => 'z'])),
));

probe('C32-F-concat-map-order', "collect(['x'])->concat(\$m)->all() and collect(['x'])->concat(collect(\$m))->all(), \$m = [2 => 'c', 0 => 'a', 1 => 'b']", fn () => [
    collect(['x'])->concat([2 => 'c', 0 => 'a', 1 => 'b'])->all(),
    collect(['x'])->concat(collect([2 => 'c', 0 => 'a', 1 => 'b']))->all(),
]);

emit();
