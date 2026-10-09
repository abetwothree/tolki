<?php

/**
 * Ground truth for Collection::reject().
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

probe('reject-no-callback', "(new Collection([1, null, 2, false, 3, '']))->reject()", fn () => (new Collection([1, null, 2, false, 3, '']))->reject()->all());

// reject(): value form compares with PHP ==, and the no-argument form keeps PHP-falsy values
probe('C32-D-reject-none-php-falsy', "(new Collection([[], '0', 0.0, 'a', '', null, true]))->reject()->values()", fn () => pairs((new Collection([[], '0', 0.0, 'a', '', null, true]))->reject()->values()));
probe('C32-D-reject-false-loose', "(new Collection([null, 0, '', 'a', [], true, false]))->reject(false)->values()", fn () => pairs((new Collection([null, 0, '', 'a', [], true, false]))->reject(false)->values()));
probe('C32-D-reject-null-loose', "(new Collection([0, '', false, [], 'a', '0']))->reject(null)->values()", fn () => pairs((new Collection([0, '', false, [], 'a', '0']))->reject(null)->values()));
probe('C32-D-reject-zero-loose', "(new Collection(['a', '0', 0, null, false, '', '0.0']))->reject(0)->values()", fn () => pairs((new Collection(['a', '0', 0, null, false, '', '0.0']))->reject(0)->values()));
probe('C32-D-reject-numeric-string-loose', "(new Collection([1, '01', '1.0', true, '1e0', 'x']))->reject('1')->values()", fn () => pairs((new Collection([1, '01', '1.0', true, '1e0', 'x']))->reject('1')->values()));
probe('C32-D-reject-array-value', "(new Collection([[1, 2], [2, 1], ['1', '2'], 'x']))->reject([1, 2])->values()", fn () => pairs((new Collection([[1, 2], [2, 1], ['1', '2'], 'x']))->reject([1, 2])->values()));
probe('C32-D-reject-none-empty-objects', "(new Collection([new DateTime('@0'), new stdClass]))->reject()->count()", fn () => (new Collection([new DateTime('@0'), new stdClass]))->reject()->count());

emit();
