<?php

/**
 * Ground truth for Collection::intersectAssoc().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('intersectAssoc — key AND value', '$c->intersectAssoc([...])', function () {
    return (new Collection(['a'=>'green','b'=>'brown','c'=>'blue',0=>'red']))
        ->intersectAssoc(['a'=>'green','b'=>'yellow',0=>'blue',1=>'red'])->all();
});

// Extra probes beyond the brief — needed to check for collisions this task's
// fix could create in sibling functions that are NOT supposed to change.

probe('intersectAssoc(null)', '$c->intersectAssoc(null)', function () {
    return (new Collection(['a' => 'green']))->intersectAssoc(null)->all();
});

// Extra probes beyond the brief — intersectAssoc/intersectAssocUsing/intersectByKeys
// must agree with intersect's null-first-operand-is-empty behaviour (C6/R5).
probe('intersectAssoc/intersectAssocUsing/intersectByKeys treat a nullish first operand as empty too', 'collect(null)->intersectAssoc(...)', function () {
    $strcasecmp = fn ($a, $b) => strtolower((string) $a) === strtolower((string) $b);

    return [
        'null_intersect_assoc' => (new Collection(null))->intersectAssoc(['a' => 1])->all(),
        'null_intersect_assoc_using' => (new Collection(null))->intersectAssocUsing(['a' => 1], $strcasecmp)->all(),
        'null_intersect_by_keys' => (new Collection(null))->intersectByKeys(['a' => 1])->all(),
    ];
});
probe('intersectAssoc-collection', "(new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red']))->intersectAssoc(new Collection(['a' => 'green', 'b' => 'yellow', 'blue', 'red']))", fn () => (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red']))->intersectAssoc(new Collection(['a' => 'green', 'b' => 'yellow', 'blue', 'red']))->all());
probe('intersectAssoc-list-collection-operand', "(new Collection([1, 2, 3]))->intersectAssoc(new Collection([1, 2, 9]))", fn () => (new Collection([1, 2, 3]))->intersectAssoc(new Collection([1, 2, 9]))->values()->all());
probe('intersectAssoc-list-keyed-operand', "(new Collection([1, 2]))->intersectAssoc(['a' => 1, 'b' => 2]); (new Collection(['a', 'b']))->intersectAssoc([1 => 'b'])", fn () => [
    'assoc' => (new Collection([1, 2]))->intersectAssoc(['a' => 1, 'b' => 2])->values()->all(),
    'offset' => (new Collection(['a', 'b']))->intersectAssoc([1 => 'b'])->values()->all(),
]);
probe('intersectAssoc-scalar-backing', "(new Collection(5))->intersectAssoc([5])", fn () => (new Collection(5))->intersectAssoc([5])->all());

emit();
