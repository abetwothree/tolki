<?php

/**
 * Ground truth for Collection::ensure().
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

// --- ensure (message parity; the class is UnexpectedValueException)
probe('C32-A-ensure-scalar-message', "collect([1, 2, 3, 'foo'])->ensure('int')", fn () => collect([1, 2, 3, 'foo'])->ensure('int'));
probe('C32-A-ensure-class-message', 'collect([new stdClass, new stdClass, new stdClass, Collection::class])->ensure(stdClass::class)', fn () => collect([new stdClass, new stdClass, new stdClass, Collection::class])->ensure(stdClass::class));
probe('C32-A-ensure-inheritance-message', 'collect([new Error, new Error, new Collection])->ensure(Throwable::class)', fn () => collect([new \Error, new \Error, new Collection])->ensure(\Throwable::class));
probe('C32-A-ensure-multiple-message', "collect([new Error, new Error, new Collection])->ensure([Throwable::class, 'int'])", fn () => collect([new \Error, new \Error, new Collection])->ensure([\Throwable::class, 'int']));
probe('C32-A-ensure-null-passes', "collect([null])->ensure('null')->all()", fn () => collect([null])->ensure('null')->all());
probe('C32-A-ensure-array-rejects-null', "collect([null])->ensure('array')", fn () => collect([null])->ensure('array'));
probe('C32-A-ensure-subclass-passes', 'collect([new C32AChild])->ensure(C32AParent::class)->count()', fn () => collect([new C32AChild])->ensure(C32AParent::class)->count());
probe('C32-A-ensure-returns-same-instance', '$c = collect([1]); $c->ensure(\'int\') === $c', function () { $c = collect([1]); return $c->ensure('int') === $c; });
probe('C32-A-ensure-keyed-position', "collect(['a' => 1, 'b' => 'x'])->ensure('int')", fn () => collect(['a' => 1, 'b' => 'x'])->ensure('int'));
probe('C32-A-ensure-numeric-prefix-key-position', "collect(['3x' => 'a'])->ensure('int')", fn () => collect(['3x' => 'a'])->ensure('int'));
probe('C32-A-ensure-assoc-types', "collect(['hello', 'world'])->ensure(['first' => 'string'])->all()", fn () => collect(['hello', 'world'])->ensure(['first' => 'string'])->all());
probe('C32-A-ensure-debug-type-names', "the message collect([\$item])->ensure('string') throws for 1, 1.5, NAN, true and ['a' => 1]", fn () => array_map(function ($item) {
    try {
        collect([$item])->ensure('string');
    } catch (UnexpectedValueException $e) {
        return $e->getMessage();
    }
}, [1, 1.5, NAN, true, ['a' => 1]]));
probe('C32-A-ensure-array-accepts-assoc', "collect([['a' => 1]])->ensure('array')->count()", fn () => collect([['a' => 1]])->ensure('array')->count());
probe('C32-A-ensure-class-name-string', "collect([new C32AChild])->ensure('C32AChild')->count()", fn () => collect([new C32AChild])->ensure('C32AChild')->count());
probe('C32-A-ensure-closure-and-anonymous-class-names', "the message collect([\$item])->ensure('int') throws for new class {} and fn () => 1, then collect([fn () => 1])->ensure(Closure::class)->count()", fn () => [
    ...array_map(fn ($item) => c32c_outcome(fn () => collect([$item])->ensure('int')), [new class {}, fn () => 1]),
    collect([fn () => 1])->ensure(Closure::class)->count(),
]);
probe('C32-A-ensure-anonymous-subclass-name', "the message collect([\$item])->ensure('int') throws for new class extends C32AParent {} and new class extends C32AChild {}", fn () => array_map(fn ($item) => c32c_outcome(fn () => collect([$item])->ensure('int')), [new class extends C32AParent {}, new class extends C32AChild {}]));

emit();
