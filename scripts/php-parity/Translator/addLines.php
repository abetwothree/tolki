<?php

/**
 * Ground truth for Translator::addLines().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

$base = fn () => langTranslator(['en' => ['g' => ['b' => 'B']]]);

/** Add $lines to a fresh translator, then read $key. */
$added = function (array $lines, string $key, ?string $namespace = null) use ($base) {
    $t = $base();
    $namespace === null ? $t->addLines($lines, 'en') : $t->addLines($lines, 'en', $namespace);

    return $t->get($key);
};

probe('add-lines-group-item', "t(['en' => ['g' => ['b' => 'B']]]); addLines(['g.a' => 'A'], 'en'); get('g.a')", fn () => $added(['g.a' => 'A'], 'g.a'));
probe('add-lines-merges-into-group', "addLines(['g.a' => 'A'], 'en'); get('g')", fn () => $added(['g.a' => 'A'], 'g'));
probe('add-lines-nested-item', "addLines(['g.x.y' => 'deep'], 'en'); get('g.x.y')", fn () => $added(['g.x.y' => 'deep'], 'g.x.y'));
probe('add-lines-key-without-dot', "addLines(['nodot' => 'v'], 'en'); get('nodot')", fn () => $added(['nodot' => 'v'], 'nodot'));
probe('add-lines-key-without-dot-reads-empty-item', "addLines(['nodot' => 'v'], 'en'); get('nodot.')", fn () => $added(['nodot' => 'v'], 'nodot.'));
probe('add-lines-json-group', "addLines(['*.Hello' => 'Hola'], 'en'); get('Hello')", fn () => $added(['*.Hello' => 'Hola'], 'Hello'));
probe('add-lines-json-dotted-key', "addLines(['*.x.y' => 'xy'], 'en'); get('x.y')", fn () => $added(['*.x.y' => 'xy'], 'x.y'));
probe('add-lines-namespace', "addLines(['g.a' => 'A'], 'en', 'courier'); get('courier::g.a')", fn () => $added(['g.a' => 'A'], 'courier::g.a', 'courier'));

emit();
