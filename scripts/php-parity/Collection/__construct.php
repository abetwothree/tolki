<?php

/**
 * Ground truth for Collection::__construct().
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

// ==== F-21: a plain object is not an Arrayable, whatever members it carries ====
// A Closure cannot be json_encode()d, so these rows record the KEYS the cast keeps
// plus the scalar members; the point is that the keys survive at all.
probe(
    'plain-object-toArray-member-keeps-its-keys',
    "collect((object) ['toArray' => fn () => [9], 'b' => 2])->keys()->all()",
    fn () => collect((object) ['toArray' => fn () => [9], 'b' => 2])->keys()->all(),
);
probe(
    'real-arrayable-unwraps-through-toArray',
    'collect(new D8Arrayable)->all()',
    fn () => collect(new D8Arrayable)->all(),
);

// ==== F-25: the order each mutator leaves on [2 => 'c', 0 => 'a', 1 => 'b'] ====
probe('order-initial', "collect([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => d8Views(collect(d8Base())));

// --- construction (getArrayableItems)
probe('C32-A-construct-false', 'new Collection(false)', fn () => (new Collection(false))->all());
probe('C32-A-construct-zero', 'new Collection(0)', fn () => (new Collection(0))->all());
probe('C32-A-construct-empty-string', "new Collection('')", fn () => (new Collection(''))->all());
probe('C32-A-construct-traversable-list', 'new Collection(new ArrayObject([1, 2, 3]))', fn () => (new Collection(new ArrayObject([1, 2, 3])))->all());
probe('C32-A-construct-traversable-keyed', "new Collection(new ArrayObject(['foo' => 1, 'bar' => 2, 'baz' => 3]))", fn () => (new Collection(new ArrayObject(['foo' => 1, 'bar' => 2, 'baz' => 3])))->all());
probe('C32-A-construct-generator-list', 'new Collection((function () { yield 1; yield 2; })())', fn () => (new Collection((function () { yield 1; yield 2; })()))->all());
probe('C32-A-construct-stdclass', "new Collection((object) ['foo' => 'bar'])", fn () => (new Collection((object) ['foo' => 'bar']))->all());
probe('C32-A-construct-jsonable', 'new Collection(new TestJsonableObject)', fn () => (new Collection(new TestJsonableObject))->all());
probe('C32-A-construct-jsonable-toJson-throws', 'new Collection(new C32AThrowingJsonable)', fn () => (new Collection(new C32AThrowingJsonable))->all());
probe('C32-A-construct-jsonserializable', 'new Collection(new TestJsonSerializeObject)', fn () => (new Collection(new TestJsonSerializeObject))->all());
probe('C32-A-construct-jsonserializable-scalar', 'new Collection(new TestJsonSerializeWithScalarValueObject)', fn () => (new Collection(new TestJsonSerializeWithScalarValueObject))->all());
probe('C32-A-construct-arrayable-keyed', 'new Collection(new TestArrayableObject)', fn () => (new Collection(new TestArrayableObject))->all());
probe('C32-A-construct-traversable-beats-jsonserializable', "new Collection(new TestTraversableAndJsonSerializableObject(['a' => 1, 'b' => 2]))", fn () => (new Collection(new TestTraversableAndJsonSerializableObject(['a' => 1, 'b' => 2])))->all());

emit();
