<?php

/**
 * Ground truth for Collection::undot().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ==== fix-round-4 Group D: undot's non-array backings. Collection::undot() runs Arr::undot over
// ==== $this->all(), so the wrap is what decides — no row recorded any of these four.
probe('r4-undot-backings', "(new Collection(5|'a.b'|new ArrayIterator(['a.b'])|null|true))->undot()", fn () => [
    'int' => (new Collection(5))->undot(),
    'string' => (new Collection('a.b'))->undot(),
    'traversable' => (new Collection(new ArrayIterator(['a.b'])))->undot(),
    'null' => (new Collection(null))->undot(),
    'bool' => (new Collection(true))->undot(),
    'list' => (new Collection([1, 2, 3]))->undot(),
]);

emit();
