<?php

/**
 * Ground truth for the key types Collection callbacks receive.
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

probe('C32-E-callback-key-types-sweep', "[gettype(\$k), \$k] for each key a callback sees on ['a', 'b'] and on ['1' => 'a', 'x' => 'b']; sortKeysUsing lists the distinct keys it compared, sorted", function () {
    $out = [];
    foreach (['list' => ['a', 'b'], 'record' => ['1' => 'a', 'x' => 'b']] as $name => $items) {
        $trace = function (callable $run) use ($items): array {
            $seen = [];
            $run(new Collection($items), function ($k) use (&$seen) { $seen[] = [gettype($k), $k]; });

            return $seen;
        };
        $out['every'][$name] = $trace(fn ($c, $note) => $c->every(function ($v, $k) use ($note) { $note($k); return true; }));
        $out['each'][$name] = $trace(fn ($c, $note) => $c->each(function ($v, $k) use ($note) { $note($k); }));
        $out['groupBy'][$name] = $trace(fn ($c, $note) => $c->groupBy(function ($v, $k) use ($note) { $note($k); return 'g'; }));
        $out['countBy'][$name] = $trace(fn ($c, $note) => $c->countBy(function ($v, $k) use ($note) { $note($k); return 'g'; }));
        $out['sortBy'][$name] = $trace(fn ($c, $note) => $c->sortBy(function ($v, $k) use ($note) { $note($k); return $v; }));
        $out['reduceSpread'][$name] = $trace(fn ($c, $note) => $c->reduceSpread(function ($carry, $v, $k) use ($note) { $note($k); return [$carry]; }, null));
        $out['mapWithKeys'][$name] = $trace(fn ($c, $note) => $c->mapWithKeys(function ($v, $k) use ($note) { $note($k); return [$v => $v]; }));
        $out['keyBy'][$name] = $trace(fn ($c, $note) => $c->keyBy(function ($v, $k) use ($note) { $note($k); return $v; }));
        $compared = $trace(fn ($c, $note) => $c->sortKeysUsing(function ($a, $b) use ($note) { $note($a); $note($b); return strcmp((string) $a, (string) $b); }));
        $distinct = array_values(array_unique(array_map('json_encode', $compared)));
        sort($distinct);
        $out['sortKeysUsing'][$name] = array_map(fn (string $pair) => json_decode($pair, true), $distinct);
    }

    return $out;
});

emit();
