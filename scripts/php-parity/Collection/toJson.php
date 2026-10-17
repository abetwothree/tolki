<?php

/**
 * Ground truth for Collection::toJson().
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

probe('C32-A-toJson-integer-keys-in-order-are-a-list', "collect([0 => 'a', 1 => 'b'])->toJson()", fn () => collect([0 => 'a', 1 => 'b'])->toJson());
probe('C32-A-toJson-integer-keys-from-one-are-an-object', "collect([1 => 'a', 2 => 'b'])->toJson()", fn () => collect([1 => 'a', 2 => 'b'])->toJson());
probe('C32-A-toJson-emptied-keyed-is-a-list', "collect(['a' => 1])->forget('a')->toJson()", fn () => collect(['a' => 1])->forget('a')->toJson());
probe('C32-A-toJson-integer-keys-out-of-order', "collect([2 => 'a', 1 => 'b'])->toJson()", fn () => collect([2 => 'a', 1 => 'b'])->toJson());
probe('C32-A-toJson-list-keys-out-of-order-are-an-object', "collect([1 => 'b', 0 => 'a'])->toJson()", fn () => collect([1 => 'b', 0 => 'a'])->toJson());
probe('C32-A-toJson-escapes-slash-and-unicode', "collect(['a/b', 'é'])->toJson()", fn () => collect(['a/b', 'é'])->toJson());

emit();
