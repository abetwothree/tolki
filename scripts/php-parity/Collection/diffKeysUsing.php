<?php

/**
 * Ground truth for Collection::diffKeysUsing().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('C22 diffKeysUsing', '(new Collection([\'id\' => 1, \'first_word\' => \'Hello\']))->diffKeysUsing(new Collection([\'ID\' => 123, \'foo_bar\' => \'Hello\']), \'strcasecmp\')->all()', fn () => (new Collection(['id' => 1, 'first_word' => 'Hello']))->diffKeysUsing(new Collection(['ID' => 123, 'foo_bar' => 'Hello']), 'strcasecmp')->all());
// ---- callback key types: PHP hands a callback an integer key as an int
$keyTypes = function (callable $run, mixed $result = true): array {
    $seen = [];

    try {
        $run(function ($value, $key) use (&$seen, $result) {
            $seen[] = gettype($key);

            return $result;
        });
    } catch (\Throwable) {
    }

    return $seen;
};
probe('callback-key diffKeysUsing', 'Collection([1 => "a", "x" => "b"])->diffKeysUsing([1 => "z"], $cmp)', function () {
    $seen = [];
    (new Collection([1 => 'a', 'x' => 'b']))->diffKeysUsing([1 => 'z'], function ($a, $b) use (&$seen) {
        $seen[] = [gettype($a), gettype($b)];

        return $a <=> $b;
    });

    return $seen;
});
probe('diffKeysUsing-list-collection-operand', "(new Collection([1, 2, 3]))->diffKeysUsing(new Collection([9, 9]), 'strcasecmp')", fn () => (new Collection([1, 2, 3]))->diffKeysUsing(new Collection([9, 9]), 'strcasecmp')->values()->all());
probe('diffKeysUsing-list-keyed-operand', "(new Collection([1, 2]))->diffKeysUsing(['a' => 1, 1 => 5], 'strcasecmp')", fn () => (new Collection([1, 2]))->diffKeysUsing(['a' => 1, 1 => 5], 'strcasecmp')->values()->all());

emit();
