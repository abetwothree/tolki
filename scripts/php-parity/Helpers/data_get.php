<?php

/**
 * Ground truth for data_get().
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
probe('C32-D-data-get-literal-dotted-key', "data_get(['a.b' => 1, 'a' => ['b' => 2]], 'a.b') and data_get(['a.b' => 1], 'a.b', 'miss')", fn () => [data_get(['a.b' => 1, 'a' => ['b' => 2]], 'a.b'), data_get(['a.b' => 1], 'a.b', 'miss')]);

probe('C32-D-data-get-collection-target', "data_get over a Collection: 'a.b', '*.b' over Collection rows, a null value with a default, and the protected 'items' property", fn () => [
    data_get(new Collection(['a' => ['b' => 1]]), 'a.b'),
    data_get(new Collection([new Collection(['b' => 1]), new Collection(['b' => 2])]), '*.b'),
    data_get(new Collection(['v' => null]), 'v', 'def'),
    data_get(new Collection(['a' => 1]), 'items'),
]);
probe('C32-D-data-get-arrayaccess-target', "an ArrayAccess that is not Enumerable: data_get 'a', data_has 'n' (null) and 'a', data_get 'missing' with a default", function () {
    $target = new C32D_Access(['a' => 1, 'n' => null]);

    return [data_get($target, 'a'), data_has($target, 'n'), data_has($target, 'a'), data_get($target, 'missing', 'def')];
});

probe('C32-D-data-get-offset-exists-php-truthiness', "[data_get(\$t, 'a'), data_has(\$t, 'a')] for \$t = new C32D_AnsweringAccess(['a' => 1], \$answer), offsetExists answering '0', [], new DateTime('@0') and 'x'", fn () => array_map(fn ($answer) => [
    data_get(new C32D_AnsweringAccess(['a' => 1], $answer), 'a'),
    data_has(new C32D_AnsweringAccess(['a' => 1], $answer), 'a'),
], ['0', [], new DateTime('@0'), 'x']));

probe('C32-D-data-get-array-path-dotted-segment', "data_get(['a.b' => 1, 'a' => ['b' => 2]], ['a.b'])", fn () => data_get(['a.b' => 1, 'a' => ['b' => 2]], ['a.b']));

emit();
