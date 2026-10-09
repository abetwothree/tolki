<?php

/**
 * Ground truth for Collection::zip().
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
$fRows = fn (Collection $c) => $c->map(fn ($row) => $row instanceof Collection ? $row->all() : $row)->all();

// zip: array_map pads every shorter side, the receiver included, with null
probe('C32-F-zip-receiver-shorter', "collect(['a', 'b'])->zip([1, 2, 3])", fn () => $fRows(collect(['a', 'b'])->zip([1, 2, 3])));
probe('C32-F-zip-empty-receiver', 'collect([])->zip([1, 2])', fn () => $fRows(collect([])->zip([1, 2])));
probe('C32-F-zip-null-operand', 'collect([1, 2])->zip(null)', fn () => $fRows(collect([1, 2])->zip(null)));
probe('C32-F-zip-assoc-receiver-longer-operand', "collect(['a' => 1, 'b' => 2])->zip(['x' => 'p', 'y' => 'q', 'z' => 'r'])", fn () => $fRows(collect(['a' => 1, 'b' => 2])->zip(['x' => 'p', 'y' => 'q', 'z' => 'r'])));
probe('C32-F-zip-operand-shorter', 'collect([1, 2, 3])->zip([4, 5])', fn () => $fRows(collect([1, 2, 3])->zip([4, 5])));
probe('C32-F-zip-assoc-operand', "collect([1, 2])->zip(['a' => 'x', 'b' => 'y'])", fn () => $fRows(collect([1, 2])->zip(['a' => 'x', 'b' => 'y'])));

emit();
