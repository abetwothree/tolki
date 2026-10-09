<?php

/**
 * Ground truth for Collection::sortKeysUsing().
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
probe('C32-G-sortKeysUsing-key-types', "(new Collection(['a', 'b', 'c']))->sortKeysUsing(fn (\$a, \$b) => ...) recording gettype of each key", function () {
    $seen = [];
    (new Collection(['a', 'b', 'c']))->sortKeysUsing(function ($a, $b) use (&$seen) {
        $seen[] = gettype($a);
        $seen[] = gettype($b);

        return $a <=> $b;
    });

    return array_values(array_unique($seen));
});
probe('C32-G-sortKeysUsing-int-keys-desc', "(new Collection([5 => 'e', 2 => 'b', 9 => 'z']))->sortKeysUsing(fn (\$a, \$b) => \$b <=> \$a)->values()->all()",
    fn () => (new Collection([5 => 'e', 2 => 'b', 9 => 'z']))->sortKeysUsing(fn ($a, $b) => $b <=> $a)->values()->all());
probe('C32-G-sortKeysUsing-fractional-answers', "(new Collection(['c' => 1, 'a' => 2, 'b' => 3]))->sortKeysUsing(fn (\$x, \$y) => \$x < \$y ? -\$step : (\$x > \$y ? \$step : 0))->keys()->all() for \$step = 0.5 and 1.5", fn () => array_map(
    fn (float $step) => (new Collection(['c' => 1, 'a' => 2, 'b' => 3]))->sortKeysUsing(fn ($x, $y) => $x < $y ? -$step : ($x > $y ? $step : 0))->keys()->all(),
    [0.5, 1.5],
));

emit();
