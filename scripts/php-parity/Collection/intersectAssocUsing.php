<?php

/**
 * Ground truth for Collection::intersectAssocUsing().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('intersectAssocUsing(null)', '$c->intersectAssocUsing(null, $cb)', function () {
    $strcasecmp = fn ($a, $b) => strtolower((string) $a) === strtolower((string) $b);

    return (new Collection(['a' => 'green']))->intersectAssocUsing(null, $strcasecmp)->all();
});
probe('C9 intersectAssocUsing strcasecmp', '(new Collection([\'a\' => \'green\', \'b\' => \'brown\', \'c\' => \'blue\', \'red\']))->intersectAssocUsing(new Collection([\'a\' => \'GREEN\', \'B\' => \'brown\', \'yellow\', \'red\']), \'strcasecmp\')->all()', fn () => (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red']))->intersectAssocUsing(new Collection(['a' => 'GREEN', 'B' => 'brown', 'yellow', 'red']), 'strcasecmp')->all());
probe('intersectAssocUsing-list-collection-operand', "(new Collection([1, 2, 3]))->intersectAssocUsing(new Collection([1, 2, 9]), fn (\$a, \$b) => \$a <=> \$b)", fn () => (new Collection([1, 2, 3]))->intersectAssocUsing(new Collection([1, 2, 9]), fn ($a, $b) => $a <=> $b)->values()->all());
probe('intersectAssocUsing-list-keyed-operand', "(new Collection([1, 2]))->intersectAssocUsing(['a' => 1, 'b' => 2], \$cmp); (new Collection(['a', 'b']))->intersectAssocUsing([1 => 'b'], \$cmp)", fn () => [
    'assoc' => (new Collection([1, 2]))->intersectAssocUsing(['a' => 1, 'b' => 2], fn ($a, $b) => $a <=> $b)->values()->all(),
    'offset' => (new Collection(['a', 'b']))->intersectAssocUsing([1 => 'b'], fn ($a, $b) => $a <=> $b)->values()->all(),
]);

// fix-round-1: intersectAssocUsing was left out of the C10 sweep. Its sibling's label records
// intersectAssoc, a different call, so it cannot be cited for this one.
probe('intersectAssocUsing-scalar-backing', "(new Collection(5))->intersectAssocUsing([5], fn (\$a, \$b) => strcasecmp((string) \$a, (string) \$b))", fn () => (new Collection(5))->intersectAssocUsing([5], fn ($a, $b) => strcasecmp((string) $a, (string) $b))->all());

emit();
