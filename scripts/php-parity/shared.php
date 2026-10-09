<?php

/**
 * Helper functions and fixture classes the probe scripts share.
 */

declare(strict_types=1);

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

require_once repoRoot() . '/packages/collection/stubs/Common.php';

/** The one fixture every row that can use it uses: keys 0..3, values 10..40. */
function nums(): array
{
    return [10, 20, 30, 40];
}

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

// D1 — PHP 8 loose comparison. Every pair here becomes a literal in equality.spec.ts.
class StringableProbe
{
    public function __construct(private string $value)
    {
    }

    public function __toString(): string
    {
        return $this->value;
    }
}

/** A plain object with an own field, for the probes that write through a nested object. */
class D4Point
{
    public function __construct(public int $x) {}
}

/** The out-of-order backing every order probe below starts from. */
function d8Base(): array
{
    return [2 => 'c', 0 => 'a', 1 => 'b'];
}

/** Capture the three views a Collection exposes, in one row. */
function d8Views(Collection $collection): array
{
    return [
        'all' => $collection->all(),
        'values' => $collection->values()->all(),
        'keys' => $collection->keys()->all(),
    ];
}

/** A real Arrayable: the interface PHP's `getArrayableItems` actually tests for. */
class D8Arrayable implements Arrayable
{
    public function toArray(): array
    {
        return [4, 5, 6];
    }
}

/** The out-of-order backing every order probe below starts from. */
function e0Base(): array
{
    return [2 => 'c', 0 => 'a', 1 => 'b'];
}

/** Capture the three views a Collection exposes, in one row. */
function e0Views(Collection $collection): array
{
    return [
        'all' => $collection->all(),
        'values' => $collection->values()->all(),
        'keys' => $collection->keys()->all(),
    ];
}

/** Record one `Collection::search` call under a label. */
function search(string $label, string $expression, array $items, mixed $needle, bool $strict): void
{
    probe($label, $expression, fn () => (new Collection($items))->search($needle, $strict));
}

// ---- 1. Traversable backing: what the JS Set and generator have to match.
/** The Traversable every probe below starts from, equal to the list [1, 2]. */
function traversable(): Generator
{
    yield 1;
    yield 2;
}

// ---- 4. An empty dot-path segment.
/** Run one `Arr::set` on a fresh empty array and record what it wrote. */
function setOn(string $label, string $expression, string $key): void
{
    probe($label, $expression, function () use ($key) {
        $target = [];
        Arr::set($target, $key, 9);

        return $target;
    });
}

const OUT_OF_ORDER = [2 => 'c', 0 => 'a', 1 => 'b'];

const MIXED = ['x' => 1, 0 => 2, 'y' => 3];

/**
 * Encode $value so JSON keeps its key order: each non-list array, at any depth, becomes a list of [key, value] pairs.
 *
 * @example pairs([2 => 'c', 0 => 'a']); -> [[2, 'c'], [0, 'a']]
 */
