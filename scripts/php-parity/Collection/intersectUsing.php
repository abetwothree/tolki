<?php

/**
 * Ground truth for Collection::intersectUsing().
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

probe('d6-intersect-using', "(new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue']))->intersectUsing(['A' => 'GREEN', 'yellow'], 'strcasecmp')", function () {
    return [
        'assoc' => (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue']))->intersectUsing(['A' => 'GREEN', 'yellow'], 'strcasecmp')->all(),
        'list' => (new Collection(['green', 'brown', 'blue']))->intersectUsing(['GREEN', 'yellow'], 'strcasecmp')->all(),
        'nullish-operand' => (new Collection(['a' => 'green']))->intersectUsing(null, 'strcasecmp')->all(),
        'collection-operand' => (new Collection(['a' => 'green', 'b' => 'brown']))->intersectUsing(new Collection(['GREEN']), 'strcasecmp')->all(),
    ];
});
probe('C32-F-intersectUsing-spaceship-comparator', 'collect([1, 2, 3])->intersectUsing([2, 3], fn ($a, $b) => $a <=> $b)', fn () => collect([1, 2, 3])->intersectUsing([2, 3], fn ($a, $b) => $a <=> $b)->all());

emit();
