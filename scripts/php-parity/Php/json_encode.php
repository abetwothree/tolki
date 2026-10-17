<?php

/**
 * Ground truth for PHP's json_encode().
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

probe('C32-A-json-encode-collection', 'json_encode(collect([1, 2]))', fn () => json_encode(collect([1, 2])));
probe('C32-A-json-encode-nested-collection', "json_encode(['users' => collect([['id' => 1]])])", fn () => json_encode(['users' => collect([['id' => 1]])]));

emit();
