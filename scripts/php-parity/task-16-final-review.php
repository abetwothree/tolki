<?php

/**
 * Final whole-branch review ground truth.
 *
 * Covers the seams the per-task reviews could not see: `Arr::push`'s target
 * array, `diff`/`intersect`'s operand shapes, and `"__proto__"` as an
 * ordinary PHP array key across the `Collection` methods that build a keyed
 * result.
 *
 * Run: php scripts/php-parity/task-16-final-review.php > docs/php-parity/task-16-final-review.json
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

/**
 * `Arr::push()` takes `$array` by reference AND returns `Arr::set()`'s value,
 * which is the INNERMOST container for a dotted key (Arr.php:1062). The port
 * returns the whole array, so `after` is the row the TypeScript pins.
 */
function pushed(array $array, string|int|null $key, mixed ...$values): array
{
    $returned = Arr::push($array, $key, ...$values);

    return ['returned' => $returned, 'after' => $array];
}

probe('push appends into the array AT the key, never beside it', 'Arr::push($a = [["Desk"]], "0", "Chair")', function () {
    return [
        'existing_leaf' => pushed([['Desk']], '0', 'Chair'),
        'existing_leaf_two_values' => pushed(['a', ['b']], '1', 'c', 'd'),
        'existing_leaf_named' => pushed([['a']], '0', 'b'),
        'empty_leaf' => pushed([[]], '0', 'a', 'b'),
        'missing_leaf' => pushed([], '0', 'value'),
        'missing_leaf_bool' => pushed([], '0', true),
        'missing_leaf_dotted' => pushed([], '0.0', 'deep'),
        'missing_leaf_dotted_value' => pushed([], '0.0', 'value'),
        'missing_leaf_dotted_desk' => pushed([], '0.0', 'Desk'),
        'missing_leaf_dotted_three' => pushed([], '0.0.0', 'value'),
        'missing_leaf_dotted_three_deep' => pushed([], '0.0.0', 'deep'),
        'jsdoc_existing_leaf' => pushed([['x']], '0', 'y'),
        'jsdoc_dotted_leaf' => pushed(['a', ['b']], '1.1', 'c'),
        'null_intermediate' => pushed([null], '0.0', 'value'),
        'empty_intermediate' => pushed([[]], '0.0', 'value'),
        'existing_nested_leaf' => pushed([['existing']], '0.1', 'new'),
        'array_value_pushed_into_leaf' => pushed([['a', 'b'], ['c', 'd']], 1, ['x', 'y']),
        'assoc_leaf_two_values' => pushed(['items' => ['a', 'b']], 'items', 'c', 'd'),
        'nested_leaf_in_place' => pushed([[[1]]], '0.0', 9),
        'assoc_nested_leaf_in_place' => pushed(['a' => ['b' => [1]]], 'a.b', 9),
    ];
});

// The port is array-backed: it clamps an out-of-range index to an append rather
// than producing PHP's gapped integer key, which a JS array cannot express.
probe('push at an out-of-range index writes a gapped key in PHP', 'Arr::push($a = [], "2", "value")', function () {
    return [
        'flat_gap' => pushed([], '2', 'value'),
        'nested_gap' => pushed([], '0.1', 'nested'),
        'nested_gap_deep' => pushed([], '0.1.2', 'deep-value'),
        'nested_gap_mid' => pushed([], '0.1.0', 'value'),
        'intermediate_gap' => pushed([['existing']], '5.0', 'value'),
        'leaf_gap_after_root' => pushed([], '1.0', 'item'),
    ];
});

// Collection::diff/intersect both run getArrayableItems() over the operand, so
// an operand of any shape - list, assoc, scalar, null - is defined behaviour.
probe('diff accepts an operand of any shape', 'collect(null)->diff([1,2])', function () {
    return [
        'null_data_list_other' => (new Collection(null))->diff([1, 2])->all(),
        'list_data_assoc_other' => (new Collection([10, 20]))->diff(['x' => 20])->all(),
        'assoc_data_list_other' => (new Collection(['a' => 10, 'b' => 20]))->diff([20])->all(),
        'assoc_data_scalar_other' => (new Collection(['a' => 1, 'b' => 'x']))->diff('x')->all(),
        'list_data_scalar_other' => (new Collection([1, 'x']))->diff('x')->all(),
        'list_data_int_other' => (new Collection([1, 2]))->diff(2)->all(),
        'assoc_data_null_other' => (new Collection(['a' => 1]))->diff(null)->all(),
        'list_data_null_other' => (new Collection([1, 2]))->diff(null)->all(),
    ];
});

