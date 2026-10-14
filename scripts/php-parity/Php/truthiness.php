<?php

/**
 * Ground truth for PHP's boolean cast, the rule behind every truthiness test.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

$values = [
    'the string zero'        => '0',
    'the string 0.0'         => '0.0',
    'the string 00'          => '00',
    'an empty string'        => '',
    'the string false'       => 'false',
    'a space'                => ' ',
    'integer zero'           => 0,
    'float zero'             => 0.0,
    'negative float zero'    => -0.0,
    'NAN'                    => NAN,
    'INF'                    => INF,
    'an empty array'         => [],
    'an array holding zero'  => [0],
    'null'                   => null,
    'an empty object'        => new stdClass(),
    'an empty ArrayObject'   => new ArrayObject([]),
];

foreach ($values as $label => $value) {
    probe('truthiness-' . str_replace(' ', '-', $label), '(bool) ' . $label, fn () => @(bool) $value);
}

emit();
