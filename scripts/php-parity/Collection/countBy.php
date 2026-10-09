<?php

/**
 * Ground truth for Collection::countBy().
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

// whereIn / whereNotIn: in_array's loose == is PHP's, not JS's
$vs = fn (array $values) => new Collection(array_map(fn ($v) => ['v' => $v], $values));
probe('C32-E-countBy-bools', "collect([true, true, false, false, false])->countBy()", fn () => c32e_pairs((new Collection([true, true, false, false, false]))->countBy()));
probe('C32-E-countBy-pure-enum', "collect([Staff::James, Staff::Joe, Staff::Taylor])->countBy()", fn () => c32e_pairs((new Collection([C32E_Staff::James, C32E_Staff::Joe, C32E_Staff::Taylor]))->countBy()));
probe('C32-E-countBy-key-backed-enum', "collect([['key'=>IntEnum::A],['key'=>IntEnum::B],['key'=>IntEnum::B]])->countBy('key')", fn () => c32e_pairs((new Collection([['key' => C32E_Int::A], ['key' => C32E_Int::B], ['key' => C32E_Int::B]]))->countBy('key')));
probe('C32-E-countBy-callback-bool', "collect([1, 2, 3, 4, 5])->countBy(fn (\$i) => \$i % 2 === 0)", fn () => c32e_pairs((new Collection([1, 2, 3, 4, 5]))->countBy(fn ($i) => $i % 2 === 0)));
probe('C32-E-countBy-callback-string-enum', "collect(['A','A','B','A'])->countBy(fn (\$i) => StrEnum::from(\$i))", fn () => c32e_pairs((new Collection(['A', 'A', 'B', 'A']))->countBy(fn ($i) => C32E_Str::from($i))));
probe('C32-E-countBy-int-key-order', "collect([3, 1, 3])->countBy()", fn () => c32e_pairs((new Collection([3, 1, 3]))->countBy()));
probe('C32-E-countBy-float', "@collect([1.5, 1.7, 2.5])->countBy()", fn () => c32e_pairs(@(new Collection([1.5, 1.7, 2.5]))->countBy()));
probe('C32-E-countBy-callback-key-type', "collect(['a', 'b'])->countBy(fn (\$v, \$k) => gettype(\$k))", fn () => c32e_pairs((new Collection(['a', 'b']))->countBy(fn ($v, $k) => gettype($k))));
probe('C32-E-countBy-array-key', "(new Collection([1]))->countBy(fn () => [1, 2])", fn () => (new Collection([1]))->countBy(fn () => [1, 2])->all());
probe('C32-E-countBy-assoc-key', "(new Collection([1]))->countBy(fn () => ['a' => 1])", fn () => (new Collection([1]))->countBy(fn () => ['a' => 1])->all());
probe('C32-E-countBy-date-key', "(new Collection([1]))->countBy(fn () => new DateTime('@0'))", fn () => (new Collection([1]))->countBy(fn () => new DateTime('@0'))->all());
probe('C32-E-countBy-stringable-key', "(new Collection([1]))->countBy(fn () => new Stringable('Lara'))", fn () => (new Collection([1]))->countBy(fn () => new Stringable('Lara'))->all());
probe('C32-E-countBy-tostring-key', "(new Collection([1]))->countBy(fn () => an object with __toString)", fn () => (new Collection([1]))->countBy(fn () => new class { public function __toString() { return 'Framework'; } })->all());
probe('C32-E-countBy-null-key', "(new Collection([['url' => null], ['url' => 'a'], []]))->countBy('url')", fn () => (new Collection([['url' => null], ['url' => 'a'], []]))->countBy('url')->all());

emit();