probe('intersect accepts an operand of any shape', 'collect([1])->intersect(["x"=>1])', function () {
    return [
        'list_data_assoc_other' => (new Collection([1]))->intersect(['x' => 1])->all(),
        'assoc_data_list_other' => (new Collection(['a' => 1]))->intersect([1])->all(),
        'assoc_data_list_other_two' => (new Collection(['a' => 1, 'b' => 2]))->intersect([2])->all(),
        'nums_assoc_other' => (new Collection([10, 20, 30, 40]))->intersect(['a' => 20, 'b' => 40])->all(),
        'null_data_list_other' => (new Collection(null))->intersect([1, 2])->all(),
        'assoc_data_scalar_other' => (new Collection(['a' => 1, 'b' => 'x']))->intersect('x')->all(),
        'list_data_scalar_other' => (new Collection([1, 'x']))->intersect('x')->all(),
        'assoc_data_null_other' => (new Collection(['a' => 1]))->intersect(null)->all(),
    ];
});

// PHP has no inherited __proto__ setter, so "__proto__" is an ordinary string
// key everywhere. Each row is a Collection method that builds a keyed result.
probe('"__proto__" is an ordinary array key in every keyed Collection result', 'collect([["k"=>"__proto__"]])->keyBy("k")', function () {
    $hostile = static fn (): array => ['a' => 1, '__proto__' => ['polluted' => true], 'c' => 3];

    return [
        'keyBy' => (new Collection([['k' => '__proto__', 'v' => 1]]))->keyBy('k')->all(),
        'groupBy' => (new Collection([['k' => '__proto__']]))->groupBy('k')->toArray(),
        'groupBy_preserve_keys' => (new Collection(['__proto__' => ['k' => 'z']]))->groupBy('k', true)->toArray(),
        'countBy' => (new Collection(['__proto__']))->countBy()->all(),
        'mapToDictionary' => (new Collection([['n' => '__proto__', 'i' => 1]]))->mapToDictionary(fn ($x) => [$x['n'] => $x['i']])->all(),
        'sortKeys' => (new Collection($hostile()))->sortKeys()->all(),
        'sortKeysUsing' => (new Collection($hostile()))->sortKeysUsing(fn ($a, $b) => strcmp((string) $a, (string) $b))->all(),
        'unshift' => (new Collection($hostile()))->unshift(9)->all(),
        'mergeRecursive' => (new Collection(['z' => 1]))->mergeRecursive($hostile())->all(),
        'mergeRecursive_nested' => (new Collection(['z' => ['q' => 1]]))->mergeRecursive(['z' => ['__proto__' => ['polluted' => true]]])->all(),
        'diffAssoc' => (new Collection($hostile()))->diffAssoc([])->all(),
        'diffKeys' => (new Collection($hostile()))->diffKeys([])->all(),
        'diffUsing' => (new Collection($hostile()))->diffUsing([], fn ($a, $b) => 1)->all(),
        'duplicates' => (new Collection(['a' => 1, '__proto__' => 1, 'c' => 3]))->duplicates()->all(),
        'offsetSet' => (static function () {
            $c = new Collection(['a' => 1]);
            $c['__proto__'] = 2;

            return $c->all();
        })(),
        'pull_leaves_the_rest' => (static function () use ($hostile) {
            $c = new Collection($hostile());
            $c->pull('nope');

            return $c->all();
        })(),
    ];
});

// sortDesc's no-callback guard: `sort` was aligned on PHP falsiness in both
// packages, `sortDesc` was not. PHP reads a string as a SORT_* flag, so only
// the numeric-string form has an answer at all.
probe('Collection::sortDesc — a string callback is a sort flag, not a field path', 'sortDesc(""), sortDesc("0"), sortDesc("age")', function () {
    $c = new Collection(['a' => 3, 'b' => 1, 'c' => 2]);

    $attempt = static function ($flag) use ($c) {
        try {
            return $c->sortDesc($flag)->all();
        } catch (\Throwable $e) {
            return ['threw' => get_class($e), 'message' => $e->getMessage()];
        }
    };

    return [
        'empty_string' => $attempt(''),
        'zero_string' => $attempt('0'),
        'non_numeric_string' => $attempt('age'),
    ];
});

// The docblock on phpValueMatch claimed high-precision floats bail out to
// identity; PHP's precision=14 (string) cast is what actually collapses them.
probe('array_diff matches a high-precision float against its precision=14 cast', 'array_diff([0.1 + 0.2], ["0.3"])', function () {
    return [
        'diff_precision' => array_diff([0.1 + 0.2], ['0.3']),
        'string_cast' => (string) (0.1 + 0.2),
    ];
});

emit();
