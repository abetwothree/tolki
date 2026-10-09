<?php

/**
 * Ground truth for how Arr's callback methods read a callback's answer.
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

probe('C32-C-arr-callback-php-truthiness', "Arr::first / last / every / some / sole / where / reject / partition over c32c_items(list | keyed), sole over its first item alone, with a callback answering '0', [] and new DateTime('@0')", fn () => array_map(fn (bool $keyed) => [
    'first' => c32c_truthiness(fn ($cb) => Arr::first(c32c_items($keyed), $cb)),
    'last' => c32c_truthiness(fn ($cb) => Arr::last(c32c_items($keyed), $cb)),
    'every' => c32c_truthiness(fn ($cb) => Arr::every(c32c_items($keyed), $cb)),
    'some' => c32c_truthiness(fn ($cb) => Arr::some(c32c_items($keyed), $cb)),
    'sole' => c32c_truthiness(fn ($cb) => Arr::sole(c32c_items($keyed, true), $cb)),
    'where' => c32c_truthiness(fn ($cb) => Arr::where(c32c_items($keyed), $cb)),
    'reject' => c32c_truthiness(fn ($cb) => Arr::reject(c32c_items($keyed), $cb)),
    'partition' => c32c_truthiness(fn ($cb) => Arr::partition(c32c_items($keyed), $cb)),
], ['list' => false, 'keyed' => true]));

emit();
