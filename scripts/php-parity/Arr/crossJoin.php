<?php

/**
 * Ground truth for Arr::crossJoin().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// --- crossJoin (string-keyed spread is the analogue of an obj crossJoin argument)
probe('crossJoin-no-args', 'Arr::crossJoin()', fn () => Arr::crossJoin());
probe('crossJoin-string-spread', "Arr::crossJoin(...['size' => ['S','M'], 'color' => ['red','blue']])", fn () => Arr::crossJoin(...['size' => ['S', 'M'], 'color' => ['red', 'blue']]));
probe('crossJoin-string-spread-empty', "Arr::crossJoin(...['a' => [], 'b' => ['x']])", fn () => Arr::crossJoin(...['a' => [], 'b' => ['x']]));
probe('crossJoin-string-spread-3', "Arr::crossJoin(...['a' => [1, 2], 'b' => ['x'], 'c' => ['I', 'II']])", fn () => Arr::crossJoin(...['a' => [1, 2], 'b' => ['x'], 'c' => ['I', 'II']]));

// ---- Arr::crossJoin's foreach walks any array's or object's values; a scalar or a DateTime visits none
probe('crossJoin-string-spread-map-dimension', "Arr::crossJoin(...['a' => [1, 2], 'b' => ['k' => 'x', 'j' => 'y']]) and Arr::crossJoin(...['a' => [1], 'b' => new ArrayIterator(['k' => 'x', 'j' => 'y'])])", fn () => [
    'map' => Arr::crossJoin(...['a' => [1, 2], 'b' => ['k' => 'x', 'j' => 'y']]),
    'iterator' => Arr::crossJoin(...['a' => [1], 'b' => new ArrayIterator(['k' => 'x', 'j' => 'y'])]),
]);
probe('crossJoin-string-spread-no-values', "@Arr::crossJoin(...['a' => [1], 'b' => 'x']) and Arr::crossJoin(...['a' => [1], 'b' => new DateTime('@0')])", fn () => [
    'scalar' => @Arr::crossJoin(...['a' => [1], 'b' => 'x']),
    'date' => Arr::crossJoin(...['a' => [1], 'b' => new DateTime('@0')]),
]);
probe('crossJoin-list-map-dimension', "Arr::crossJoin([1, 2], ['a' => 'x', 'b' => 'y']), (…, new ArrayIterator(['a' => 'x', 'b' => 'y'])), Arr::crossJoin([1], new Collection(['x', 'y'])), Arr::crossJoin([1], new DateTime('@0'))", fn () => [
    'map' => Arr::crossJoin([1, 2], ['a' => 'x', 'b' => 'y']),
    'iterator' => Arr::crossJoin([1, 2], new ArrayIterator(['a' => 'x', 'b' => 'y'])),
    'collection' => Arr::crossJoin([1], new Collection(['x', 'y'])),
    'date' => Arr::crossJoin([1], new DateTime('@0')),
]);

// ==== crossJoin: the empty-dimension collapse in positional (list) form
probe('crossJoin-list-empty-dimension', "Arr::crossJoin([1, 2], [])", fn () => Arr::crossJoin([1, 2], []));

probe('crossJoin-out-of-order-spread', "Arr::crossJoin(...[2 => ['c1', 'c2'], 0 => ['a1'], 1 => ['b1', 'b2']])", fn () => arrayablePairs(Arr::crossJoin(...[2 => ['c1', 'c2'], 0 => ['a1'], 1 => ['b1', 'b2']])));
probe('crossJoin-mixed-spread', "Arr::crossJoin(...['x' => ['x1', 'x2'], 0 => ['z1'], 'y' => ['y1']])", fn () => arrayablePairs(Arr::crossJoin(...['x' => ['x1', 'x2'], 0 => ['z1'], 'y' => ['y1']])));
probe('crossJoin-string-keys-spread', "Arr::crossJoin(...['b' => ['b1', 'b2'], 'a' => ['a1', 'a2']])", fn () => arrayablePairs(Arr::crossJoin(...['b' => ['b1', 'b2'], 'a' => ['a1', 'a2']])));
probe('crossJoin-string-keys-two-spreads', "Arr::crossJoin(...['b' => ['b1', 'b2']], ...['a' => ['a1', 'a2']])", fn () => arrayablePairs(Arr::crossJoin(...['b' => ['b1', 'b2']], ...['a' => ['a1', 'a2']])));

emit();
