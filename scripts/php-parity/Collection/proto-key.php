<?php

/**
 * Ground truth for a "__proto__" key in keyed Collection results.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// PHP has no inherited __proto__ setter, so "__proto__" is an ordinary string
// key everywhere. Each row is a Collection method that builds a keyed result.
probe('"__proto__" is an ordinary array key in every keyed Collection result', 'collect([["k"=>"__proto__"]])->keyBy("k")', function () {
    $hostile = static fn (): array => ['a' => 1, '__proto__' => ['polluted' => true], 'c' => 3];

    return [
        'keyBy' => (new Collection([['k' => '__proto__', 'v' => 1]]))->keyBy('k')->all(),
        'groupBy' => (new Collection([['k' => '__proto__']]))->groupBy('k')->toArray(),
        'groupBy_preserve_keys' => (new Collection(['__proto__' => ['k' => 'z']]))->groupBy('k', true)->toArray(),
        'countBy' => (new Collection(['__proto__']))->countBy()->all(),
        'mapToDictionary' => (new Collection([['n' => '__proto__', 'i' => 1]]))->mapToDictionary(fn ($x) => [$x['n'] => $x['i']])->all(),
        'sortKeys' => (new Collection($hostile()))->sortKeys()->all(),
        'sortKeysUsing' => (new Collection($hostile()))->sortKeysUsing(fn ($a, $b) => strcmp((string) $a, (string) $b))->all(),
        'unshift' => (new Collection($hostile()))->unshift(9)->all(),
        'mergeRecursive' => (new Collection(['z' => 1]))->mergeRecursive($hostile())->all(),
        'mergeRecursive_nested' => (new Collection(['z' => ['q' => 1]]))->mergeRecursive(['z' => ['__proto__' => ['polluted' => true]]])->all(),
        'diffAssoc' => (new Collection($hostile()))->diffAssoc([])->all(),
        'diffKeys' => (new Collection($hostile()))->diffKeys([])->all(),
        'diffUsing' => (new Collection($hostile()))->diffUsing([], fn ($a, $b) => 1)->all(),
        'duplicates' => (new Collection(['a' => 1, '__proto__' => 1, 'c' => 3]))->duplicates()->all(),
        'offsetSet' => (static function () {
            $c = new Collection(['a' => 1]);
            $c['__proto__'] = 2;

            return $c->all();
        })(),
        'pull_leaves_the_rest' => (static function () use ($hostile) {
            $c = new Collection($hostile());
            $c->pull('nope');

            return $c->all();
        })(),
    ];
});

emit();
