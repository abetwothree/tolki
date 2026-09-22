<?php

/**
 * Ground truth for reading a JS Map backing in its own insertion order.
 *
 * A Map is the only JS structure that holds a PHP array such as `[2 => 'c', 0 => 'a', 1 => 'b']` in its order.
 * A non-list result is recorded through `pairs()`, since a JSON object would lose its key order.
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

const OUT_OF_ORDER = [2 => 'c', 0 => 'a', 1 => 'b'];
const MIXED = ['x' => 1, 0 => 2, 'y' => 3];

/**
 * Encode $value so JSON keeps its key order: each non-list array, at any depth, becomes a list of [key, value] pairs.
 *
 * @example pairs([2 => 'c', 0 => 'a']); -> [[2, 'c'], [0, 'a']]
 */
function pairs(mixed $value): mixed
{
    if ($value instanceof Arrayable) {
        $value = $value->toArray();
    }

    if (! is_array($value)) {
        return $value;
    }

    if (array_is_list($value)) {
        return array_map(pairs(...), $value);
    }

    $out = [];

    foreach ($value as $key => $item) {
        $out[] = [$key, pairs($item)];
    }

    return $out;
}

/** Hand $call a key-recording callback that answers $answer, and return the keys it saw in order. */
function keysSeen(callable $call, mixed $answer = true): array
{
    $seen = [];

    $call(function ($value, $key) use (&$seen, $answer) {
        $seen[] = $key;

        return $answer instanceof Closure ? $answer($value, $key) : $answer;
    });

    return $seen;
}

/** A stateful callback that answers true for its first $n calls and false after that. */
function firstVisits(int $n): Closure
{
    $calls = 0;

    return function () use (&$calls, $n): bool {
        return ++$calls <= $n;
    };
}

/**
 * Run $run, capturing every E_DEPRECATED it raises, and return the result together with
 * the messages. PHP 8.5 deprecates a null and a fractional float array key.
 */
function withDeprecations(callable $run): array
{
    $deprecations = [];

    set_error_handler(function (int $level, string $message) use (&$deprecations): bool {
        $deprecations[] = $message;

        return true;
    }, E_DEPRECATED);

    try {
        $result = $run();
    } finally {
        restore_error_handler();
    }

    return ['result' => $result, 'deprecations' => $deprecations];
}

/**
 * Run $draw 50 times and return the answer every run gave; throw if any two runs differ.
 *
 * A draw of every item is deterministic, since `Randomizer::pickArrayKeys` keeps the array's own order.
 */
function everyDrawAgrees(callable $draw): mixed
{
    $first = $draw();

    for ($run = 1; $run < 50; $run++) {
        if ($draw() !== $first) {
            throw new RuntimeException('Two draws differed, so this answer is not deterministic.');
        }
    }

    return $first;
}

/**
 * Probe one Collection mutator twice: what the call returns ("-returns"), and the
 * collection's items afterwards ("-remaining").
 */
function mutation(string $label, string $expression, array $items, callable $mutate): void
{
    probe("{$label}-returns", $expression, fn () => pairs($mutate(new Collection($items))));

    probe("{$label}-remaining", "{$expression}; \$c->all()", function () use ($items, $mutate) {
        $c = new Collection($items);
        $mutate($c);

        return pairs($c->all());
    });
}

/** Record [key, chunk handed in] for every chunkWhile callback call, answering $answer. */
function chunkWhileSeen(array $items, bool $answer): array
{
    $seen = [];

    (new Collection($items))->chunkWhile(function ($value, $key, $chunk) use (&$seen, $answer) {
        $seen[] = [$key, pairs($chunk->all())];

        return $answer;
    });

    return $seen;
}

