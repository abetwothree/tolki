<?php

/**
 * Ground truth for Collection::make().
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

probe('C32-A-make-collection-copies', '$a = collect([1]); $b = Collection::make($a); $b->push(2); [$a->all(), $b->all()]', function () { $a = collect([1]); $b = Collection::make($a); $b->push(2); return [$a->all(), $b->all()]; });

emit();
