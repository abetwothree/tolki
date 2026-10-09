<?php

/**
 * Ground truth for Collection::diffAssocUsing().
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

probe('C8 diffAssocUsing strcasecmp', '(new Collection([\'a\' => \'green\', \'b\' => \'brown\', \'c\' => \'blue\', \'red\']))->diffAssocUsing(new Collection([\'A\' => \'green\', \'yellow\', \'red\']), \'strcasecmp\')->all()', fn () => (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red']))->diffAssocUsing(new Collection(['A' => 'green', 'yellow', 'red']), 'strcasecmp')->all());

// ---- a list-backed Collection's diffAssocUsing/diffKeysUsing: array_diff_uassoc/array_diff_ukey over the indices
probe('diffAssocUsing-list-collection-operand', "(new Collection([1, 2, 3]))->diffAssocUsing(new Collection([1, 9, 3]), 'strcasecmp')", fn () => (new Collection([1, 2, 3]))->diffAssocUsing(new Collection([1, 9, 3]), 'strcasecmp')->values()->all());
probe('diffAssocUsing-list-string-cast', "(new Collection([1, 2]))->diffAssocUsing(['1', '3'], 'strcasecmp')", fn () => (new Collection([1, 2]))->diffAssocUsing(['1', '3'], 'strcasecmp')->values()->all());
probe('callback-key *Using on a list', "(new Collection([1, 2]))->diffAssocUsing([1, 9], \$cmp) / ->diffKeysUsing([1, 9], \$cmp): every key type the comparator sees", function () {
    $types = function (callable $run): array {
        $seen = [];
        $run(function ($a, $b) use (&$seen) {
            $seen[gettype($a)] = true;
            $seen[gettype($b)] = true;

            return $a <=> $b;
        });

        return array_keys($seen);
    };

    return [
        'diffAssocUsing' => $types(fn ($cmp) => (new Collection([1, 2]))->diffAssocUsing([1, 9], $cmp)),
        'diffKeysUsing' => $types(fn ($cmp) => (new Collection([1, 2]))->diffKeysUsing([1, 9], $cmp)),
    ];
});
probe('d6-diff-assoc-using-and-diff-keys-using-on-a-list', "(new Collection([1, 2, 3]))->diffAssocUsing([1, 9, 3], 'strcasecmp') / ->diffKeysUsing(['a' => 1, 1 => 5], 'strcasecmp')", function () {
    return [
        'diffAssocUsing-list' => (new Collection([1, 2, 3]))->diffAssocUsing([1, 9, 3], 'strcasecmp')->all(),
        'diffKeysUsing-list' => (new Collection([1, 2]))->diffKeysUsing(['a' => 1, 1 => 5], 'strcasecmp')->all(),
        'diffAssocUsing-assoc' => (new Collection(['a' => 'green', 'b' => 'brown']))->diffAssocUsing(['A' => 'green', 'c' => 'blue'], 'strcasecmp')->all(),
        'diffKeysUsing-assoc' => (new Collection(['id' => 1, 'first_word' => 'Hello']))->diffKeysUsing(['ID' => 123, 'foo_bar' => 'Hello'], 'strcasecmp')->all(),
    ];
});

// ---- Family F ------------------------------------------------------------

$fViews = fn (Collection $c) => ['all' => $c->all(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all()];
probe('C32-F-diffAssocUsing-mixed-keys-order', "collect(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red'])->diffAssocUsing(collect(['A' => 'green', 'yellow', 'red']), 'strcasecmp')", fn () => $fViews(collect(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red'])->diffAssocUsing(collect(['A' => 'green', 'yellow', 'red']), 'strcasecmp')));

emit();
