<?php

/**
 * Ground truth for Collection::toPrettyJson().
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

probe('C32-A-toPrettyJson-list', 'collect([1, [2]])->toPrettyJson()', fn () => collect([1, [2]])->toPrettyJson());
probe('C32-A-toPrettyJson-empty', 'collect()->toPrettyJson()', fn () => collect()->toPrettyJson());

emit();
