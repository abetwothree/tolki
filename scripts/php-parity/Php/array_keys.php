<?php

/**
 * Ground truth for PHP's array_keys().
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

probe('NAN is truthy for array_filter', 'array_keys(array_filter(["n"=>NAN,"z"=>0.0]))', function () {
    return ['bool_cast' => @((bool) NAN), 'kept' => array_keys(@array_filter(['n' => NAN, 'z' => 0.0]))];
});
probe('phpArrayKey-extra-string-keys', "array_keys(['-0' => 1, 'abc' => 2, '' => 3])", fn () => array_keys(['-0' => 1, 'abc' => 2, '' => 3]));
probe('C32-A-toArray-plain-item-members-are-data', "\$item = collect([['toArray' => fn () => [9], 'b' => 2]])->toArray()[0]; [array_keys(\$item), \$item['b']]", function () { $item = collect([['toArray' => fn () => [9], 'b' => 2]])->toArray()[0]; return [array_keys($item), $item['b']]; });
probe('C32-A-jsonSerialize-plain-item-members-are-data', "\$item = collect([['toArray' => fn () => [9], 'toJson' => fn () => '[1]', 'jsonSerialize' => fn () => 1, 'b' => 2]])->jsonSerialize()[0]; [array_keys(\$item), \$item['b']]", function () { $item = collect([['toArray' => fn () => [9], 'toJson' => fn () => '[1]', 'jsonSerialize' => fn () => 1, 'b' => 2]])->jsonSerialize()[0]; return [array_keys($item), $item['b']]; });

emit();
