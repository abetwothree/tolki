<?php

/**
 * Ground truth for Collection::add().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Collection;

// ==== `add`/`offsetSet(null)` append where PHP's `$array[] =` does: past the highest integer key ====
probe('append-key-past-the-highest-integer-key', "\$c = collect([5 => 'a']); \$c->add('z')", function () {
    $c = collect([5 => 'a']);
    $c->add('z');

    return d8Views($c);
});
probe('append-key-skips-an-occupied-slot', "\$c = collect(['x' => 1, 3 => 'b', 'y' => 2]); \$c->add('z')", function () {
    $c = collect(['x' => 1, 3 => 'b', 'y' => 2]);
    $c->add('z');

    return d8Views($c);
});
probe('append-key-with-no-integer-key-is-zero', "\$c = collect(['a' => 1]); \$c->add('z')", function () {
    $c = collect(['a' => 1]);
    $c->add('z');

    return d8Views($c);
});
probe('append-key-on-an-empty-collection-is-zero', "\$c = collect([]); \$c->add('z')", function () {
    $c = collect([]);
    $c->add('z');

    return d8Views($c);
});
probe('append-key-on-the-out-of-order-base', "\$c = collect(base); \$c->add('z')", function () {
    $c = collect(d8Base());
    $c->add('z');

    return d8Views($c);
});
probe('append-key-twice-keeps-counting-up', "\$c = collect([5 => 'a']); \$c->add('y'); \$c->add('z')", function () {
    $c = collect([5 => 'a']);
    $c->add('y');
    $c->add('z');

    return d8Views($c);
});
// PHP 8.3+ counts on from a negative key too; the JS port floors the next key at 0 (see `add`).
probe('append-key-after-a-negative-key', "\$c = collect([-3 => 'a']); \$c->add('z')", function () {
    $c = collect([-3 => 'a']);
    $c->add('z');

    return d8Views($c);
});

emit();
