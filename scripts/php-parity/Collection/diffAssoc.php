<?php

/**
 * Ground truth for Collection::diffAssoc().
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

probe('diffAssoc — key AND value (must stay unchanged)', '$c->diffAssoc([...])', function () {
    return (new Collection(['id' => 1, 'first_word' => 'Hello', 'not_affected' => 'value']))
        ->diffAssoc(['id' => 123, 'foo_bar' => 'Hello', 'not_affected' => 'value'])->all();
});

probe('diffAssoc — case-sensitive keys (must stay unchanged)', '$c->diffAssoc([...])', function () {
    return (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 0 => 'red']))
        ->diffAssoc(['A' => 'green', 0 => 'yellow', 1 => 'red'])->all();
});

probe('diffAssoc on array-backed collection', '$c->diffAssoc([1,9,3])', function () {
    return (new Collection([1, 2, 3]))->diffAssoc([1, 9, 3])->all();
});
probe('C6 diffAssoc testDiffAssoc', '(new Collection([\'id\' => 1, \'first_word\' => \'Hello\', \'not_affected\' => \'value\']))->diffAssoc(new Collection([\'id\' => 123, \'foo_bar\' => \'Hello\', \'not_affected\' => \'value\']))->all()', fn () => (new Collection(['id' => 1, 'first_word' => 'Hello', 'not_affected' => 'value']))->diffAssoc(new Collection(['id' => 123, 'foo_bar' => 'Hello', 'not_affected' => 'value']))->all());
probe('C7 diffAssoc case keys', '(new Collection([\'a\' => \'green\', \'b\' => \'brown\', \'c\' => \'blue\', \'red\']))->diffAssoc(new Collection([\'A\' => \'green\', \'yellow\', \'red\']))->all()', fn () => (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red']))->diffAssoc(new Collection(['A' => 'green', 'yellow', 'red']))->all());
probe('diffAssoc-list-collection-operand', "(new Collection([1, 2, 3]))->diffAssoc(new Collection([1, 9, 9]))", fn () => (new Collection([1, 2, 3]))->diffAssoc(new Collection([1, 9, 9]))->values()->all());

// ---- diffAssoc's own Collection-like-operand row: C6's fixture shares no key+value pair with
// its operand either wrapped or raw, so it can't tell the fix apart from a still-broken diffAssoc.
probe('diffAssoc-collection-matching-key', "(new Collection(['id' => 1, 'name' => 'a']))->diffAssoc(new Collection(['id' => 1, 'name' => 'b']))", fn () => (new Collection(['id' => 1, 'name' => 'a']))->diffAssoc(new Collection(['id' => 1, 'name' => 'b']))->all());

// ---- list data against a keyed operand: the key-aware set operations match by key, never by position
probe('diffAssoc-list-keyed-operand', "(new Collection([1, 2]))->diffAssoc(['a' => 1, 'b' => 2]); (new Collection(['a', 'b']))->diffAssoc([1 => 'b']); the first with a Collection operand", fn () => [
    'assoc' => (new Collection([1, 2]))->diffAssoc(['a' => 1, 'b' => 2])->values()->all(),
    'offset' => (new Collection(['a', 'b']))->diffAssoc([1 => 'b'])->values()->all(),
    'collection' => (new Collection([1, 2]))->diffAssoc(new Collection(['a' => 1, 'b' => 2]))->values()->all(),
]);
probe('diffAssoc-scalar-backing', "(new Collection(5))->diffAssoc([1, 99, 3])", fn () => (new Collection(5))->diffAssoc([1, 99, 3])->all());

// null operands the types reject today
probe('C32-F-assoc-and-key-diffs-null-operand', "collect(['a' => 1])->diffAssoc(null) / ->diffAssocUsing(null, 'strcasecmp') / ->diffKeysUsing(null, 'strcasecmp')", fn () => ['diffAssoc' => collect(['a' => 1])->diffAssoc(null)->all(), 'diffAssocUsing' => collect(['a' => 1])->diffAssocUsing(null, 'strcasecmp')->all(), 'diffKeysUsing' => collect(['a' => 1])->diffKeysUsing(null, 'strcasecmp')->all()]);
probe('C32-F-plain-object-all-member-is-data-by-key', "collect(['a' => 1, 'b' => 2])->diffAssoc((object) ['all' => fn () => ['b' => 2]]) / ->diffAssocUsing(..., 'strcasecmp') / ->diffKeysUsing(..., 'strcasecmp') / ->intersectAssoc(...) / ->intersectAssocUsing(..., 'strcasecmp'), and collect(['a' => 1])->merge(...) keys", fn () => [
    'diffAssoc' => collect(['a' => 1, 'b' => 2])->diffAssoc((object) ['all' => fn () => ['b' => 2]])->all(),
    'diffAssocUsing' => collect(['a' => 1, 'b' => 2])->diffAssocUsing((object) ['all' => fn () => ['b' => 2]], 'strcasecmp')->all(),
    'diffKeysUsing' => collect(['a' => 1, 'b' => 2])->diffKeysUsing((object) ['all' => fn () => ['b' => 2]], 'strcasecmp')->all(),
    'intersectAssoc' => collect(['a' => 1, 'b' => 2])->intersectAssoc((object) ['all' => fn () => ['b' => 2]])->all(),
    'intersectAssocUsing' => collect(['a' => 1, 'b' => 2])->intersectAssocUsing((object) ['all' => fn () => ['b' => 2]], 'strcasecmp')->all(),
    'mergeKeys' => collect(['a' => 1])->merge((object) ['all' => fn () => ['b' => 2]])->keys()->all(),
]);

emit();