function arrayablePairs(mixed $value): mixed
{
    if ($value instanceof Arrayable) {
        $value = $value->toArray();
    }

    if (! is_array($value)) {
        return $value;
    }

    if (array_is_list($value)) {
        return array_map(arrayablePairs(...), $value);
    }

    $out = [];

    foreach ($value as $key => $item) {
        $out[] = [$key, arrayablePairs($item)];
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
    probe("{$label}-returns", $expression, fn () => arrayablePairs($mutate(new Collection($items))));

    probe("{$label}-remaining", "{$expression}; \$c->all()", function () use ($items, $mutate) {
        $c = new Collection($items);
        $mutate($c);

        return arrayablePairs($c->all());
    });
}

/** Record [key, chunk handed in] for every chunkWhile callback call, answering $answer. */
function chunkWhileSeen(array $items, bool $answer): array
{
    $seen = [];

    (new Collection($items))->chunkWhile(function ($value, $key, $chunk) use (&$seen, $answer) {
        $seen[] = [$key, arrayablePairs($chunk->all())];

        return $answer;
    });

    return $seen;
}

/**
 * Encode $value so JSON keeps its key order: each non-list array, at any depth, becomes a list of [key, value] pairs.
 *
 * @example pairs(['b' => 1, 'a' => 2]); -> [['b', 1], ['a', 2]]
 */
function pairs(mixed $value): mixed
{
    if ($value instanceof Collection) {
        $value = $value->all();
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

/** Hand containsStrict a key-recording callback that answers $answer($value), and return the keys it saw in order. */
function containsStrictKeysSeen(Collection $collection, Closure $answer): array
{
    $seen = [];

    $collection->containsStrict(function ($value, $key) use (&$seen, $answer) {
        $seen[] = $key;

        return $answer($value);
    });

    return $seen;
}

// ---- Family A ------------------------------------------------------------

class C32ASub extends Collection {}

class C32AArrayableAndJsonSerializable implements Arrayable, JsonSerializable {
    public function toArray() { return ['from' => 'toArray']; }
    public function jsonSerialize(): mixed { return ['from' => 'jsonSerialize']; }
}

class C32AArrayableAndJsonable implements Arrayable, Jsonable {
    public function toArray() { return ['from' => 'toArray']; }
    public function toJson($options = 0) { return '{"from":"toJson"}'; }
}

class C32ABadJsonable implements Jsonable {
    public function toJson($options = 0) { return 'not-json'; }
}

class C32AThrowingJsonable implements Jsonable {
    public function toJson($options = 0) { throw new RuntimeException('toJson failed'); }
}

class C32AJsonSerializeToString implements JsonSerializable {
    public function jsonSerialize(): string { return 'foobar'; }
}

class C32AParent {}

class C32AChild extends C32AParent {}

// ---- Family C ------------------------------------------------------------

enum C32StaffEnum
{
    case Taylor;
    case Joe;
}

/** The items ['a', 'b'] (or ['a'] alone), as a list or keyed 'x', 'y'. */
function c32c_items(bool $keyed, bool $one = false): array
{
    $items = $keyed ? ['x' => 'a', 'y' => 'b'] : ['a', 'b'];

    return $one ? array_slice($items, 0, 1, true) : $items;
}

/** What $run answers for a callback answering '0', [] and new DateTime('@0'), or the short name of what it throws. */
function c32c_truthiness(callable $run): array
{
    return array_map(function ($result) use ($run) {
        try {
            return pairs($run(fn () => $result));
        } catch (\Throwable $e) {
            return (new ReflectionClass($e))->getShortName();
        }
    }, ['0', [], new DateTime('@0')]);
}

/** Three Collection rows, 'k' => b, a, b and 'v' => 1, 2, 3, as a list or keyed 'x', 'y', 'z'. */
function c32c_rows(bool $keyed): Collection
{
    $rows = [new Collection(['k' => 'b', 'v' => 1]), new Collection(['k' => 'a', 'v' => 2]), new Collection(['k' => 'b', 'v' => 3])];

    return new Collection($keyed ? array_combine(['x', 'y', 'z'], $rows) : $rows);
}

/** What $run answers, or the class and message of what it throws. */
function c32c_outcome(callable $run): mixed
{
    try {
        return $run();
    } catch (\Throwable $e) {
        return [get_class($e), $e->getMessage()];
    }
}

/** The rows as a list, or keyed 'x', 'y', 'z' in order. */
function c32d_items(bool $keyed, array $rows): Collection
{
    return new Collection($keyed ? array_combine(array_slice(['x', 'y', 'z'], 0, count($rows)), $rows) : $rows);
}

/** The c32c rows as plain arrays, the shape a JS Map row stands for. */
function c32d_array_rows(bool $keyed): Collection
{
    $rows = [['k' => 'b', 'v' => 1], ['k' => 'a', 'v' => 2], ['k' => 'b', 'v' => 3]];

    return new Collection($keyed ? array_combine(['x', 'y', 'z'], $rows) : $rows);
}

/** An ArrayAccess that is not Enumerable, whose offsetExists is isset. */
class C32D_Access implements ArrayAccess
{
    public function __construct(private array $items) {}
    public function offsetExists(mixed $offset): bool { return isset($this->items[$offset]); }
    public function offsetGet(mixed $offset): mixed { return $this->items[$offset]; }
    public function offsetSet(mixed $offset, mixed $value): void { $this->items[$offset] = $value; }
    public function offsetUnset(mixed $offset): void { unset($this->items[$offset]); }
}

/** An ArrayAccess whose offsetExists gives the same answer for every offset. */
class C32D_AnsweringAccess implements ArrayAccess
{
    public function __construct(private array $items, private mixed $answer) {}
    #[\ReturnTypeWillChange]
    public function offsetExists(mixed $offset) { return $this->answer; }
    public function offsetGet(mixed $offset): mixed { return $this->items[$offset]; }
    public function offsetSet(mixed $offset, mixed $value): void { $this->items[$offset] = $value; }
    public function offsetUnset(mixed $offset): void { unset($this->items[$offset]); }
}

/** An object with one public property that holds null. */
class C32D_Point { public $p = null; }

/** An ArrayAccess row whose offsets answer apart from its public properties. */
class C32D_SelectAccess implements ArrayAccess
{
    public $a = 'prop-a';
    public $p = 'prop-p';
    public $q = null;
    public function __construct(private array $items) {}
    public function offsetExists(mixed $offset): bool { return array_key_exists($offset, $this->items); }
    public function offsetGet(mixed $offset): mixed { return $this->items[$offset]; }
    public function offsetSet(mixed $offset, mixed $value): void { $this->items[$offset] = $value; }
    public function offsetUnset(mixed $offset): void { unset($this->items[$offset]); }
}

/** An ArrayAccess row that counts the offsetExists and offsetGet calls it answers. */
class C32D_CountingAccess implements ArrayAccess
{
    public int $exists = 0;
    public int $gets = 0;
    public function __construct(private array $items) {}
    public function offsetExists(mixed $offset): bool { $this->exists++; return array_key_exists($offset, $this->items); }
    public function offsetGet(mixed $offset): mixed { $this->gets++; return $this->items[$offset]; }
    public function offsetSet(mixed $offset, mixed $value): void { $this->items[$offset] = $value; }
    public function offsetUnset(mixed $offset): void { unset($this->items[$offset]); }
}

// ---- Family E ------------------------------------------------------------

enum C32E_Pure { case A; }

enum C32E_Int: int { case A = 1; case B = 2; }

enum C32E_Str: string { case A = 'A'; case B = 'B'; }

enum C32E_Staff { case Taylor; case Joe; case James; }

class C32E_Args { public array $args; public function __construct(...$args) { $this->args = $args; } }

class C32E_Accessor { public function __construct(protected array $attributes) {}
    public function __get($k) { return $k === 'some' ? $this->attributes['some'] : null; }
    public function __isset($k) { return $k === 'some'; } }

/** Each entry as [key, gettype(key), value]; nested Collections become ['Collection' => entries], preserving order. */
function c32e_pairs($items): array { $out = []; foreach ($items as $k => $v) { $out[] = [$k, gettype($k), $v instanceof Collection ? ['Collection' => c32e_pairs($v)] : $v]; } return $out; }

/** Every argument list eachSpread() hands its callback, in the order it calls it. */
function c32e_each_spread_args(Collection $c): array { $seen = []; $c->eachSpread(function (...$a) use (&$seen) { $seen[] = $a; }); return $seen; }

// ---- Family H ------------------------------------------------------------

class C32HUser { public function __construct(public $email) {} }

class C32HToString { public function __construct(public $v) {} public function __toString(): string { return 'S:'.$this->v; } }

class Task33Basket extends Collection {}

/**
 * Encode $value so JSON keeps what it is: a LazyCollection as ['lazy' => items], a Collection as
 * ['collection' => items], and a keyed array as a list of [key, value] pairs, since a JSON object loses key order.
 */
function shown(mixed $value): mixed
{
    if ($value instanceof LazyCollection) {
        return ['lazy' => shown($value->all())];
    }

    if ($value instanceof Collection) {
        return ['collection' => shown($value->all())];
    }

    if (! is_array($value)) {
        return $value;
    }

    if (array_is_list($value)) {
        return array_map(shown(...), $value);
    }

    $out = [];

    foreach ($value as $key => $item) {
        $out[] = [$key, shown($item)];
    }

    return $out;
}

/** What shift(...$count) answers on a collection of $items, and what the collection holds after. */
function shifted(mixed $items, mixed ...$count): array
{
    $collection = new Collection($items);

    return ['returned' => shown($collection->shift(...$count)), 'left' => $collection->all()];
}

/** Run each [$value, $charlist] case through Str::$method, recording [$value, $charlist, result]. */
function trimmed(string $method, array $cases): array
{
    return array_map(
        fn (array $case) => [...$case, $case[1] === null ? Str::$method($case[0]) : Str::$method(...$case)],
        $cases,
    );
}

/** Collapse a sorted list of code points into "XXXX" and "XXXX-YYYY" hex ranges. */
function codePointRanges(array $codePoints): array
{
    $ranges = [];

    foreach ($codePoints as $codePoint) {
        $last = array_key_last($ranges);

        if ($last !== null && $ranges[$last][1] === $codePoint - 1) {
            $ranges[$last][1] = $codePoint;
        } else {
            $ranges[] = [$codePoint, $codePoint];
        }
    }

    return array_map(
        fn (array $range) => $range[0] === $range[1] ? sprintf('%04X', $range[0]) : sprintf('%04X-%04X', ...$range),
        $ranges,
    );
}
