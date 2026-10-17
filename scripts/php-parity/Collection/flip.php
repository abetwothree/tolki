<?php

/**
 * Ground truth for Collection::flip().
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

probe('C2 flip one', '(new Collection([\'name\' => \'taylor\']))->flip()->all()', fn () => (new Collection(['name' => 'taylor']))->flip()->all());
probe('C3 flip two', '(new Collection([\'name\' => \'taylor\', \'framework\' => \'laravel\']))->flip()->all()', fn () => (new Collection(['name' => 'taylor', 'framework' => 'laravel']))->flip()->all());
probe('C4 flip empty', '(new Collection)->flip()->all()', fn () => (new Collection)->flip()->all());
probe('D9 flip numeric-string value', '(new Collection([\'a\' => \'1\', \'b\' => \'01\', \'c\' => \'-0\']))->flip()->all()', fn () => (new Collection(['a' => '1', 'b' => '01', 'c' => '-0']))->flip()->all());

// ---- keys that become values (divide, flip) keep PHP's integer cast
probe('flip-int-key-type', "array_map('gettype', (new Collection([0 => 'a', 'b' => 'c']))->flip()->all())", fn () => array_map('gettype', (new Collection([0 => 'a', 'b' => 'c']))->flip()->all()));

probe('flip-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->flip()", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->flip()->all()));
probe('flip-out-of-order-duplicate-values', "(new Collection([2 => 'v', 0 => 'v']))->flip()", fn () => arrayablePairs((new Collection([2 => 'v', 0 => 'v']))->flip()->all()));
probe('flip-mixed-duplicate-values', "(new Collection(['x' => 'v', 0 => 'v']))->flip()", fn () => arrayablePairs((new Collection(['x' => 'v', 0 => 'v']))->flip()->all()));
probe('flip-collision', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->flip()", fn () => arrayablePairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->flip()->all()));
probe('C32-E-flip-int-key-order', "collect(['x' => 3, 'y' => 1])->flip() and the testFlipSkipsUnsupportedValues order", fn () => ['ints' => c32e_pairs((new Collection(['x' => 3, 'y' => 1]))->flip()), 'skips' => c32e_pairs(@(new Collection(['string' => 'taylor', 'integer' => 1, 'null' => null, 'false' => false, 'true' => true, 'float' => 1.5, 'array' => [], 'object' => new stdClass]))->flip())]);

emit();
