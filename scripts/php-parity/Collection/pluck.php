<?php

/**
 * Ground truth for Collection::pluck().
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

// sortBy over numbers and numeric strings: SORT_NUMERIC (laravel/framework#61699) and the default flag agree here.
$prices = fn () => new Collection([['price' => 1.5], ['price' => '10.5'], ['price' => 1.2], ['price' => '10.2'], ['price' => 1.9]]);
probe('sortBy-key-default-flag', "sortBy('price')->pluck('price')->values()", fn () => $prices()->sortBy('price')->pluck('price')->values()->all());
probe('C32-E-pluck-accessor', "collect([accessor(some=foo), accessor(some=bar)])->pluck('some')", fn () => (new Collection([new C32E_Accessor(['some' => 'foo']), new C32E_Accessor(['some' => 'bar'])]))->pluck('some')->all());
probe('C32-E-pluck-int-key-order', "collect([['id'=>3,'n'=>'c'],['id'=>1,'n'=>'a'],['id'=>2,'n'=>'b']])->pluck('n', 'id')", fn () => c32e_pairs((new Collection([['id' => 3, 'n' => 'c'], ['id' => 1, 'n' => 'a'], ['id' => 2, 'n' => 'b']]))->pluck('n', 'id')));
probe('C32-E-pluck-key-path-casts', "@collect([k=null, k=true, k=false, k=1.5])->pluck('v', 'k')", fn () => c32e_pairs(@(new Collection([['k' => null, 'v' => 'n'], ['k' => true, 'v' => 't'], ['k' => false, 'v' => 'f'], ['k' => 1.5, 'v' => 'fl']]))->pluck('v', 'k')));
probe('C32-E-pluck-key-closure-casts', "collect([['v'=>'x'],['v'=>'y']])->pluck('v', fn (\$r) => \$r['v'] === 'x') and @->pluck('v', fn () => 1.5)", fn () => ['bool' => c32e_pairs((new Collection([['v' => 'x'], ['v' => 'y']]))->pluck('v', fn ($r) => $r['v'] === 'x')), 'float' => c32e_pairs(@(new Collection([['v' => 'x']]))->pluck('v', fn () => 1.5))]);
probe('C32-E-pluck-nested-collections', "collect([collect(['a'=>1]), collect(['a'=>2])])->pluck('a')", fn () => (new Collection([new Collection(['a' => 1]), new Collection(['a' => 2])]))->pluck('a')->all());
probe('C32-E-pluck-collection-rows', "c32c_rows(list | keyed)->pluck('v') and ->pluck('v', 'k')", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->pluck('v')->all(),
    c32c_rows($keyed)->pluck('v', 'k')->all(),
], ['list' => false, 'keyed' => true]));
probe('C32-E-pluck-array-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => [1, 2])", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => [1, 2])->all());
probe('C32-E-pluck-assoc-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => ['a' => 1])", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => ['a' => 1])->all());
probe('C32-E-pluck-date-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => new DateTime('@0'))", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => new DateTime('@0'))->all());
probe('C32-E-pluck-enum-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => C32E_Int::B)", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => C32E_Int::B)->all());
probe('C32-E-pluck-stringable-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => new Stringable('Lara'))", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => new Stringable('Lara'))->all());
probe('C32-E-pluck-tostring-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => an object with __toString)", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => new class { public function __toString() { return 'Framework'; } })->all());
probe('C32-E-pluck-closure-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => fn () => 1)", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => fn () => 1)->all());
probe('C32-E-pluck-anonymous-subclass-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => new class extends C32AParent {})", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => new class extends C32AParent {})->all());
probe('C32-E-pluck-nested-array-row', "(new Collection([['n' => 1]]))->pluck('n') and ->pluck('*')", fn () => ['path' => (new Collection([['n' => 1]]))->pluck('n')->all(), 'wildcard' => (new Collection([['n' => 1]]))->pluck('*')->all()]);
probe('C32-G-sortBy-ties-stable', "sortBy('k') over [k=1 a, k=0 b, k=1 c] ->pluck('id')",
    fn () => (new Collection([['k' => 1, 'id' => 'a'], ['k' => 0, 'id' => 'b'], ['k' => 1, 'id' => 'c']]))->sortBy('k')->pluck('id')->all());

emit();
