<?php

/**
 * Ground truth for Collection::collect().
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

probe('C32-A-collect-method-copies', '$a = collect([1, 2]); $b = $a->collect(); $b->push(3); [$a->all(), $b->all()]', function () { $a = collect([1, 2]); $b = $a->collect(); $b->push(3); return [$a->all(), $b->all()]; });

// --- collect() returns the base class
probe('C32-A-collect-method-returns-base-class', 'get_class(C32ASub::make([1])->collect())', fn () => get_class(C32ASub::make([1])->collect()));

emit();
