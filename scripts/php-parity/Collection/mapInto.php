<?php

/**
 * Ground truth for Collection::mapInto().
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

$rangeOutcome = function (array $arguments) {
    try {
        return Collection::range(...$arguments)->all();
    } catch (\Throwable $e) {
        return [get_class($e), $e->getMessage()];
    }
};
probe('C32-E-mapInto-constructor-args', "collect(['first', 'second'])->mapInto(C32E_Args::class) ctor args", fn () => (new Collection(['first', 'second']))->mapInto(C32E_Args::class)->map(fn ($o) => $o->args)->all());
probe('C32-E-mapInto-constructor-args-assoc', "collect(['x' => 'first'])->mapInto(C32E_Args::class) ctor args", fn () => (new Collection(['x' => 'first']))->mapInto(C32E_Args::class)->map(fn ($o) => $o->args)->all());
probe('C32-E-mapInto-backed-enums', "collect([1, 2])->mapInto(IntEnum) and collect(['A','B'])->mapInto(StrEnum): case names", fn () => ['int' => array_map(fn ($e) => $e->name, (new Collection([1, 2]))->mapInto(C32E_Int::class)->all()), 'string' => array_map(fn ($e) => $e->name, (new Collection(['A', 'B']))->mapInto(C32E_Str::class)->all())]);
probe('C32-E-mapInto-pure-enum', "(new Collection(['A']))->mapInto(C32E_Pure::class)", fn () => (new Collection(['A']))->mapInto(C32E_Pure::class)->all());

emit();
