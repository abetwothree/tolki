<?php

/**
 * Ground truth for Collection::transform().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Collection;

probe('order-transform', '$c = collect(base); $c->transform(fn ($v) => strtoupper($v))', function () {
    $c = collect(d8Base());
    $c->transform(fn ($v) => strtoupper($v));

    return d8Views($c);
});
probe('order-transform-callback-key-order', '$c = collect(base); $c->transform(recording $key)', function () {
    $seen = [];
    $c = collect(d8Base());
    $c->transform(function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return $value;
    });

    return $seen;
});

emit();
