<?php

/**
 * Ground truth for Collection::jsonSerialize().
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

// --- jsonSerialize / toJson / toPrettyJson / __toString
probe('C32-A-jsonSerialize-php-fixtures', 'testJsonSerialize fixtures', fn () => collect([new TestArrayableObject, new TestJsonableObject, new TestJsonSerializeObject, new C32AJsonSerializeToString, 'baz'])->jsonSerialize());
probe('C32-A-jsonSerialize-prefers-jsonSerialize-over-toArray', 'collect([new C32AArrayableAndJsonSerializable])->jsonSerialize()', fn () => collect([new C32AArrayableAndJsonSerializable])->jsonSerialize());
probe('C32-A-jsonSerialize-prefers-toJson-over-toArray', 'collect([new C32AArrayableAndJsonable])->jsonSerialize()', fn () => collect([new C32AArrayableAndJsonable])->jsonSerialize());
probe('C32-A-jsonSerialize-invalid-jsonable-is-null', 'collect([new C32ABadJsonable])->jsonSerialize()', fn () => collect([new C32ABadJsonable])->jsonSerialize());
probe('C32-A-jsonSerialize-other-object-is-kept', '$o = new C32AParent; collect([$o])->jsonSerialize()[0] === $o', function () { $o = new C32AParent; return collect([$o])->jsonSerialize()[0] === $o; });
probe('C32-A-jsonSerialize-keyed', "collect(['a' => new TestArrayableObject, 'b' => 1])->jsonSerialize()", fn () => collect(['a' => new TestArrayableObject, 'b' => 1])->jsonSerialize());
probe('C32-A-jsonSerialize-plain-item-members-are-data', "\$item = collect([['toArray' => fn () => [9], 'toJson' => fn () => '[1]', 'jsonSerialize' => fn () => 1, 'b' => 2]])->jsonSerialize()[0]; [array_keys(\$item), \$item['b']]", function () { $item = collect([['toArray' => fn () => [9], 'toJson' => fn () => '[1]', 'jsonSerialize' => fn () => 1, 'b' => 2]])->jsonSerialize()[0]; return [array_keys($item), $item['b']]; });

emit();
