<?php

/**
 * Ground truth for Collection::diffUsing().
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

probe('d6-diff-using', "(new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue']))->diffUsing(['A' => 'GREEN', 'yellow'], 'strcasecmp')", function () {
    return [
        'assoc' => (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue']))->diffUsing(['A' => 'GREEN', 'yellow'], 'strcasecmp')->all(),
        'list' => (new Collection(['green', 'brown', 'blue']))->diffUsing(['GREEN', 'yellow'], 'strcasecmp')->all(),
        'nullish-operand' => (new Collection(['a' => 'green']))->diffUsing(null, 'strcasecmp')->all(),
        'collection-operand' => (new Collection(['a' => 'green', 'b' => 'brown']))->diffUsing(new Collection(['GREEN']), 'strcasecmp')->all(),
    ];
});

// *Using: PHP's comparator contract is an int (0 = equal)
probe('C32-F-diffUsing-spaceship-comparator', 'collect([1, 2, 3])->diffUsing([2], fn ($a, $b) => $a <=> $b)', fn () => collect([1, 2, 3])->diffUsing([2], fn ($a, $b) => $a <=> $b)->all());
probe('C32-F-diffUsing-list-keeps-keys', "collect(['a', 'b', 'c'])->diffUsing(['a'], 'strcasecmp')", fn () => collect(['a', 'b', 'c'])->diffUsing(['a'], 'strcasecmp')->all());
// the comparator's answer is cast to an int, so a fraction is dropped and NAN or an infinity becomes 0
probe('C32-F-using-fractional-comparator', "collect([1, 2, 3])->diffUsing([2], fn () => \$answer) and ->intersectUsing([2], fn () => \$answer) for 0.5, -0.99 and 1.5", fn () => array_map(fn (float $answer) => [
    'diffUsing' => collect([1, 2, 3])->diffUsing([2], fn () => $answer)->all(),
    'intersectUsing' => collect([1, 2, 3])->intersectUsing([2], fn () => $answer)->all(),
], ['0.5' => 0.5, '-0.99' => -0.99, '1.5' => 1.5]));
probe('C32-F-using-non-finite-comparator', "collect([1, 2, 3])->diffUsing([2], fn () => \$answer) for NAN, INF and -INF", fn () => array_map(fn (float $answer) => @collect([1, 2, 3])->diffUsing([2], fn () => $answer)->all(), ['NAN' => NAN, 'INF' => INF, '-INF' => -INF]));
probe('C32-F-using-comparator-past-int-range', "diffUsing([2], \$comparator) and intersectUsing([2], \$comparator) over collect([1, 2, 3]) for a comparator answering (\$a <=> \$b) * 2**64, which the int cast wraps to 0, and diffUsing([2]) for one answering (\$a <=> \$b) * 1e19", fn () => [
    'diffUsing 2**64' => @collect([1, 2, 3])->diffUsing([2], fn ($a, $b) => ($a <=> $b) * 18446744073709551616.0)->values()->all(),
    'intersectUsing 2**64' => @collect([1, 2, 3])->intersectUsing([2], fn ($a, $b) => ($a <=> $b) * 18446744073709551616.0)->values()->all(),
    'diffUsing 1e19' => @collect([1, 2, 3])->diffUsing([2], fn ($a, $b) => ($a <=> $b) * 1e19)->values()->all(),
]);

emit();
