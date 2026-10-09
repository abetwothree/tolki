<?php

/**
 * Ground truth for the order Collection methods keep items in.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Collection;

// The same question for every other operation that reads an operand, one row each, so a
// JS assertion about `merge` cites `merge` and not a sibling that happens to agree.
foreach ([
    'merge' => fn (Collection $c) => $c->merge([7 => 'x', 3 => 'y']),
    'intersect' => fn (Collection $c) => $c->intersect([7 => 'x', 3 => 'y']),
    'replace' => fn (Collection $c) => $c->replace([7 => 'x', 3 => 'y']),
    'only' => fn (Collection $c) => $c->only([7 => 'x', 3 => 'y']),
    'zip' => fn (Collection $c) => $c->zip([7 => 'x', 3 => 'y']),
    'crossJoin' => fn (Collection $c) => $c->crossJoin([7 => 'x', 3 => 'y']),
] as $name => $read) {
    probe(
        "order-{$name}-leaves-the-receiver-alone",
        "\$c = collect([1, 2, 3]); \$c->{$name}([7 => 'x', 3 => 'y']); \$c",
        function () use ($read) {
            $c = collect([1, 2, 3]);
            $read($c);

            return d8Views($c);
        },
    );
}

emit();
