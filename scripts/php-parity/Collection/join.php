<?php

/**
 * Ground truth for Collection::join().
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

// ==== join returns a string and leaves the receiver exactly as it found it ====
probe('join-list-leaves-the-receiver-alone', "\$c = collect([1, 2, 3]); \$c->join(', ', ' and '); \$c", function () {
    $c = collect([1, 2, 3]);
    $c->join(', ', ' and ');

    return e0Views($c);
});
probe('join-keyed-leaves-the-receiver-alone', "\$c = collect(['a' => 1, 'b' => 2]); \$c->join(', ', ' and '); \$c", function () {
    $c = collect(['a' => 1, 'b' => 2]);
    $c->join(', ', ' and ');

    return e0Views($c);
});
probe('join-out-of-order-leaves-the-receiver-alone', "\$c = collect(base); \$c->join(', ', ' and '); \$c", function () {
    $c = collect(e0Base());
    $c->join(', ', ' and ');

    return e0Views($c);
});
probe('join-list-result', "collect([1, 2, 3])->join(', ', ' and ')", fn () => collect([1, 2, 3])->join(', ', ' and '));
probe('join-keyed-result', "collect(['a' => 1, 'b' => 2])->join(', ', ' and ')", fn () => collect(['a' => 1, 'b' => 2])->join(', ', ' and '));
probe('join-single-entry-result', "collect(['a' => 1])->join(', ', ' and ')", fn () => collect(['a' => 1])->join(', ', ' and '));
probe('join-empty-result', "collect([])->join(', ', ' and ')", fn () => collect([])->join(', ', ' and '));

// ==== join and implode answer in INSERTION order, which is not the ascending key order ====
probe('join-out-of-order-result', "collect(base)->join(', ', ' and ')", fn () => collect(e0Base())->join(', ', ' and '));
probe('join-out-of-order-no-final-glue', "collect(base)->join(', ')", fn () => collect(e0Base())->join(', '));

// join
probe('C32-H-join-null-last-item', "(new Collection(['a', null]))->join(', ', ' and ')", fn () => (new Collection(['a', null]))->join(', ', ' and '));
probe('C32-H-join-bool-items', "(new Collection([true, false, true]))->join(', ', ' and ')", fn () => (new Collection([true, false, true]))->join(', ', ' and '));
probe('C32-H-join-float-casts', "(new Collection([0.1 + 0.2, 1.0, 1e25, -0.0]))->join(', ', ' and ')", fn () => (new Collection([0.1 + 0.2, 1.0, 1e25, -0.0]))->join(', ', ' and '));
probe('C32-H-join-array-and-object-pieces', "@join(', ', ' and ') of [1, [2]] and [1, [2], 3], then join(', ', ' and ') of [1, new stdClass]", fn () => [
    @(new Collection([1, [2]]))->join(', ', ' and '),
    @(new Collection([1, [2], 3]))->join(', ', ' and '),
    c32c_outcome(fn () => (new Collection([1, new stdClass]))->join(', ', ' and ')),
]);
probe('C32-H-join-lone-object-item', "whether (new Collection([new stdClass]))->join(', ', ' and ') and Arr::join([new stdClass], ', ', ' and ') hand the object back as it is", function () {
    $object = new stdClass;

    return [
        'Collection::join' => (new Collection([$object]))->join(', ', ' and ') === $object,
        'Arr::join' => Arr::join([$object], ', ', ' and ') === $object,
    ];
});
probe('C32-H-join-tostring-objects-are-plucked', "[join(','), join(', ', ' and ')] of [new C32HToString('a'), new C32HToString('b')]", fn () => [
    (new Collection([new C32HToString('a'), new C32HToString('b')]))->join(','),
    (new Collection([new C32HToString('a'), new C32HToString('b')]))->join(', ', ' and '),
]);
probe('C32-H-join-stringable-items-are-joined', "[join(','), join(', ', ' and ')] of [new Stringable('a'), new Stringable('b')]", fn () => [
    (new Collection([new Stringable('a'), new Stringable('b')]))->join(','),
    (new Collection([new Stringable('a'), new Stringable('b')]))->join(', ', ' and '),
]);

emit();
