<?php

/**
 * Ground truth for Collection::fromJson().
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

// --- fromJson
probe('C32-A-fromJson-invalid-is-empty', "Collection::fromJson('{bad')->all()", fn () => Collection::fromJson('{bad')->all());
probe('C32-A-fromJson-scalar-is-wrapped', "Collection::fromJson('5')->all()", fn () => Collection::fromJson('5')->all());
probe('C32-A-fromJson-null-is-empty', "Collection::fromJson('null')->all()", fn () => Collection::fromJson('null')->all());
probe('C32-A-fromJson-list', "Collection::fromJson('[\"a\",\"b\"]')->all()", fn () => Collection::fromJson('["a","b"]')->all());
probe('C32-A-fromJson-integer-keys-out-of-order', "Collection::fromJson('{\"2\":\"a\",\"1\":\"b\"}')->keys()->all()", fn () => Collection::fromJson('{"2":"a","1":"b"}')->keys()->all());

emit();
