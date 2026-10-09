<?php

/**
 * Ground truth for Collection::whereNull().
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

// whereNull/whereNotNull: keyed backing and dot path
probe('C32-D-whereNull-keyed', "(new Collection(['a' => null, 'b' => 0, 'c' => null]))->whereNull()", fn () => pairs((new Collection(['a' => null, 'b' => 0, 'c' => null]))->whereNull()));

emit();