// ---- 1. Structure.
probe('chunk-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->chunk(2)", fn () => pairs((new Collection(OUT_OF_ORDER))->chunk(2)));
probe('chunk-out-of-order-renumbered', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->chunk(2, false)", fn () => pairs((new Collection(OUT_OF_ORDER))->chunk(2, false)));
probe('chunk-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->chunk(2)", fn () => pairs((new Collection(MIXED))->chunk(2)));
probe('chunk-mixed-renumbered', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->chunk(2, false)", fn () => pairs((new Collection(MIXED))->chunk(2, false)));
probe('chunk-collision-renumbered', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->chunk(2, false)", fn () => pairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->chunk(2, false)));

probe('chunkWhile-out-of-order-never', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->chunkWhile(fn () => false)", fn () => pairs((new Collection(OUT_OF_ORDER))->chunkWhile(fn () => false)));
probe('chunkWhile-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->chunkWhile(fn (\$v, \$k, \$chunk) => false) => [key, chunk] seen", fn () => chunkWhileSeen(OUT_OF_ORDER, false));
probe('chunkWhile-out-of-order-growing-chunk-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->chunkWhile(fn (\$v, \$k, \$chunk) => true) => [key, chunk] seen", fn () => chunkWhileSeen(OUT_OF_ORDER, true));
probe('chunkWhile-mixed-callback-order', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->chunkWhile(fn (\$v, \$k, \$chunk) => false) => [key, chunk] seen", fn () => chunkWhileSeen(MIXED, false));
probe('chunkWhile-out-of-order-last-equal', "(new Collection([2 => 1, 0 => 1, 1 => 2]))->chunkWhile(fn (\$v, \$k, \$chunk) => \$chunk->last() === \$v)", fn () => pairs((new Collection([2 => 1, 0 => 1, 1 => 2]))->chunkWhile(fn ($v, $k, $chunk) => $chunk->last() === $v)));

probe('chunkBy-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->chunkBy(fn (\$v, \$k) => \$v)", fn () => pairs((new Collection(OUT_OF_ORDER))->chunkBy(fn ($v, $k) => $v)));
probe('chunkBy-out-of-order-runs', "(new Collection([2 => 1, 0 => 1, 1 => 2]))->chunkBy(fn (\$v, \$k) => \$v)", fn () => pairs((new Collection([2 => 1, 0 => 1, 1 => 2]))->chunkBy(fn ($v, $k) => $v)));
probe('chunkBy-out-of-order-runs-callback-order', "(new Collection([2 => 1, 0 => 1, 1 => 2]))->chunkBy(fn (\$v, \$k) => \$v) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection([2 => 1, 0 => 1, 1 => 2]))->chunkBy($cb), fn ($v) => $v));
probe('chunkBy-mixed-runs-callback-order', "(new Collection(['x' => 1, 0 => 1, 'y' => 2]))->chunkBy(fn (\$v, \$k) => \$v) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(['x' => 1, 0 => 1, 'y' => 2]))->chunkBy($cb), fn ($v) => $v));
probe('chunkBy-mixed-runs', "(new Collection(['x' => 1, 0 => 1, 'y' => 2]))->chunkBy(fn (\$v, \$k) => \$v)", fn () => pairs((new Collection(['x' => 1, 0 => 1, 'y' => 2]))->chunkBy(fn ($v, $k) => $v)));

probe('collapse-out-of-order-lists', "Arr::collapse([2 => ['c'], 0 => ['a'], 1 => ['b']])", fn () => pairs(Arr::collapse([2 => ['c'], 0 => ['a'], 1 => ['b']])));
probe('collapse-out-of-order-string-keys', "Arr::collapse([2 => ['c' => 1], 0 => ['a' => 1], 1 => ['b' => 1]])", fn () => pairs(Arr::collapse([2 => ['c' => 1], 0 => ['a' => 1], 1 => ['b' => 1]])));
probe('collapse-out-of-order-collision', "Arr::collapse([1 => ['k' => 1], 0 => ['k' => 2]])", fn () => pairs(Arr::collapse([1 => ['k' => 1], 0 => ['k' => 2]])));
probe('collapse-mixed', "Arr::collapse(['x' => ['p' => 1], 0 => [5], 'y' => ['q' => 2]])", fn () => pairs(Arr::collapse(['x' => ['p' => 1], 0 => [5], 'y' => ['q' => 2]])));

probe('combine-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->combine(['x', 'y', 'z'])", fn () => pairs((new Collection(OUT_OF_ORDER))->combine(['x', 'y', 'z'])->all()));
probe('combine-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->combine(['p', 'q', 'r'])", fn () => pairs((new Collection(MIXED))->combine(['p', 'q', 'r'])->all()));
probe('combine-out-of-order-values-operand', "(new Collection(['p', 'q', 'r']))->combine([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => pairs((new Collection(['p', 'q', 'r']))->combine(OUT_OF_ORDER)->all()));
probe('combine-collision', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->combine(['p', 'q'])", fn () => pairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->combine(['p', 'q'])->all()));

probe('crossJoin-out-of-order-spread', "Arr::crossJoin(...[2 => ['c1', 'c2'], 0 => ['a1'], 1 => ['b1', 'b2']])", fn () => pairs(Arr::crossJoin(...[2 => ['c1', 'c2'], 0 => ['a1'], 1 => ['b1', 'b2']])));
probe('crossJoin-mixed-spread', "Arr::crossJoin(...['x' => ['x1', 'x2'], 0 => ['z1'], 'y' => ['y1']])", fn () => pairs(Arr::crossJoin(...['x' => ['x1', 'x2'], 0 => ['z1'], 'y' => ['y1']])));
probe('crossJoin-string-keys-spread', "Arr::crossJoin(...['b' => ['b1', 'b2'], 'a' => ['a1', 'a2']])", fn () => pairs(Arr::crossJoin(...['b' => ['b1', 'b2'], 'a' => ['a1', 'a2']])));
probe('crossJoin-string-keys-two-spreads', "Arr::crossJoin(...['b' => ['b1', 'b2']], ...['a' => ['a1', 'a2']])", fn () => pairs(Arr::crossJoin(...['b' => ['b1', 'b2']], ...['a' => ['a1', 'a2']])));

probe('divide-out-of-order', "Arr::divide([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => pairs(Arr::divide(OUT_OF_ORDER)));
probe('divide-mixed', "Arr::divide(['x' => 1, 0 => 2, 'y' => 3])", fn () => pairs(Arr::divide(MIXED)));
probe('divide-collision', "Arr::divide([1 => 'a', 'x' => 'b', '1' => 'c'])", fn () => pairs(Arr::divide([1 => 'a', 'x' => 'b', '1' => 'c'])));

probe('dot-out-of-order', "Arr::dot([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => pairs(Arr::dot(OUT_OF_ORDER)));
probe('dot-out-of-order-prefixed', "Arr::dot([2 => 'c', 0 => 'a', 1 => 'b'], 'p.')", fn () => pairs(Arr::dot(OUT_OF_ORDER, 'p.')));
probe('dot-mixed-prefixed', "Arr::dot(['x' => 1, 0 => 2, 'y' => 3], 'p')", fn () => pairs(Arr::dot(MIXED, 'p')));
probe('dot-out-of-order-nested', "Arr::dot([2 => ['z' => 1], 0 => ['y' => 2], 1 => ['x' => 3]])", fn () => pairs(Arr::dot([2 => ['z' => 1], 0 => ['y' => 2], 1 => ['x' => 3]])));
probe('dot-mixed-nested', "Arr::dot(['x' => ['k' => 1], 0 => ['k' => 2], 'y' => ['k' => 3]])", fn () => pairs(Arr::dot(['x' => ['k' => 1], 0 => ['k' => 2], 'y' => ['k' => 3]])));

probe('undot-out-of-order', "Arr::undot([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => pairs(Arr::undot(OUT_OF_ORDER)));
probe('undot-dotted-first-collision', "Arr::undot(['0.a' => 'y', 0 => 'x'])", fn () => pairs(Arr::undot(['0.a' => 'y', 0 => 'x'])));
probe('undot-plain-first-collision', "Arr::undot([0 => 'x', '0.a' => 'y'])", fn () => pairs(Arr::undot([0 => 'x', '0.a' => 'y'])));
probe('undot-mixed-dotted-first-collision', "Arr::undot(['1.a' => 'y', 1 => 'x', 'b' => 'z'])", fn () => pairs(Arr::undot(['1.a' => 'y', 1 => 'x', 'b' => 'z'])));
probe('undot-list-dotted-first-collision', "Arr::undot(['1.0' => 'y', 1 => ['z']])", fn () => pairs(Arr::undot(['1.0' => 'y', 1 => ['z']])));
probe('undot-list-plain-first-collision', "Arr::undot([1 => ['z'], '1.0' => 'y'])", fn () => pairs(Arr::undot([1 => ['z'], '1.0' => 'y'])));

probe('flatten-out-of-order', "Arr::flatten([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => pairs(Arr::flatten(OUT_OF_ORDER)));
probe('flatten-mixed', "Arr::flatten(['x' => 1, 0 => 2, 'y' => 3])", fn () => pairs(Arr::flatten(MIXED)));
probe('flatten-out-of-order-nested', "Arr::flatten([2 => ['c', ['d']], 0 => 'a', 1 => ['k' => 'b']])", fn () => pairs(Arr::flatten([2 => ['c', ['d']], 0 => 'a', 1 => ['k' => 'b']])));
probe('flatten-out-of-order-nested-depth-1', "Arr::flatten([2 => ['c', ['d']], 0 => 'a', 1 => ['k' => 'b']], 1)", fn () => pairs(Arr::flatten([2 => ['c', ['d']], 0 => 'a', 1 => ['k' => 'b']], 1)));
probe('flatten-collision', "Arr::flatten([1 => 'a', 'x' => 'b', '1' => 'c'])", fn () => pairs(Arr::flatten([1 => 'a', 'x' => 'b', '1' => 'c'])));

probe('flip-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->flip()", fn () => pairs((new Collection(OUT_OF_ORDER))->flip()->all()));
probe('flip-out-of-order-duplicate-values', "(new Collection([2 => 'v', 0 => 'v']))->flip()", fn () => pairs((new Collection([2 => 'v', 0 => 'v']))->flip()->all()));
probe('flip-mixed-duplicate-values', "(new Collection(['x' => 'v', 0 => 'v']))->flip()", fn () => pairs((new Collection(['x' => 'v', 0 => 'v']))->flip()->all()));
probe('flip-collision', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->flip()", fn () => pairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->flip()->all()));

// ---- 2. Subsets and keys.
probe('only-out-of-order', "Arr::only([2 => 'c', 0 => 'a', 1 => 'b'], [0, 2])", fn () => pairs(Arr::only(OUT_OF_ORDER, [0, 2])));
probe('only-mixed', "Arr::only(['x' => 1, 0 => 2, 'y' => 3], ['y', 'x', 0])", fn () => pairs(Arr::only(MIXED, ['y', 'x', 0])));
probe('only-string-keys-reordered-selector', "Arr::only(['b' => 1, 'a' => 2], ['a', 'b'])", fn () => pairs(Arr::only(['b' => 1, 'a' => 2], ['a', 'b'])));
probe('only-collision', "Arr::only([1 => 'a', 'x' => 'b', '1' => 'c'], [1])", fn () => pairs(Arr::only([1 => 'a', 'x' => 'b', '1' => 'c'], [1])));

probe('prepend-out-of-order', "Arr::prepend([2 => 'c', 0 => 'a', 1 => 'b'], 'z')", fn () => pairs(Arr::prepend(OUT_OF_ORDER, 'z')));
probe('prepend-mixed', "Arr::prepend(['x' => 1, 0 => 2, 'y' => 3], 'z')", fn () => pairs(Arr::prepend(MIXED, 'z')));
probe('prepend-out-of-order-string-key', "Arr::prepend([2 => 'c', 0 => 'a', 1 => 'b'], 'z', 'k')", fn () => pairs(Arr::prepend(OUT_OF_ORDER, 'z', 'k')));
probe('prepend-out-of-order-existing-int-key', "Arr::prepend([2 => 'c', 0 => 'a', 1 => 'b'], 'z', 0)", fn () => pairs(Arr::prepend(OUT_OF_ORDER, 'z', 0)));
probe('prepend-negative-key-first', "Arr::prepend([-1 => 'm', 5 => 'f'], 'z')", fn () => pairs(Arr::prepend([-1 => 'm', 5 => 'f'], 'z')));
probe('prepend-collision', "Arr::prepend([1 => 'a', 'x' => 'b', '1' => 'c'], 'z')", fn () => pairs(Arr::prepend([1 => 'a', 'x' => 'b', '1' => 'c'], 'z')));

probe('prependKeysWith-out-of-order', "Arr::prependKeysWith([2 => 'c', 0 => 'a', 1 => 'b'], 'k')", fn () => pairs(Arr::prependKeysWith(OUT_OF_ORDER, 'k')));
probe('prependKeysWith-mixed', "Arr::prependKeysWith(['x' => 1, 0 => 2, 'y' => 3], 'p')", fn () => pairs(Arr::prependKeysWith(MIXED, 'p')));
probe('prependKeysWith-collision', "Arr::prependKeysWith([1 => 'a', 'x' => 'b', '1' => 'c'], 'k')", fn () => pairs(Arr::prependKeysWith([1 => 'a', 'x' => 'b', '1' => 'c'], 'k')));

$keyedRows = [2 => ['id' => 'r'], 0 => ['id' => 'p'], 1 => ['id' => 'q']];
$collidingRows = [2 => ['id' => 'x', 'n' => 'c'], 0 => ['id' => 'x', 'n' => 'a'], 1 => ['id' => 'y', 'n' => 'b']];
probe('keyBy-out-of-order-rows', "Arr::keyBy([2 => ['id' => 'r'], 0 => ['id' => 'p'], 1 => ['id' => 'q']], 'id')", fn () => pairs(Arr::keyBy($keyedRows, 'id')));
probe('keyBy-out-of-order-rows-collision', "Arr::keyBy([2 => ['id' => 'x', 'n' => 'c'], 0 => ['id' => 'x', 'n' => 'a'], 1 => ['id' => 'y', 'n' => 'b']], 'id')", fn () => pairs(Arr::keyBy($collidingRows, 'id')));
probe('keyBy-out-of-order-rows-callback-order', "Arr::keyBy([2 => ['id' => 'r'], 0 => ['id' => 'p'], 1 => ['id' => 'q']], fn (\$item, \$key) => \$item['id']) => keys seen", fn () => keysSeen(fn ($cb) => Arr::keyBy($keyedRows, $cb), fn ($item) => $item['id']));
probe('keyBy-mixed-callback', "Arr::keyBy(['x' => 1, 0 => 2, 'y' => 3], fn (\$item, \$key) => 'k' . \$item)", fn () => pairs(Arr::keyBy(MIXED, fn ($item, $key) => 'k' . $item)));
probe('keyBy-mixed-callback-order', "Arr::keyBy(['x' => 1, 0 => 2, 'y' => 3], fn (\$item, \$key) => 'k' . \$item) => keys seen", fn () => keysSeen(fn ($cb) => Arr::keyBy(MIXED, $cb), fn ($item) => 'k' . $item));

// On a LIST, union / replace / replaceRecursive answer a list only when the operand's new keys continue it in order.
probe('union-list-out-of-order-operand', "(new Collection(['a']))->union([2 => 'c', 1 => 'b'])", fn () => pairs((new Collection(['a']))->union([2 => 'c', 1 => 'b'])->all()));
probe('union-list-in-order-operand', "(new Collection(['a']))->union([1 => 'b', 2 => 'c'])", fn () => pairs((new Collection(['a']))->union([1 => 'b', 2 => 'c'])->all()));
// A string key named like an array property is an ordinary key PHP appends, so the result is keyed.
probe('union-list-length-key-operand', "(new Collection(['a']))->union(['length' => 5])", fn () => pairs((new Collection(['a']))->union(['length' => 5])->all()));
probe('union-list-length-key-then-int-operand', "(new Collection(['a']))->union(['length' => 5])->union([1 => 'x'])", fn () => pairs((new Collection(['a']))->union(['length' => 5])->union([1 => 'x'])->all()));
probe('replace-list-out-of-order-operand', "(new Collection(['a']))->replace([2 => 'c', 1 => 'b'])", fn () => pairs((new Collection(['a']))->replace([2 => 'c', 1 => 'b'])->all()));
probe('replace-list-in-order-operand', "(new Collection(['a']))->replace([1 => 'b', 2 => 'c'])", fn () => pairs((new Collection(['a']))->replace([1 => 'b', 2 => 'c'])->all()));
probe('replaceRecursive-list-out-of-order-operand', "(new Collection(['a']))->replaceRecursive([2 => 'c', 1 => 'b'])", fn () => pairs((new Collection(['a']))->replaceRecursive([2 => 'c', 1 => 'b'])->all()));
probe('replaceRecursive-list-in-order-operand', "(new Collection(['a']))->replaceRecursive([1 => 'b', 2 => 'c'])", fn () => pairs((new Collection(['a']))->replaceRecursive([1 => 'b', 2 => 'c'])->all()));
probe('replace-two-item-list-out-of-order-operand', "(new Collection(['a', 'b']))->replace([3 => 'd', 2 => 'c'])", fn () => pairs((new Collection(['a', 'b']))->replace([3 => 'd', 2 => 'c'])->all()));
probe('replace-two-item-list-in-order-operand', "(new Collection(['a', 'b']))->replace([2 => 'c', 3 => 'd'])", fn () => pairs((new Collection(['a', 'b']))->replace([2 => 'c', 3 => 'd'])->all()));
probe('replace-two-item-list-out-of-order-existing-keys', "(new Collection(['a', 'b']))->replace([1 => 'B', 0 => 'A'])", fn () => pairs((new Collection(['a', 'b']))->replace([1 => 'B', 0 => 'A'])->all()));
probe('union-list-two-operands-out-of-order', "(new Collection(['a']))->union([1 => 'b'])->union([3 => 'd', 2 => 'c'])", fn () => pairs((new Collection(['a']))->union([1 => 'b'])->union([3 => 'd', 2 => 'c'])->all()));
probe('union-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->union([3 => 'd', 'k' => 'e'])", fn () => pairs((new Collection(OUT_OF_ORDER))->union([3 => 'd', 'k' => 'e'])->all()));
probe('replace-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->replace([1 => 'B', 5 => 'f'])", fn () => pairs((new Collection(OUT_OF_ORDER))->replace([1 => 'B', 5 => 'f'])->all()));

// ---- 3. Positional.
probe('take-out-of-order', "Arr::take([2 => 'c', 0 => 'a', 1 => 'b'], 2)", fn () => pairs(Arr::take(OUT_OF_ORDER, 2)));
probe('take-out-of-order-negative', "Arr::take([2 => 'c', 0 => 'a', 1 => 'b'], -1)", fn () => pairs(Arr::take(OUT_OF_ORDER, -1)));
probe('take-mixed', "Arr::take(['x' => 1, 0 => 2, 'y' => 3], 2)", fn () => pairs(Arr::take(MIXED, 2)));
probe('take-mixed-negative', "Arr::take(['x' => 1, 0 => 2, 'y' => 3], -2)", fn () => pairs(Arr::take(MIXED, -2)));
probe('take-out-of-order-collection', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->take(2)", fn () => pairs((new Collection(OUT_OF_ORDER))->take(2)->all()));
probe('take-out-of-order-negative-collection', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->take(-1)", fn () => pairs((new Collection(OUT_OF_ORDER))->take(-1)->all()));
probe('take-collision-negative', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->take(-1)", fn () => pairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->take(-1)->all()));

probe('slice-out-of-order-offset', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->slice(1)", fn () => pairs((new Collection(OUT_OF_ORDER))->slice(1)->all()));
probe('slice-out-of-order-offset-length', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->slice(0, 2)", fn () => pairs((new Collection(OUT_OF_ORDER))->slice(0, 2)->all()));
probe('slice-out-of-order-negative-offset-length', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->slice(-2, 1)", fn () => pairs((new Collection(OUT_OF_ORDER))->slice(-2, 1)->all()));
probe('slice-mixed-offset', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->slice(1)", fn () => pairs((new Collection(MIXED))->slice(1)->all()));
probe('slice-mixed-offset-length', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->slice(0, 1)", fn () => pairs((new Collection(MIXED))->slice(0, 1)->all()));
probe('slice-collision-offset', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->slice(1)", fn () => pairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->slice(1)->all()));

mutation('splice-out-of-order-offset', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->splice(1)", OUT_OF_ORDER, fn (Collection $c) => $c->splice(1));
mutation('splice-out-of-order-offset-length', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->splice(0, 1)", OUT_OF_ORDER, fn (Collection $c) => $c->splice(0, 1));
mutation('splice-out-of-order-replacement', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->splice(1, 1, ['R'])", OUT_OF_ORDER, fn (Collection $c) => $c->splice(1, 1, ['R']));
mutation('splice-mixed-offset-length', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->splice(0, 1)", MIXED, fn (Collection $c) => $c->splice(0, 1));
mutation('splice-mixed-replacement', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->splice(1, 1, ['R'])", MIXED, fn (Collection $c) => $c->splice(1, 1, ['R']));
mutation('splice-string-keys-out-of-order-replacement', "\$c = new Collection(['k' => 'K', 'j' => 'J']); \$c->splice(0, 1, [2 => 'c', 0 => 'a', 1 => 'b'])", ['k' => 'K', 'j' => 'J'], fn (Collection $c) => $c->splice(0, 1, OUT_OF_ORDER));
mutation('splice-collision-offset-length', "\$c = new Collection([1 => 'a', 'x' => 'b', '1' => 'c']); \$c->splice(0, 1)", [1 => 'a', 'x' => 'b', '1' => 'c'], fn (Collection $c) => $c->splice(0, 1));
mutation('splice-out-of-order-replacement-collision', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->splice(1, 1, [1 => 'p', 'x' => 'q', '1' => 'r'])", OUT_OF_ORDER, fn (Collection $c) => $c->splice(1, 1, [1 => 'p', 'x' => 'q', '1' => 'r']));

mutation('shift-out-of-order', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->shift()", OUT_OF_ORDER, fn (Collection $c) => $c->shift());
mutation('shift-out-of-order-count-2', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->shift(2)", OUT_OF_ORDER, fn (Collection $c) => $c->shift(2));
mutation('shift-mixed', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->shift()", MIXED, fn (Collection $c) => $c->shift());
mutation('shift-mixed-count-2', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->shift(2)", MIXED, fn (Collection $c) => $c->shift(2));
mutation('shift-collision', "\$c = new Collection([1 => 'a', 'x' => 'b', '1' => 'c']); \$c->shift()", [1 => 'a', 'x' => 'b', '1' => 'c'], fn (Collection $c) => $c->shift());
// A count of 0 returns before the items are touched, so the out-of-order keys stay as they are.
mutation('shift-out-of-order-count-0', "\$c = new Collection([2 => 'c', 0 => 'a']); \$c->shift(0)", [2 => 'c', 0 => 'a'], fn (Collection $c) => $c->shift(0));

mutation('pop-out-of-order', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->pop()", OUT_OF_ORDER, fn (Collection $c) => $c->pop());
mutation('pop-out-of-order-count-2', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->pop(2)", OUT_OF_ORDER, fn (Collection $c) => $c->pop(2));
mutation('pop-mixed', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->pop()", MIXED, fn (Collection $c) => $c->pop());
mutation('pop-mixed-count-2', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->pop(2)", MIXED, fn (Collection $c) => $c->pop(2));
mutation('pop-collision', "\$c = new Collection([1 => 'a', 'x' => 'b', '1' => 'c']); \$c->pop()", [1 => 'a', 'x' => 'b', '1' => 'c'], fn (Collection $c) => $c->pop());
mutation('pop-collision-three-times', "\$c = new Collection([1 => 'a', 'x' => 'b', '1' => 'c']); [\$c->pop(), \$c->pop(), \$c->pop()]", [1 => 'a', 'x' => 'b', '1' => 'c'], fn (Collection $c) => [$c->pop(), $c->pop(), $c->pop()]);

probe('unshift-out-of-order-returns-same-instance', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->unshift('U') === \$c", function () {
    $c = new Collection(OUT_OF_ORDER);

    return $c->unshift('U') === $c;
});
probe('unshift-out-of-order-after', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->unshift('U'); \$c->all()", fn () => pairs((new Collection(OUT_OF_ORDER))->unshift('U')->all()));
probe('unshift-out-of-order-two-values-after', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->unshift('U', 'V'); \$c->all()", fn () => pairs((new Collection(OUT_OF_ORDER))->unshift('U', 'V')->all()));
probe('unshift-mixed-after', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->unshift('U'); \$c->all()", fn () => pairs((new Collection(MIXED))->unshift('U')->all()));
probe('unshift-collision-after', "\$c = new Collection([1 => 'a', 'x' => 'b', '1' => 'c']); \$c->unshift('U'); \$c->all()", fn () => pairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->unshift('U')->all()));

probe('pad-out-of-order-grow-right', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->pad(6, 'P')", fn () => pairs((new Collection(OUT_OF_ORDER))->pad(6, 'P')->all()));
probe('pad-out-of-order-grow-left', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->pad(-6, 'P')", fn () => pairs((new Collection(OUT_OF_ORDER))->pad(-6, 'P')->all()));
probe('pad-out-of-order-no-op', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->pad(2, 'P')", fn () => pairs((new Collection(OUT_OF_ORDER))->pad(2, 'P')->all()));
probe('pad-mixed-grow-right', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->pad(5, 'P')", fn () => pairs((new Collection(MIXED))->pad(5, 'P')->all()));
probe('pad-mixed-grow-left', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->pad(-5, 'P')", fn () => pairs((new Collection(MIXED))->pad(-5, 'P')->all()));
probe('pad-collision-grow-right', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->pad(3, 'P')", fn () => pairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->pad(3, 'P')->all()));

probe('reverse-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->reverse()", fn () => pairs((new Collection(OUT_OF_ORDER))->reverse()->all()));
probe('reverse-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->reverse()", fn () => pairs((new Collection(MIXED))->reverse()->all()));
probe('reverse-string-keys-then-descending-int-keys', "(new Collection(['y' => 'Y', 'x' => 'X', 1 => 'o', 0 => 'z']))->reverse()", fn () => pairs((new Collection(['y' => 'Y', 'x' => 'X', 1 => 'o', 0 => 'z']))->reverse()->all()));
probe('reverse-collision', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->reverse()", fn () => pairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->reverse()->all()));

probe('random-out-of-order-full-count', "Arr::random([2 => 'c', 0 => 'a', 1 => 'b'], 3) (50 draws, all equal)", fn () => pairs(everyDrawAgrees(fn () => Arr::random(OUT_OF_ORDER, 3))));
probe('random-out-of-order-full-count-preserve-keys', "Arr::random([2 => 'c', 0 => 'a', 1 => 'b'], 3, true) (50 draws, all equal)", fn () => pairs(everyDrawAgrees(fn () => Arr::random(OUT_OF_ORDER, 3, true))));
probe('random-mixed-full-count', "Arr::random(['x' => 1, 0 => 2, 'y' => 3], 3) (50 draws, all equal)", fn () => pairs(everyDrawAgrees(fn () => Arr::random(MIXED, 3))));
probe('random-mixed-full-count-preserve-keys', "Arr::random(['x' => 1, 0 => 2, 'y' => 3], 3, true) (50 draws, all equal)", fn () => pairs(everyDrawAgrees(fn () => Arr::random(MIXED, 3, true))));
probe('random-out-of-order-partial-keeps-array-order', "every one of 200 draws of Arr::random([2 => 'c', 0 => 'a', 1 => 'b'], 2, true) lists its keys in the array's own order", function () {
    $order = array_flip(array_keys(OUT_OF_ORDER));

    for ($draw = 0; $draw < 200; $draw++) {
        $positions = array_map(fn ($key) => $order[$key], array_keys(Arr::random(OUT_OF_ORDER, 2, true)));
        $ascending = $positions;
        sort($ascending);

        if ($positions !== $ascending) {
            return false;
        }
    }

    return true;
});
probe('random-mixed-partial-keeps-array-order', "every one of 200 draws of Arr::random(['x' => 1, 0 => 2, 'y' => 3], 2) lists its values in the array's own order", function () {
    $order = array_flip(array_values(MIXED));

    for ($draw = 0; $draw < 200; $draw++) {
        $positions = array_map(fn ($value) => $order[$value], Arr::random(MIXED, 2));
        $ascending = $positions;
        sort($ascending);

        if ($positions !== $ascending) {
            return false;
        }
    }

    return true;
});
probe('random-out-of-order-partial-values-keep-array-order', "every one of 200 draws of Arr::random([2 => 'c', 0 => 'a', 1 => 'b'], 2) lists two values in the array's own order", function () {
    $order = array_flip(array_values(OUT_OF_ORDER));

    for ($draw = 0; $draw < 200; $draw++) {
        $positions = array_map(fn ($value) => $order[$value], Arr::random(OUT_OF_ORDER, 2));
        $ascending = $positions;
        sort($ascending);

        if (count($positions) !== 2 || $positions !== $ascending) {
            return false;
        }
    }

    return true;
});
probe('random-collision-full-count', "Arr::random([1 => 'a', 'x' => 'b', '1' => 'c'], 2) (50 draws, all equal)", fn () => pairs(everyDrawAgrees(fn () => Arr::random([1 => 'a', 'x' => 'b', '1' => 'c'], 2))));
probe('random-list-full-count', "Arr::random(['a', 'b', 'c', 'd'], 4) (50 draws, all equal)", fn () => pairs(everyDrawAgrees(fn () => Arr::random(['a', 'b', 'c', 'd'], 4))));
probe('random-list-partial-keeps-array-order', "every one of 200 draws of Arr::random(['a', 'b', 'c', 'd'], 2) lists its values in the array's own order", function () {
    $order = array_flip(['a', 'b', 'c', 'd']);

    for ($draw = 0; $draw < 200; $draw++) {
        $positions = array_map(fn ($value) => $order[$value], Arr::random(['a', 'b', 'c', 'd'], 2));
        $ascending = $positions;
        sort($ascending);

        if ($positions !== $ascending) {
            return false;
        }
    }

    return true;
});
// true is stored as the key 1, so the array holds two items and shuffle's values are 'b' and 'z'.
probe('shuffle-true-key-collision-values', "\$v = Arr::shuffle([1 => 'a', true => 'b', 0 => 'z']); sort(\$v)", function () {
    $values = Arr::shuffle([1 => 'a', true => 'b', 0 => 'z']);
    sort($values);

    return $values;
});
probe('from-true-key-collision', "Arr::from([1 => 'a', true => 'b'])", fn () => pairs(Arr::from([1 => 'a', true => 'b'])));

// ---- 4. Search and predicates.
probe('search-out-of-order-duplicate-value', "(new Collection([2 => 'x', 0 => 'x', 1 => 'y']))->search('x')", fn () => (new Collection([2 => 'x', 0 => 'x', 1 => 'y']))->search('x'));
probe('search-mixed-duplicate-value', "(new Collection(['x' => 'v', 0 => 'v', 'y' => 'w']))->search('v')", fn () => (new Collection(['x' => 'v', 0 => 'v', 'y' => 'w']))->search('v'));
probe('search-out-of-order-callback', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->search(fn () => true)", fn () => (new Collection(OUT_OF_ORDER))->search(fn () => true));
probe('search-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->search(fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->search($cb), false));
probe('search-out-of-order-early-exit-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->search(fn (\$v, \$k) => \$v === 'a') => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->search($cb), fn ($v) => $v === 'a'));
probe('search-mixed-callback', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->search(fn () => true)", fn () => (new Collection(MIXED))->search(fn () => true));
probe('search-mixed-callback-order', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->search(fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(MIXED))->search($cb), false));

probe('before-out-of-order-first-item', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->before('c')", fn () => (new Collection(OUT_OF_ORDER))->before('c'));
probe('before-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->before('a')", fn () => (new Collection(OUT_OF_ORDER))->before('a'));
probe('before-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->before(2)", fn () => (new Collection(MIXED))->before(2));
probe('before-out-of-order-callback', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->before(fn (\$v, \$k) => \$v === 'b')", fn () => (new Collection(OUT_OF_ORDER))->before(fn ($v, $k) => $v === 'b'));
probe('before-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->before(fn (\$v, \$k) => \$v === 'b') => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->before($cb), fn ($v) => $v === 'b'));
probe('after-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->after('c')", fn () => (new Collection(OUT_OF_ORDER))->after('c'));
probe('after-out-of-order-last-item', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->after('b')", fn () => (new Collection(OUT_OF_ORDER))->after('b'));
probe('after-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->after(1)", fn () => (new Collection(MIXED))->after(1));
probe('after-out-of-order-callback', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->after(fn (\$v, \$k) => \$v === 'c')", fn () => (new Collection(OUT_OF_ORDER))->after(fn ($v, $k) => $v === 'c'));
probe('after-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->after(fn (\$v, \$k) => \$v === 'c') => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->after($cb), fn ($v) => $v === 'c'));

probe('first-out-of-order', "Arr::first([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => Arr::first(OUT_OF_ORDER));
probe('first-mixed', "Arr::first(['x' => 1, 0 => 2, 'y' => 3])", fn () => Arr::first(MIXED));
probe('first-out-of-order-callback', "Arr::first([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v) => \$v !== 'a')", fn () => Arr::first(OUT_OF_ORDER, fn ($v) => $v !== 'a'));
probe('first-out-of-order-callback-order', "Arr::first([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::first(OUT_OF_ORDER, $cb), false));
probe('last-out-of-order', "Arr::last([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => Arr::last(OUT_OF_ORDER));
probe('last-mixed', "Arr::last(['x' => 1, 0 => 2, 'y' => 3])", fn () => Arr::last(MIXED));
probe('last-out-of-order-callback', "Arr::last([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v) => \$v !== 'b')", fn () => Arr::last(OUT_OF_ORDER, fn ($v) => $v !== 'b'));
probe('last-out-of-order-callback-order', "Arr::last([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::last(OUT_OF_ORDER, $cb), false));

probe('every-out-of-order-callback-order', "Arr::every([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::every(OUT_OF_ORDER, $cb), true));
probe('every-out-of-order-early-exit-callback-order', "Arr::every([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::every(OUT_OF_ORDER, $cb), false));
probe('every-mixed-callback-order', "Arr::every(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::every(MIXED, $cb), true));
probe('some-out-of-order-callback-order', "Arr::some([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::some(OUT_OF_ORDER, $cb), false));
probe('some-out-of-order-early-exit-callback-order', "Arr::some([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::some(OUT_OF_ORDER, $cb), true));
probe('some-mixed-callback-order', "Arr::some(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::some(MIXED, $cb), false));

probe('contains-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->contains(fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->contains($cb), false));
probe('contains-out-of-order-early-exit-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->contains(fn (\$v, \$k) => \$v === 'a') => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->contains($cb), fn ($v) => $v === 'a'));
probe('contains-mixed-callback-order', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->contains(fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(MIXED))->contains($cb), false));
probe('containsStrict-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->containsStrict(fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->containsStrict($cb), false));
probe('containsStrict-out-of-order-null-first-callback', "(new Collection([2 => null, 0 => 'a']))->containsStrict(fn () => true)", fn () => (new Collection([2 => null, 0 => 'a']))->containsStrict(fn () => true));
probe('containsStrict-mixed-null-first-callback', "(new Collection(['x' => null, 0 => 'a']))->containsStrict(fn () => true)", fn () => (new Collection(['x' => null, 0 => 'a']))->containsStrict(fn () => true));
probe('containsStrict-out-of-order-non-null-first-callback', "(new Collection([2 => 'a', 0 => null]))->containsStrict(fn () => true)", fn () => (new Collection([2 => 'a', 0 => null]))->containsStrict(fn () => true));
probe('contains-out-of-order-operator-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->contains(fn (\$v, \$k) => false, '=', 'q') => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->contains($cb, '=', 'q'), false));

probe('sole-out-of-order-callback', "Arr::sole([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v) => \$v === 'c')", fn () => Arr::sole(OUT_OF_ORDER, fn ($v) => $v === 'c'));
probe('sole-out-of-order-callback-order', "Arr::sole([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => \$v === 'c') => keys seen", fn () => keysSeen(fn ($cb) => Arr::sole(OUT_OF_ORDER, $cb), fn ($v) => $v === 'c'));
probe('sole-out-of-order-first-call-only', "Arr::sole([2 => 'c', 0 => 'a', 1 => 'b'], a callback true only on its first call)", fn () => Arr::sole(OUT_OF_ORDER, firstVisits(1)));
probe('sole-mixed-callback-order', "Arr::sole(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => \$v === 2) => keys seen", fn () => keysSeen(fn ($cb) => Arr::sole(MIXED, $cb), fn ($v) => $v === 2));

// PHP's array key casts: 1 and '1' are one key (first position, last value), true is 1,
// null is '' and 1.5 is 1. The array literals are written as a PHP user would write them.
probe('first-collision', "Arr::first([1 => 'a', '1' => 'b'])", fn () => Arr::first([1 => 'a', '1' => 'b']));
probe('first-true-key-collision', "Arr::first([1 => 'a', true => 'b'])", fn () => Arr::first([1 => 'a', true => 'b']));
probe('last-collision', "Arr::last([1 => 'a', 0 => 'z', '1' => 'b'])", fn () => Arr::last([1 => 'a', 0 => 'z', '1' => 'b']));
probe('some-collision', "Arr::some([1 => 'a', '1' => 'b'], fn (\$v) => \$v === 'a')", fn () => Arr::some([1 => 'a', '1' => 'b'], fn ($v) => $v === 'a'));
probe('every-numeric-string-keys-callback-order', "Arr::every(['2' => 'c', '0' => 'a'], fn (\$v, \$k) => true) => keys seen, with deprecations", fn () => withDeprecations(fn () => keysSeen(fn ($cb) => Arr::every(['2' => 'c', '0' => 'a'], $cb))));
probe('every-true-key-callback-order', "Arr::every([true => 'a'], fn (\$v, \$k) => true) => keys seen, with deprecations", fn () => withDeprecations(fn () => keysSeen(fn ($cb) => Arr::every([true => 'a'], $cb))));
probe('every-null-key-callback-order', "Arr::every([null => 'a'], fn (\$v, \$k) => true) => keys seen, with deprecations", fn () => withDeprecations(fn () => keysSeen(fn ($cb) => Arr::every([null => 'a'], $cb))));
probe('every-float-key-callback-order', "Arr::every([1.5 => 'a'], fn (\$v, \$k) => true) => keys seen, with deprecations", fn () => withDeprecations(fn () => keysSeen(fn ($cb) => Arr::every([1.5 => 'a'], $cb))));
probe('every-collision-callback-pairs', "Arr::every([1 => 'a', 0 => 'z', '1' => 'b'], fn (\$v, \$k) => true) => [key, value] seen", function () {
    $seen = [];

    Arr::every([1 => 'a', 0 => 'z', '1' => 'b'], function ($value, $key) use (&$seen) {
        $seen[] = [$key, $value];

        return true;
    });

    return $seen;
});
// [5 => 'a', 0 => 'b', '5' => 'c'] is [5 => 'c', 0 => 'b']: 'a' is gone, and 'c' sits first.
probe('search-collision', "(new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->search('a')", fn () => (new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->search('a'));
probe('search-collision-callback-order', "(new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->search(fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->search($cb), false));
probe('before-collision', "(new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->before('b')", fn () => (new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->before('b'));
probe('after-collision', "(new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->after('c')", fn () => (new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->after('c'));
// before()/after() find the found key's position with a LOOSE $keys->search($key), so the
// integer key 1 is found at the string key '01', which PHP's == holds equal to it.
probe('before-loose-key-position', "(new Collection(['01' => 'a', 1 => 'b']))->before('b')", fn () => (new Collection(['01' => 'a', 1 => 'b']))->before('b'));
probe('after-loose-key-position', "(new Collection(['01' => 'a', 1 => 'b']))->after('b')", fn () => (new Collection(['01' => 'a', 1 => 'b']))->after('b'));
probe('before-loose-key-position-record-order', "(new Collection([1 => 'b', '01' => 'a']))->before('a')", fn () => (new Collection([1 => 'b', '01' => 'a']))->before('a'));
probe('after-loose-key-position-record-order', "(new Collection([1 => 'b', '01' => 'a']))->after('a')", fn () => (new Collection([1 => 'b', '01' => 'a']))->after('a'));
probe('before-loose-key-position-strict-search', "(new Collection(['01' => 'a', 1 => 'b']))->before('b', true)", fn () => (new Collection(['01' => 'a', 1 => 'b']))->before('b', true));
probe('contains-collision', "(new Collection([1 => 'a', '1' => 'b']))->contains('a')", fn () => (new Collection([1 => 'a', '1' => 'b']))->contains('a'));
probe('containsStrict-collision', "(new Collection([1 => 'a', '1' => 'b']))->containsStrict('a')", fn () => (new Collection([1 => 'a', '1' => 'b']))->containsStrict('a'));
probe('sole-collision', "Arr::sole([1 => 'a', '1' => 'b'])", fn () => Arr::sole([1 => 'a', '1' => 'b']));
probe('sole-true-key-collision', "Arr::sole([1 => 'a', true => 'b'])", fn () => Arr::sole([1 => 'a', true => 'b']));

// ---- 5. Mapping.
probe('map-out-of-order', "Arr::map([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => \$v . '!' . \$k)", fn () => pairs(Arr::map(OUT_OF_ORDER, fn ($v, $k) => $v . '!' . $k)));
probe('map-out-of-order-callback-order', "Arr::map([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => \$v) => keys seen", fn () => keysSeen(fn ($cb) => Arr::map(OUT_OF_ORDER, $cb), fn ($v) => $v));
probe('map-mixed-callback-order', "Arr::map(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => \$v) => keys seen", fn () => keysSeen(fn ($cb) => Arr::map(MIXED, $cb), fn ($v) => $v));
probe('map-out-of-order-visit-count', "Arr::map([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v) => \$v . ++\$calls)", function () {
    $calls = 0;

    return pairs(Arr::map(OUT_OF_ORDER, function ($v) use (&$calls) {
        return $v . ++$calls;
    }));
});
// [1 => 'a', 0 => 'z', '1' => 'b'] is [1 => 'b', 0 => 'z']: 'a' is gone before any callback runs, so a
// callback that counts its calls, tests for 'a' or keys by the value tells one entry from two.
probe('map-collision-visit-count', "Arr::map([1 => 'a', 0 => 'z', '1' => 'b'], fn (\$v) => \$v . ++\$calls)", function () {
    $calls = 0;

    return pairs(Arr::map([1 => 'a', 0 => 'z', '1' => 'b'], function ($v) use (&$calls) {
        return $v . ++$calls;
    }));
});

probe('mapWithKeys-out-of-order', "Arr::mapWithKeys([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => ['k' . \$k => \$v])", fn () => pairs(Arr::mapWithKeys(OUT_OF_ORDER, fn ($v, $k) => ['k' . $k => $v])));
probe('mapWithKeys-mixed', "Arr::mapWithKeys(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => ['k' . \$k => \$v])", fn () => pairs(Arr::mapWithKeys(MIXED, fn ($v, $k) => ['k' . $k => $v])));
probe('mapWithKeys-out-of-order-collision', "Arr::mapWithKeys([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v) => ['same' => \$v])", fn () => pairs(Arr::mapWithKeys(OUT_OF_ORDER, fn ($v) => ['same' => $v])));
probe('mapWithKeys-out-of-order-int-collision', "Arr::mapWithKeys([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v) => [0 => \$v])", fn () => pairs(Arr::mapWithKeys(OUT_OF_ORDER, fn ($v) => [0 => $v])));
probe('mapWithKeys-out-of-order-callback-order', "Arr::mapWithKeys([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => []) => keys seen", fn () => keysSeen(fn ($cb) => Arr::mapWithKeys(OUT_OF_ORDER, $cb), fn () => []));
probe('mapWithKeys-mixed-callback-order', "Arr::mapWithKeys(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => []) => keys seen", fn () => keysSeen(fn ($cb) => Arr::mapWithKeys(MIXED, $cb), fn () => []));
probe('mapWithKeys-collision', "Arr::mapWithKeys([1 => 'a', 0 => 'z', '1' => 'b'], fn (\$v, \$k) => [\$v => \$k])", fn () => pairs(Arr::mapWithKeys([1 => 'a', 0 => 'z', '1' => 'b'], fn ($v, $k) => [$v => $k])));

$spreadRows = [2 => ['c', 1], 0 => ['a', 2], 1 => ['b', 3]];
probe('mapSpread-out-of-order', "Arr::mapSpread([2 => ['c', 1], 0 => ['a', 2], 1 => ['b', 3]], fn (\$x, \$y, \$k) => \$x . \$y . \$k)", fn () => pairs(Arr::mapSpread($spreadRows, fn ($x, $y, $k) => $x . $y . $k)));
probe('mapSpread-out-of-order-callback-order', "Arr::mapSpread([2 => ['c', 1], 0 => ['a', 2], 1 => ['b', 3]], fn (\$x, \$y, \$k) => null) => keys seen", function () use ($spreadRows) {
    $seen = [];

    Arr::mapSpread($spreadRows, function ($x, $y, $key) use (&$seen) {
        $seen[] = $key;

        return null;
    });

    return $seen;
});
probe('mapSpread-mixed-callback-order', "Arr::mapSpread(['x' => [1, 'p'], 0 => [2, 'q'], 'y' => [3, 'r']], fn (\$x, \$y, \$k) => null) => keys seen", function () {
    $seen = [];

    Arr::mapSpread(['x' => [1, 'p'], 0 => [2, 'q'], 'y' => [3, 'r']], function ($x, $y, $key) use (&$seen) {
        $seen[] = $key;

        return null;
    });

    return $seen;
});
probe('mapSpread-collision-visit-count', "Arr::mapSpread([1 => ['a', 1], 0 => ['z', 2], '1' => ['b', 3]], fn (\$x, \$y, \$k) => \$x . \$y . \$k . '#' . ++\$calls)", function () {
    $calls = 0;

    return pairs(Arr::mapSpread([1 => ['a', 1], 0 => ['z', 2], '1' => ['b', 3]], function ($x, $y, $k) use (&$calls) {
        return $x . $y . $k . '#' . ++$calls;
    }));
});

probe('filter-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->filter(fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->filter($cb), true));
probe('filter-mixed-callback-order', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->filter(fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(MIXED))->filter($cb), true));
probe('filter-out-of-order-first-two-visits', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->filter(a callback true for its first two calls)", fn () => pairs((new Collection(OUT_OF_ORDER))->filter(firstVisits(2))->all()));
probe('filter-mixed-first-visit', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->filter(a callback true for its first call)", fn () => pairs((new Collection(MIXED))->filter(firstVisits(1))->all()));
probe('filter-mixed-no-callback', "(new Collection(['x' => 0, 2 => 'c', 'y' => 'y', 0 => '', 1 => 'b']))->filter()", fn () => pairs((new Collection(['x' => 0, 2 => 'c', 'y' => 'y', 0 => '', 1 => 'b']))->filter()->all()));
probe('filter-collision', "(new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->filter(fn (\$v) => \$v === 'a')", fn () => pairs((new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->filter(fn ($v) => $v === 'a')->all()));

probe('where-out-of-order-callback-order', "Arr::where([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::where(OUT_OF_ORDER, $cb), true));
probe('where-mixed-callback-order', "Arr::where(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::where(MIXED, $cb), true));
probe('where-out-of-order-first-two-visits', "Arr::where([2 => 'c', 0 => 'a', 1 => 'b'], a callback true for its first two calls)", fn () => pairs(Arr::where(OUT_OF_ORDER, firstVisits(2))));
probe('where-mixed-first-visit', "Arr::where(['x' => 1, 0 => 2, 'y' => 3], a callback true for its first call)", fn () => pairs(Arr::where(MIXED, firstVisits(1))));
probe('where-collision', "Arr::where([1 => 'a', 0 => 'z', '1' => 'b'], fn (\$v) => \$v === 'a')", fn () => pairs(Arr::where([1 => 'a', 0 => 'z', '1' => 'b'], fn ($v) => $v === 'a')));

probe('reject-out-of-order-callback-order', "Arr::reject([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::reject(OUT_OF_ORDER, $cb), false));
probe('reject-mixed-callback-order', "Arr::reject(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::reject(MIXED, $cb), false));
probe('reject-out-of-order-first-visit', "Arr::reject([2 => 'c', 0 => 'a', 1 => 'b'], a callback true for its first call)", fn () => pairs(Arr::reject(OUT_OF_ORDER, firstVisits(1))));
probe('reject-mixed-first-visit', "Arr::reject(['x' => 1, 0 => 2, 'y' => 3], a callback true for its first call)", fn () => pairs(Arr::reject(MIXED, firstVisits(1))));
probe('reject-collision', "Arr::reject([1 => 'a', 0 => 'z', '1' => 'b'], fn (\$v) => \$v === 'b')", fn () => pairs(Arr::reject([1 => 'a', 0 => 'z', '1' => 'b'], fn ($v) => $v === 'b')));

probe('partition-out-of-order-callback-order', "Arr::partition([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::partition(OUT_OF_ORDER, $cb), true));
probe('partition-mixed-callback-order', "Arr::partition(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => Arr::partition(MIXED, $cb), true));
probe('partition-out-of-order-first-visit', "Arr::partition([2 => 'c', 0 => 'a', 1 => 'b'], a callback true for its first call)", fn () => pairs(Arr::partition(OUT_OF_ORDER, firstVisits(1))));
probe('partition-mixed-first-visit', "Arr::partition(['x' => 1, 0 => 2, 'y' => 3], a callback true for its first call)", fn () => pairs(Arr::partition(MIXED, firstVisits(1))));
probe('partition-collision', "Arr::partition([1 => 'a', 0 => 'z', '1' => 'b'], fn (\$v) => \$v === 'b')", fn () => pairs(Arr::partition([1 => 'a', 0 => 'z', '1' => 'b'], fn ($v) => $v === 'b')));

// ---- 6. Output and sorting.
probe('join-out-of-order', "Arr::join([2 => 'c', 0 => 'a', 1 => 'b'], ', ', ' and ')", fn () => Arr::join(OUT_OF_ORDER, ', ', ' and '));
probe('join-out-of-order-no-final-glue', "Arr::join([2 => 'c', 0 => 'a', 1 => 'b'], ', ')", fn () => Arr::join(OUT_OF_ORDER, ', '));
probe('join-mixed', "Arr::join(['x' => 1, 0 => 2, 'y' => 3], ', ', ' and ')", fn () => Arr::join(MIXED, ', ', ' and '));
probe('join-collision', "Arr::join([1 => 'a', 0 => 'z', '1' => 'b'], ',')", fn () => Arr::join([1 => 'a', 0 => 'z', '1' => 'b'], ','));

probe('query-out-of-order', "Arr::query([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => Arr::query(OUT_OF_ORDER));
probe('query-mixed', "Arr::query(['x' => 1, 0 => 2, 'y' => 3])", fn () => Arr::query(MIXED));
probe('query-out-of-order-nested', "Arr::query(['u' => [1 => 'p', 0 => 'q'], 'v' => 1])", fn () => Arr::query(['u' => [1 => 'p', 0 => 'q'], 'v' => 1]));
probe('query-out-of-order-nested-in-list', "Arr::query(['l' => [[1 => 'p', 0 => 'q'], 'x']])", fn () => Arr::query(['l' => [[1 => 'p', 0 => 'q'], 'x']]));
probe('query-out-of-order-nested-twice', "Arr::query(['a' => ['b' => [1 => 'p', 0 => 'q']], 1 => 'one', 0 => 'zero'])", fn () => Arr::query(['a' => ['b' => [1 => 'p', 0 => 'q']], 1 => 'one', 0 => 'zero']));
probe('query-collision', "Arr::query([1 => 'a', 0 => 'z', '1' => 'b'])", fn () => Arr::query([1 => 'a', 0 => 'z', '1' => 'b']));

probe('toCssClasses-out-of-order', "Arr::toCssClasses([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => Arr::toCssClasses(OUT_OF_ORDER));
probe('toCssClasses-mixed', "Arr::toCssClasses(['x' => 1, 0 => 2, 'y' => 3])", fn () => Arr::toCssClasses(MIXED));
probe('toCssClasses-out-of-order-booleans', "Arr::toCssClasses([2 => 'c2', 'x' => true, 0 => 'c0', 'off' => false, 1 => 'c1'])", fn () => Arr::toCssClasses([2 => 'c2', 'x' => true, 0 => 'c0', 'off' => false, 1 => 'c1']));
probe('toCssClasses-collision', "Arr::toCssClasses([1 => 'a', 0 => 'z', '1' => 'b'])", fn () => Arr::toCssClasses([1 => 'a', 0 => 'z', '1' => 'b']));
probe('toCssStyles-out-of-order', "Arr::toCssStyles([2 => 'c:2', 0 => 'a:0', 1 => 'b:1'])", fn () => Arr::toCssStyles([2 => 'c:2', 0 => 'a:0', 1 => 'b:1']));
probe('toCssStyles-mixed-booleans', "Arr::toCssStyles(['x:1' => true, 0 => 'z:0', 'off:1' => false, 'y:1' => true])", fn () => Arr::toCssStyles(['x:1' => true, 0 => 'z:0', 'off:1' => false, 'y:1' => true]));
probe('toCssStyles-collision', "Arr::toCssStyles([1 => 'a:1', 0 => 'z:0', '1' => 'b:1'])", fn () => Arr::toCssStyles([1 => 'a:1', 0 => 'z:0', '1' => 'b:1']));

probe('values-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->values()", fn () => pairs((new Collection(OUT_OF_ORDER))->values()->all()));
probe('values-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->values()", fn () => pairs((new Collection(MIXED))->values()->all()));
probe('keys-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->keys()", fn () => pairs((new Collection(OUT_OF_ORDER))->keys()->all()));
probe('keys-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->keys()", fn () => pairs((new Collection(MIXED))->keys()->all()));
probe('values-collision', "(new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->values()", fn () => pairs((new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->values()->all()));
probe('keys-collision', "(new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->keys()", fn () => pairs((new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->keys()->all()));
probe('keys-out-of-order-key-types', "(new Collection([-1 => 'a', 'x' => 'X', 0 => 'b', '01' => 's']))->keys()", fn () => pairs((new Collection([-1 => 'a', 'x' => 'X', 0 => 'b', '01' => 's']))->keys()->all()));

$pluckRows = [2 => ['n' => 'c', 'k' => 'kc'], 0 => ['n' => 'a', 'k' => 'ka'], 1 => ['n' => 'b', 'k' => 'kb']];
$pluckColliding = [2 => ['n' => 'c', 'k' => 'same'], 0 => ['n' => 'a', 'k' => 'same'], 1 => ['n' => 'b', 'k' => 'other']];
probe('pluck-out-of-order', "Arr::pluck([2 => ['n' => 'c', 'k' => 'kc'], 0 => ['n' => 'a', 'k' => 'ka'], 1 => ['n' => 'b', 'k' => 'kb']], 'n')", fn () => pairs(Arr::pluck($pluckRows, 'n')));
probe('pluck-out-of-order-keyed', "Arr::pluck([2 => ['n' => 'c', 'k' => 'kc'], 0 => ['n' => 'a', 'k' => 'ka'], 1 => ['n' => 'b', 'k' => 'kb']], 'n', 'k')", fn () => pairs(Arr::pluck($pluckRows, 'n', 'k')));
probe('pluck-out-of-order-keyed-collision', "Arr::pluck([2 => ['n' => 'c', 'k' => 'same'], 0 => ['n' => 'a', 'k' => 'same'], 1 => ['n' => 'b', 'k' => 'other']], 'n', 'k')", fn () => pairs(Arr::pluck($pluckColliding, 'n', 'k')));
probe('pluck-mixed', "Arr::pluck(['x' => ['n' => 'X'], 0 => ['n' => 'Z'], 'y' => ['n' => 'Y']], 'n')", fn () => pairs(Arr::pluck(['x' => ['n' => 'X'], 0 => ['n' => 'Z'], 'y' => ['n' => 'Y']], 'n')));
probe('pluck-collision', "Arr::pluck([1 => ['n' => 'a'], 0 => ['n' => 'z'], '1' => ['n' => 'b']], 'n')", fn () => pairs(Arr::pluck([1 => ['n' => 'a'], 0 => ['n' => 'z'], '1' => ['n' => 'b']], 'n')));
probe('pluck-out-of-order-whole-items-keyed', "Arr::pluck([2 => ['n' => 'c', 'k' => 'kc'], 0 => ['n' => 'a', 'k' => 'ka'], 1 => ['n' => 'b', 'k' => 'kb']], null, 'k')", fn () => pairs(Arr::pluck($pluckRows, null, 'k')));
probe('pluck-out-of-order-callback-order', "Arr::pluck([2 => ['n' => 'c', 'k' => 'kc'], 0 => ['n' => 'a', 'k' => 'ka'], 1 => ['n' => 'b', 'k' => 'kb']], fn (\$item) => \$item['n'], fn (\$item) => \$item['k']) => 'v:' . \$item['n'] per value call, 'k:' . \$item['n'] per key call", function () use ($pluckRows) {
    $seen = [];

    Arr::pluck(
        $pluckRows,
        function ($item) use (&$seen) {
            $seen[] = 'v:' . $item['n'];

            return $item['n'];
        },
        function ($item) use (&$seen) {
            $seen[] = 'k:' . $item['n'];

            return $item['k'];
        },
    );

    return $seen;
});

$ties = [2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']];
probe('sort-out-of-order', "Arr::sort([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => pairs(Arr::sort(OUT_OF_ORDER)));
probe('sort-out-of-order-ties', "Arr::sort([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], 'n')", fn () => pairs(Arr::sort($ties, 'n')));
probe('sort-out-of-order-ties-callback', "Arr::sort([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], fn (\$v, \$k) => \$v['n'])", fn () => pairs(Arr::sort($ties, fn ($v, $k) => $v['n'])));
probe('sort-out-of-order-ties-callback-order', "Arr::sort([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], fn (\$v, \$k) => \$v['n']) => keys seen", fn () => keysSeen(fn ($cb) => Arr::sort($ties, $cb), fn ($v) => $v['n']));
probe('sort-out-of-order-ties-descriptor', "Arr::sort([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], [['n', 'asc']])", fn () => pairs(Arr::sort($ties, [['n', 'asc']])));
probe('sort-mixed-callback-order', "Arr::sort(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => \$v) => keys seen", fn () => keysSeen(fn ($cb) => Arr::sort(MIXED, $cb), fn ($v) => $v));
probe('sort-out-of-order-loose-ties', "Arr::sort([2 => '1', 0 => 1, 1 => '01'])", fn () => pairs(Arr::sort([2 => '1', 0 => 1, 1 => '01'])));
probe('sortDesc-out-of-order-ties', "Arr::sortDesc([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], 'n')", fn () => pairs(Arr::sortDesc($ties, 'n')));
probe('sortDesc-out-of-order-ties-callback-order', "Arr::sortDesc([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], fn (\$v, \$k) => \$v['n']) => keys seen", fn () => keysSeen(fn ($cb) => Arr::sortDesc($ties, $cb), fn ($v) => $v['n']));
probe('sortDesc-mixed-callback-order', "Arr::sortDesc(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => \$v) => keys seen", fn () => keysSeen(fn ($cb) => Arr::sortDesc(MIXED, $cb), fn ($v) => $v));
probe('sortDesc-out-of-order-loose-ties', "Arr::sortDesc([2 => '1', 0 => 1, 1 => '01'])", fn () => pairs(Arr::sortDesc([2 => '1', 0 => 1, 1 => '01'])));
probe('sortDesc-out-of-order-ties-descriptor', "Arr::sortDesc([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], [['n', 'asc']])", fn () => pairs(Arr::sortDesc($ties, [['n', 'asc']])));
// '1' lands on key 1's first position with the last value, '01', which ties 1 loosely.
probe('sort-collision-loose-ties', "Arr::sort([1 => '1', 0 => 1, '1' => '01'])", fn () => pairs(Arr::sort([1 => '1', 0 => 1, '1' => '01'])));
probe('sortDesc-collision-loose-ties', "Arr::sortDesc([1 => '1', 0 => 1, '1' => '01'])", fn () => pairs(Arr::sortDesc([1 => '1', 0 => 1, '1' => '01'])));
// The rows are arrays here; in JS the same rows as Maps cannot be read by path (see the tests).
probe('sort-out-of-order-rows-by-path', "Arr::sort([2 => ['n' => 1], 0 => ['n' => 0]], 'n')", fn () => pairs(Arr::sort([2 => ['n' => 1], 0 => ['n' => 0]], 'n')));
probe('sort-out-of-order-rows-by-descriptor', "Arr::sort([2 => ['n' => 1], 0 => ['n' => 0]], [['n', 'asc']])", fn () => pairs(Arr::sort([2 => ['n' => 1], 0 => ['n' => 0]], [['n', 'asc']])));
probe('sortDesc-out-of-order-rows-by-path', "Arr::sortDesc([2 => ['n' => 0], 0 => ['n' => 1]], 'n')", fn () => pairs(Arr::sortDesc([2 => ['n' => 0], 0 => ['n' => 1]], 'n')));
probe('sortDesc-out-of-order-rows-by-descriptor', "Arr::sortDesc([2 => ['n' => 0], 0 => ['n' => 1]], [['n', 'asc']])", fn () => pairs(Arr::sortDesc([2 => ['n' => 0], 0 => ['n' => 1]], [['n', 'asc']])));

probe('sortRecursive-descending-int-keys', "Arr::sortRecursive([1 => 'a', 0 => 'b'])", fn () => pairs(Arr::sortRecursive([1 => 'a', 0 => 'b'])));
probe('sortRecursive-out-of-order', "Arr::sortRecursive([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => pairs(Arr::sortRecursive(OUT_OF_ORDER)));
probe('sortRecursive-out-of-order-key-and-value-sorts-disagree', "Arr::sortRecursive([2 => 'a', 0 => 'c', 1 => 'b'])", fn () => pairs(Arr::sortRecursive([2 => 'a', 0 => 'c', 1 => 'b'])));
probe('sortRecursiveDesc-descending-int-keys', "Arr::sortRecursiveDesc([1 => 'a', 0 => 'b'])", fn () => pairs(Arr::sortRecursiveDesc([1 => 'a', 0 => 'b'])));
probe('sortRecursiveDesc-out-of-order', "Arr::sortRecursiveDesc([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => pairs(Arr::sortRecursiveDesc(OUT_OF_ORDER)));
probe('sortRecursiveDesc-out-of-order-key-and-value-sorts-disagree', "Arr::sortRecursiveDesc([2 => 'a', 0 => 'c', 1 => 'b'])", fn () => pairs(Arr::sortRecursiveDesc([2 => 'a', 0 => 'c', 1 => 'b'])));
// [1 => ..., 0 => ...] is not a list, so it is key-sorted and each key keeps its own value.
probe('sortRecursive-out-of-order-nested', "Arr::sortRecursive([1 => ['b' => 2, 'a' => 1], 0 => 'z'])", fn () => pairs(Arr::sortRecursive([1 => ['b' => 2, 'a' => 1], 0 => 'z'])));
// '1' lands on key 1's first position with the last value, so the array is [1 => 'b', 0 => 'c'].
probe('sortRecursive-collision', "Arr::sortRecursive([1 => 'a', 0 => 'c', '1' => 'b'])", fn () => pairs(Arr::sortRecursive([1 => 'a', 0 => 'c', '1' => 'b'])));
probe('sortRecursiveDesc-collision', "Arr::sortRecursiveDesc([1 => 'a', 0 => 'c', '1' => 'b'])", fn () => pairs(Arr::sortRecursiveDesc([1 => 'a', 0 => 'c', '1' => 'b'])));
// '1' lands on key 1's first position, so the array is [1 => 'b', 0 => 'a']: not a list, so key-sorted.
probe('sortRecursiveDesc-collision-out-of-order', "Arr::sortRecursiveDesc([1 => 'c', 0 => 'a', '1' => 'b'])", fn () => pairs(Arr::sortRecursiveDesc([1 => 'c', 0 => 'a', '1' => 'b'])));
// '0' lands on key 0 with the last value, so the array is the LIST [0 => 'c', 1 => 'a'], sorted by value.
probe('sortRecursive-collision-makes-list', "Arr::sortRecursive([0 => 'b', 1 => 'a', '0' => 'c'])", fn () => pairs(Arr::sortRecursive([0 => 'b', 1 => 'a', '0' => 'c'])));
probe('sortRecursiveDesc-collision-makes-list', "Arr::sortRecursiveDesc([0 => 'z', 1 => 'b', '0' => 'a'])", fn () => pairs(Arr::sortRecursiveDesc([0 => 'z', 1 => 'b', '0' => 'a'])));

// ---- 7. Controls: answers that do not depend on order.
probe('get-out-of-order-int-key', "Arr::get([2 => 'c', 0 => 'a', 1 => 'b'], 2)", fn () => Arr::get(OUT_OF_ORDER, 2));
probe('get-mixed-string-key', "Arr::get(['x' => 1, 0 => 2, 'y' => 3], 'y')", fn () => Arr::get(MIXED, 'y'));
probe('has-out-of-order', "Arr::has([2 => 'c', 0 => 'a', 1 => 'b'], [0, 2])", fn () => Arr::has(OUT_OF_ORDER, [0, 2]));
probe('has-out-of-order-missing', "Arr::has([2 => 'c', 0 => 'a', 1 => 'b'], [0, 5])", fn () => Arr::has(OUT_OF_ORDER, [0, 5]));
probe('count-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->count()", fn () => (new Collection(OUT_OF_ORDER))->count());
probe('count-collision', "(new Collection([1 => 'a', 'x' => 'q', '1' => 'b']))->count()", fn () => (new Collection([1 => 'a', 'x' => 'q', '1' => 'b']))->count());
probe('except-out-of-order', "Arr::except([2 => 'c', 0 => 'a', 1 => 'b'], [0])", fn () => pairs(Arr::except(OUT_OF_ORDER, [0])));
probe('diff-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->diff(['a'])", fn () => pairs((new Collection(OUT_OF_ORDER))->diff(['a'])->all()));
probe('intersectByKeys-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->intersectByKeys([0 => 'z', 2 => 'z'])", fn () => pairs((new Collection(OUT_OF_ORDER))->intersectByKeys([0 => 'z', 2 => 'z'])->all()));
probe('whereNotNull-out-of-order', "Arr::whereNotNull([2 => 'c', 0 => null, 1 => 'b'])", fn () => pairs(Arr::whereNotNull([2 => 'c', 0 => null, 1 => 'b'])));
// A null written last over an integer key's earlier value drops that key.
probe('whereNotNull-collision-null-last', "Arr::whereNotNull([1 => 'a', 'x' => 'm', '1' => null])", fn () => pairs(Arr::whereNotNull([1 => 'a', 'x' => 'm', '1' => null])));

emit();
