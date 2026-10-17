<?php

/**
 * Ground truth for Collection::dot().
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

probe('collection-dot-collection-leaf', "(new Collection([new Collection(['a' => 1])]))->dot() and (new Collection(['c' => new Collection(['a' => 1])]))->dot(): keys", fn () => [
    'list' => array_keys((new Collection([new Collection(['a' => 1])]))->dot()->all()),
    'map' => array_keys((new Collection(['c' => new Collection(['a' => 1])]))->dot()->all()),
]);
probe('C32-E-dot-list-backing', "collect(['a', 'b'])->dot() and collect(['0' => 'a', '1' => 'b'])->undot()", fn () => ['dot' => c32e_pairs(Collection::make(['a', 'b'])->dot()), 'undot' => c32e_pairs(Collection::make(['0' => 'a', '1' => 'b'])->undot()), 'dot-is-list' => array_is_list(Collection::make(['a', 'b'])->dot()->all())]);

emit();
