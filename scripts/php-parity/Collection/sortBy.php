<?php

/**
 * Ground truth for Collection::sortBy().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

// Keeps PHP's deprecation notices off stdout, where they would corrupt emit()'s JSON.
error_reporting(E_ALL & ~E_DEPRECATED);

// Critical 2: Collection::sortByMany's direction match-arm compares against
// the SortDirection enum and booleans; the string forms 'asc'/'desc' and any
// unrecognized value must still route through the same match arms.
probe('Collection::sortBy — string "desc" direction sorts descending', 'sortBy([["age","desc"]])', function () {
    $c = new \Illuminate\Support\Collection(['a' => ['age' => 2], 'b' => ['age' => 10]]);

    return $c->sortBy([['age', 'desc']])->values()->all();
});

probe('Collection::sortBy — unrecognized direction sorts descending (default arm)', 'sortBy([["age","BOGUS"]])', function () {
    $c = new \Illuminate\Support\Collection(['a' => ['age' => 2], 'b' => ['age' => 10]]);

    return $c->sortBy([['age', 'BOGUS']])->values()->all();
});

// sortBy's array form never forwards $descending to sortByMany, so a direction-less descriptor sorts ascending.
probe('Collection::sortBy — global $descending=true is ignored for the array-of-descriptors form', 'sortBy([["age"]], SORT_REGULAR, true)', function () {
    $c = new \Illuminate\Support\Collection(['a' => ['age' => 10], 'b' => ['age' => 2]]);

    return $c->sortBy([['age']], SORT_REGULAR, true)->values()->all();
});

// Task 7 (U3): all() and values() must agree about ORDER for sortBy and
// sortByDesc over integer keys - values() is just all() with keys dropped.
probe('sortBy/sortByDesc: all() and values() agree on order', 'sortBy/sortByDesc over [0=>3,1=>1,2=>2]', function () {
    $c = new \Illuminate\Support\Collection([0 => ['v' => 3], 1 => ['v' => 1], 2 => ['v' => 2]]);

    return [
        'sortby_all' => $c->sortBy('v')->all(),
        'sortby_values' => $c->sortBy('v')->values()->all(),
        'sortbydesc_all' => $c->sortByDesc('v')->all(),
        'sortbydesc_values' => $c->sortByDesc('v')->values()->all(),
        'sortbymany_values' => $c->sortBy([['v']])->values()->all(),
    ];
});

// Task 7 (U3): the sortBy/sortByMany rows whose TS expectations had frozen
// the pre-fix no-op - an integer-keyed backing simply kept its input order.
probe('sortBy/sortByMany over an integer-keyed backing', 'sortBy(fn), sortBy([[key]]), sortBy([comparator])', function () {
    $words = new \Illuminate\Support\Collection(['taylor', 'dayle']);
    $imgs = new \Illuminate\Support\Collection([
        ['item' => 'img1'], ['item' => 'img101'], ['item' => 'img10'], ['item' => 'img11'],
    ]);
    $vals = new \Illuminate\Support\Collection([['value' => 10], ['value' => 5], ['value' => 20]]);
    $nums = new \Illuminate\Support\Collection([3, 1, 2]);
    $byValue = static fn ($a, $b) => $a['value'] <=> $b['value'];

    $records = new \Illuminate\Support\Collection([['sort' => 2], ['sort' => 1]]);

    return [
        'words_all' => $words->sortBy(fn ($x) => $x)->all(),
        'words_values' => $words->sortBy(fn ($x) => $x)->values()->all(),
        'records_all' => $records->sortBy('sort')->all(),
        'records_values' => $records->sortBy('sort')->values()->all(),
        'imgs_plucked' => $imgs->sortBy([['item']])->pluck('item')->all(),
        'vals_plucked' => $vals->sortBy([$byValue])->pluck('value')->all(),
        'nums_all' => $nums->sortBy([static fn ($a, $b) => $a <=> $b])->all(),
        'nums_values' => $nums->sortBy([static fn ($a, $b) => $a <=> $b])->values()->all(),
    ];
});

probe('sortBy with no comparisons leaves the order alone', 'collect([3,1,2])->sortBy([])', function () {
    return collect([3, 1, 2])->sortBy([])->all();
});

// B4 — sortBy over array values
probe('sortBy(null) over array values', 'collect(["a"=>["n"=>2],"b"=>["n"=>1],"c"=>["n"=>3]])->sortBy(null)->values()', fn () => collect(['a' => ['n' => 2], 'b' => ['n' => 1], 'c' => ['n' => 3]])->sortBy(null)->values()->all());

// B5 — sortByMany tie-breaking
probe('sortByMany falls through on an equal first key', 'collect([["a"=>[],"b"=>2],["a"=>[],"b"=>1]])->sortBy([["a","asc"],["b","asc"]])->values()', fn () => collect([['a' => [], 'b' => 2], ['a' => [], 'b' => 1]])->sortBy([['a', 'asc'], ['b', 'asc']])->values()->all());
probe('sortByMany treats 1 and "1" as a tie', 'collect([["a"=>1,"b"=>2],["a"=>"1","b"=>1]])->sortBy([["a","asc"],["b","asc"]])->values()', fn () => collect([['a' => 1, 'b' => 2], ['a' => '1', 'b' => 1]])->sortBy([['a', 'asc'], ['b', 'asc']])->values()->all());

// B5 — sortByMany's comparison is <=>, not a string cast
$mixed = [['item' => '1'], ['item' => '10'], ['item' => 5], ['item' => 20]];
probe('sortByMany orders mixed numeric strings and ints numerically', 'collect($mixed)->sortBy(["item"])->pluck("item")', fn () => collect($mixed)->sortBy(['item'])->pluck('item')->all());

// Collection.php:1646-1657 — Arr::wrap($comparison) then is_callable($prop), so a
// comparator nested in a one-element descriptor runs as a comparator
$rows = [['age' => 3], ['age' => 1], ['age' => 2]];
$byAge = fn ($a, $b) => $a['age'] <=> $b['age'];
probe('sortBy runs a comparator nested in a one-element descriptor', 'collect($rows)->sortBy([[$byAge]])->values()', fn () => collect($rows)->sortBy([[$byAge]])->values()->all());
probe('sortBy treats [[fn]] and [fn] the same', 'collect($rows)->sortBy([$byAge])->values()', fn () => collect($rows)->sortBy([$byAge])->values()->all());

// B6 — the same ordering seen through every sort entry point the port mirrors.
$mixed = ['9', '10', '1', 5];
probe('Collection::sortBy(null) orders numeric strings numerically', 'collect(["9","10","1",5])->sortBy(null)->values()', fn () => collect($mixed)->sortBy(null)->values()->all());

// B6 — a keyed backing, which is what Obj.sort and sortByMany walk.
$rows = [['n' => '9'], ['n' => '10'], ['n' => '1'], ['n' => 5]];
probe('Collection::sortBy([key]) orders numeric strings numerically', 'collect($rows)->sortBy(["n"])->pluck("n")', fn () => collect($rows)->sortBy(['n'])->pluck('n')->all());

// sortBy over numbers and numeric strings: SORT_NUMERIC (laravel/framework#61699) and the default flag agree here.
$prices = fn () => new Collection([['price' => 1.5], ['price' => '10.5'], ['price' => 1.2], ['price' => '10.2'], ['price' => 1.9]]);
probe('sortBy-many-numeric-flag-asc', "sortBy([['price', 'asc']], SORT_NUMERIC)->pluck('price')->values()", fn () => $prices()->sortBy([['price', 'asc']], SORT_NUMERIC)->pluck('price')->values()->all());
probe('sortBy-many-numeric-flag-desc', "sortBy([['price', 'desc']], SORT_NUMERIC)->pluck('price')->values()", fn () => $prices()->sortBy([['price', 'desc']], SORT_NUMERIC)->pluck('price')->values()->all());
probe('sortBy-many-default-flag-asc', "sortBy([['price', 'asc']])->pluck('price')->values()", fn () => $prices()->sortBy([['price', 'asc']])->pluck('price')->values()->all());
probe('sortBy-many-default-flag-desc', "sortBy([['price', 'desc']])->pluck('price')->values()", fn () => $prices()->sortBy([['price', 'desc']])->pluck('price')->values()->all());
$rangeOutcome = function (array $arguments) {
    try {
        return Collection::range(...$arguments)->all();
    } catch (\Throwable $e) {
        return [get_class($e), $e->getMessage()];
    }
};

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];

// keys no PHP array can hold: each call over a list and a keyed backing, and what each holds after
$overBackings = fn (callable $call) => array_map(fn (Collection $c) => ['outcome' => c32c_outcome(fn () => $call($c)), 'all' => $c->all()], [collect(['a', 'b']), collect(['a' => 1, 'b' => 2])]);

$keysAndValues = fn (Collection $c) => ['keys' => $c->keys()->all(), 'values' => $c->values()->all()];

// shift() and pop() take their items one by one over range(1, min($count, count())), and PHP's min() answers the count
// of items over a NAN; range() refuses a float end less than one step from 1
$takeOutcome = function (string $method, array $items, $count) {
    $c = collect($items);
    $returned = c32c_outcome(function () use ($c, $method, $count) {
        $result = $c->$method($count);

        return $result instanceof Collection ? $result->all() : $result;
    });

    return ['returned' => $returned, 'all' => $c->all()];
};
$spliceOutcome = function (array $items, array $arguments) use ($keysAndValues) {
    $c = collect($items);
    $removed = c32c_outcome(fn () => $keysAndValues(@$c->splice(...$arguments)));

    return ['removed' => $removed] + $keysAndValues($c);
};

$c32KeysSeen = function (callable $run, bool $answer = false): array {
    $seen = [];
    $run(function ($v, $k) use (&$seen, $answer) {
        $seen[] = [gettype($k), $k];

        return $answer;
    });

    return $seen;
};

// whereIn / whereNotIn: in_array's loose == is PHP's, not JS's
$vs = fn (array $values) => new Collection(array_map(fn ($v) => ['v' => $v], $values));

// ---- Family G ------------------------------------------------------------

// Key-preserving probes return [[key, value], ...] so integer keys and order survive json_encode.
$pairs = function ($items) use (&$pairs) {
    $out = [];
    foreach ($items instanceof Collection ? $items->all() : $items as $k => $v) {
        $out[] = [$k, $v instanceof Collection ? $pairs($v) : $v];
    }

    return $out;
};
probe('C32-G-sortBy-callback-key-types-list', '(new Collection([10, 20]))->sortBy(fn ($v, $k) => ...) recording [gettype($k), $k]', function () {
    $seen = [];
    (new Collection([10, 20]))->sortBy(function ($v, $k) use (&$seen) {
        $seen[] = [gettype($k), $k];

        return $v;
    });

    return $seen;
});
probe('C32-G-sortBy-callback-key-types-int-keys', "(new Collection([5 => 'a', 7 => 'b']))->sortBy(fn (\$v, \$k) => ...) recording [gettype(\$k), \$k]", function () {
    $seen = [];
    (new Collection([5 => 'a', 7 => 'b']))->sortBy(function ($v, $k) use (&$seen) {
        $seen[] = [gettype($k), $k];

        return $v;
    });

    return $seen;
});
probe('C32-G-sortBy-callback-by-key', "(new Collection(['x' => 1, 'a' => 2, 'm' => 3]))->sortBy(fn (\$v, \$k) => \$k)->all()",
    fn () => $pairs((new Collection(['x' => 1, 'a' => 2, 'm' => 3]))->sortBy(fn ($v, $k) => $k)));
probe('C32-G-sortBy-descriptor-mixed-directions', "sortBy([['name', 'asc'], ['age', 'desc']]) over four people",
    fn () => (new Collection([['name' => 'b', 'age' => 1], ['name' => 'a', 'age' => 1], ['name' => 'a', 'age' => 3], ['name' => 'b', 'age' => 2]]))->sortBy([['name', 'asc'], ['age', 'desc']])->values()->all());
probe('C32-G-sortBy-string-Ascending-direction', "sortBy([['n', 'Ascending']]) - a plain string, not the enum",
    fn () => (new Collection([['n' => 2], ['n' => 1], ['n' => 3]]))->sortBy([['n', 'Ascending']])->pluck('n')->all());
probe('C32-G-sortByMany-mixed-case-default-flag', "sortBy(['item']) over img1/Img101/img10/Img11 (testSortByMany, default flag)",
    fn () => (new Collection([['item' => 'img1'], ['item' => 'Img101'], ['item' => 'img10'], ['item' => 'Img11']]))->sortBy(['item'])->pluck('item')->all());
probe('C32-G-sortByMany-umlaut-default-flag', "sortBy(['item']) over Österreich/Oesterreich/Zeta (testSortByMany, default flag)",
    fn () => (new Collection([['item' => 'Österreich'], ['item' => 'Oesterreich'], ['item' => 'Zeta']]))->sortBy(['item'])->pluck('item')->all());
probe('C32-G-sortByMany-null-desc-default-flag', "sortBy([['first','desc'],['second','desc']]) over [f/null, f/s] (testNaturalSortByManyWithNull, default flag)",
    fn () => (new Collection([['first' => 'f', 'second' => null], ['first' => 'f', 'second' => 's']]))->sortBy([['first', 'desc'], ['second', 'desc']])->values()->all());
probe('C32-G-sortByMany-null-values', "sortBy(['first','second']) and sortByDesc(['first','second']) over [f/null, f/s, a/z]", fn () => [
    'asc' => (new Collection([['first' => 'f', 'second' => null], ['first' => 'f', 'second' => 's'], ['first' => 'a', 'second' => 'z']]))->sortBy(['first', 'second'])->values()->all(),
    'desc' => (new Collection([['first' => 'f', 'second' => null], ['first' => 'f', 'second' => 's'], ['first' => 'a', 'second' => 'z']]))->sortByDesc(['first', 'second'])->values()->all(),
]);
probe('C32-G-sortBy-dot-path', "(new Collection([(object) ['id' => 1, 'foo' => ['bar' => 'B']], (object) ['id' => 2, 'foo' => ['bar' => 'A']]]))->sortBy('foo.bar')->pluck('id')->all()",
    fn () => (new Collection([(object) ['id' => 1, 'foo' => ['bar' => 'B']], (object) ['id' => 2, 'foo' => ['bar' => 'A']]]))->sortBy('foo.bar')->pluck('id')->all());
probe('C32-G-sortBy-collection-rows', "c32c_rows(list | keyed)->sortBy('k'): keys and each row's 'v'", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->sortBy('k')->keys()->all(),
    c32c_rows($keyed)->sortBy('k')->pluck('v')->all(),
], ['list' => false, 'keyed' => true]));
probe('C32-G-sortBy-descriptors-collection-rows', "c32c_rows(list | keyed)->sortBy([['k', 'asc'], ['v', 'desc']]): keys and each row's 'v'", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->sortBy([['k', 'asc'], ['v', 'desc']])->keys()->all(),
    c32c_rows($keyed)->sortBy([['k', 'asc'], ['v', 'desc']])->pluck('v')->all(),
], ['list' => false, 'keyed' => true]));

// Ties and groups over integer keys out of order, which only a Map-built collection holds in JS.
$gTies = [2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']];
probe('C32-G-sortBy-out-of-order-ties', "sortBy('n'), sortByDesc('n') and sortBy(['n']) over [2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']]: the ids in order", fn () => [
    'sortBy' => (new Collection($gTies))->sortBy('n')->pluck('id')->all(),
    'sortByDesc' => (new Collection($gTies))->sortByDesc('n')->pluck('id')->all(),
    'sortBy descriptors' => (new Collection($gTies))->sortBy(['n'])->pluck('id')->all(),
]);
probe('C32-G-sortByMany-desc-direction-forms', "testSortByMany's chain over [['item' => '1'], ['item' => '10'], ['item' => 5], ['item' => 20]]: sortBy(['item']), then sortBy([['item', 'desc']]), sortBy([['item', false]]) and sortBy([['item', SortDirection::Descending]]), each plucked", function () {
    $data = new Collection([['item' => '1'], ['item' => '10'], ['item' => 5], ['item' => 20]]);
    $out = [];

    foreach (['asc' => ['item'], 'desc' => [['item', 'desc']], 'false' => [['item', false]], 'Descending' => [['item', SortDirection::Descending]]] as $label => $comparisons) {
        $data = $data->sortBy($comparisons);
        $out[$label] = $data->pluck('item')->all();
    }

    return $out;
});
probe('C32-G-sortByMany-two-keys', "sortBy(['first', 'second']) and sortByDesc(['first', 'second']) over four rows, and sortBy(['primary', 'secondary']) over rows tying on the first key, then on both", function () {
    $four = [['first' => 'b', 'second' => 2], ['first' => 'a', 'second' => 3], ['first' => 'b', 'second' => 1], ['first' => 'a', 'second' => 1]];

    return [
        'asc' => (new Collection($four))->sortBy(['first', 'second'])->values()->all(),
        'desc' => (new Collection($four))->sortByDesc(['first', 'second'])->values()->all(),
        'first-key-ties' => (new Collection([['primary' => 'a', 'secondary' => 3], ['primary' => 'a', 'secondary' => 1], ['primary' => 'b', 'secondary' => 2]]))->sortBy(['primary', 'secondary'])->values()->all(),
        'both-keys-tie' => (new Collection([['primary' => 'a', 'secondary' => 1], ['primary' => 'a', 'secondary' => 1], ['primary' => 'b', 'secondary' => 2]]))->sortBy(['primary', 'secondary'])->values()->all(),
    ];
});
probe('C32-G-sortBy-descriptor-direction-forms', "sortBy([[\$key, \$direction]]) for SortDirection::Descending, 'Descending', false, SortDirection::Ascending and mixed directions, and sortByDesc([\$comparator]), which leaves a comparator ascending", function () {
    $people = [['name' => 'alice', 'age' => 30], ['name' => 'bob', 'age' => 25], ['name' => 'carol', 'age' => 35]];

    return [
        'Descending case' => (new Collection($people))->sortBy([['name', SortDirection::Descending]])->pluck('name')->all(),
        'Descending string' => (new Collection([['val' => 10], ['val' => 30], ['val' => 20]]))->sortBy([['val', 'Descending']])->pluck('val')->all(),
        'false' => (new Collection([['val' => 1], ['val' => 3], ['val' => 2]]))->sortBy([['val', false]])->pluck('val')->all(),
        'Ascending case' => (new Collection([['name' => 'carol'], ['name' => 'alice'], ['name' => 'bob']]))->sortBy([['name', SortDirection::Ascending]])->pluck('name')->all(),
        'mixed' => (new Collection([['group' => 'a', 'rank' => 2], ['group' => 'a', 'rank' => 1], ['group' => 'b', 'rank' => 3], ['group' => 'b', 'rank' => 4]]))->sortBy([['group', SortDirection::Ascending], ['rank', SortDirection::Descending]])->values()->all(),
        'sortByDesc comparator' => (new Collection([['age' => 2], ['age' => 10]]))->sortByDesc([fn ($a, $b) => $a['age'] <=> $b['age']])->pluck('age')->all(),
    ];
});

emit();
