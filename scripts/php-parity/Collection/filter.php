<?php

/**
 * Ground truth for Collection::filter().
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

probe('Collection::filter() falsy set', '(new Collection([...]))->filter()', function () {
    return (new Collection([
        'a' => '0', 'b' => '', 'c' => 0, 'd' => [], 'e' => false,
        'f' => null, 'g' => 'x', 'h' => '00', 'i' => '0.0',
    ]))->filter()->all();
});

probe('X16 filter drops PHP-falsy "0" but keeps "00" and "0.0"', 'collect([...])->filter()', function () {
    return (new Collection(['0', '00', '0.0', '', 0, false, null, [], 'a']))->filter()->all();
});
probe('C14 filter by key', '(new Collection([\'id\' => 1, \'first\' => \'Hello\', \'second\' => \'World\']))->filter(fn ($item, $key) => $key !== \'id\')->all()', fn () => (new Collection(['id' => 1, 'first' => 'Hello', 'second' => 'World']))->filter(fn ($item, $key) => $key !== 'id')->all());
probe('F1 filter callback key type for int key', '[\'result\' => (new Collection([1 => \'a\', \'x\' => \'b\']))->filter(fn ($v, $k) => $k === 1)->all(), \'seen\' => [gettype($k), $k] per call]', function () {
    $seen = [];
    $r = (new Collection([1 => 'a', 'x' => 'b']))->filter(function ($v, $k) use (&$seen) { $seen[] = [gettype($k), $k]; return $k === 1; })->all();
    return ['result' => $r, 'seen' => $seen];
});

probe('filter-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->filter(fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->filter($cb), true));
probe('filter-mixed-callback-order', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->filter(fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(MIXED))->filter($cb), true));
probe('filter-out-of-order-first-two-visits', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->filter(a callback true for its first two calls)", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->filter(firstVisits(2))->all()));
probe('filter-mixed-first-visit', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->filter(a callback true for its first call)", fn () => arrayablePairs((new Collection(MIXED))->filter(firstVisits(1))->all()));
probe('filter-mixed-no-callback', "(new Collection(['x' => 0, 2 => 'c', 'y' => 'y', 0 => '', 1 => 'b']))->filter()", fn () => arrayablePairs((new Collection(['x' => 0, 2 => 'c', 'y' => 'y', 0 => '', 1 => 'b']))->filter()->all()));
probe('filter-collision', "(new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->filter(fn (\$v) => \$v === 'a')", fn () => arrayablePairs((new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->filter(fn ($v) => $v === 'a')->all()));

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];

$c32KeysSeen = function (callable $run, bool $answer = false): array {
    $seen = [];
    $run(function ($v, $k) use (&$seen, $answer) {
        $seen[] = [gettype($k), $k];

        return $answer;
    });

    return $seen;
};
probe('C32-C-collection-callback-php-truthiness', "each callback method over new Collection(c32c_items(list | keyed)), sole / hasSole / containsOneItem over its first item alone, with a callback answering '0', [] and new DateTime('@0'); before's callback answers it for 'b' only, chunkWhile records each chunk's values, when / unless take it as the condition and record whether fn () => 'called' ran", fn () => array_map(fn (bool $keyed) => [
    'filter' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->filter($cb)),
    'where' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->where($cb)),
    'reject' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->reject($cb)),
    'first' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->first($cb)),
    'last' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->last($cb)),
    'firstWhere' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->firstWhere($cb)),
    'firstOrFail' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->firstOrFail($cb)),
    'sole' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed, true)))->sole($cb)),
    'every' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->every($cb)),
    'some' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->some($cb)),
    'contains' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->contains($cb)),
    'doesntContain' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->doesntContain($cb)),
    'containsStrict' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->containsStrict($cb)),
    'doesntContainStrict' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->doesntContainStrict($cb)),
    'search' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->search($cb)),
    'before' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->before(fn ($v) => $v === 'b' ? $cb() : false)),
    'after' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->after($cb)),
    'hasSole' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed, true)))->hasSole($cb)),
    'containsOneItem' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed, true)))->containsOneItem($cb)),
    'hasMany' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->hasMany($cb)),
    'containsManyItems' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->containsManyItems($cb)),
    'partition' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->partition($cb)),
    'chunkWhile' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->chunkWhile($cb)->map(fn (Collection $chunk) => $chunk->values()->all())),
    'percentage' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->percentage($cb)),
    'when' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->when($cb(), fn () => 'called') === 'called'),
    'unless' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->unless($cb(), fn () => 'called') === 'called'),
], ['list' => false, 'keyed' => true]));

// whereIn / whereNotIn: in_array's loose == is PHP's, not JS's
$vs = fn (array $values) => new Collection(array_map(fn ($v) => ['v' => $v], $values));

probe('C32-D-filter-keeps-empty-objects', "(new Collection([new DateTime('@0'), new stdClass, new ArrayObject, new SplObjectStorage, 'x']))->filter()->count()", fn () => (new Collection([new DateTime('@0'), new stdClass, new ArrayObject, new SplObjectStorage, 'x']))->filter()->count());
probe('C32-D-filter-callback-string-zero', "(new Collection([1, 2]))->filter(fn (\$v) => \$v > 1 ? '0' : 'x')", fn () => pairs((new Collection([1, 2]))->filter(fn ($v) => $v > 1 ? '0' : 'x')));

emit();
