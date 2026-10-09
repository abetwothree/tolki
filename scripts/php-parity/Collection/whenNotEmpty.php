<?php

/**
 * Ground truth for Collection::whenNotEmpty().
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
probe('C32-H-whenNotEmpty-default-receives-false', "(new Collection)->whenNotEmpty(fn () => 'cb', fn (\$c, \$v) => var_export(\$v, true))", fn () => (new Collection)->whenNotEmpty(fn () => 'cb', fn ($c, $v) => var_export($v, true)));

emit();
