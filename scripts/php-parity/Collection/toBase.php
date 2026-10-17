<?php

/**
 * Ground truth for Collection::toBase().
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

// --- toBase
probe('C32-A-toBase-is-base-class', '$base = C32ASub::make([1, 2])->toBase(); [get_class($base), $base->all()]', function () { $base = C32ASub::make([1, 2])->toBase(); return [get_class($base), $base->all()]; });
probe('C32-A-toBase-copies', '$sub = C32ASub::make([1, 2]); $base = $sub->toBase(); $base->push(3); [$sub->all(), $base->all()]', function () { $sub = C32ASub::make([1, 2]); $base = $sub->toBase(); $base->push(3); return [$sub->all(), $base->all()]; });

emit();
