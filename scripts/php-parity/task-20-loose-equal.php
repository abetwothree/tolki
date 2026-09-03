<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

// D1 — PHP 8 loose comparison. Every pair here becomes a literal in equality.spec.ts.
class StringableProbe
{
    public function __construct(private string $value)
    {
    }

    public function __toString(): string
    {
        return $this->value;
    }
}

$pairs = [
    'null and undefined-as-null'     => [null, null],
    'null and empty string'          => [null, ''],
    'null and the string zero'       => [null, '0'],
    'null and a letter'              => [null, 'a'],
    'null and zero'                  => [null, 0],
    'null and five'                  => [null, 5],
    'null and an empty array'        => [null, []],
    'null and a one-element array'   => [null, [1]],
    'null and false'                 => [null, false],
    'true and the string zero'       => [true, '0'],
    'false and the string zero'      => [false, '0'],
    'false and an empty array'       => [false, []],
    'true and a one-element array'   => [true, [1]],
    'true and a letter'              => [true, 'a'],
    'false and a letter'             => [false, 'a'],
    'true and one'                   => [true, 1],
    'true and two'                   => [true, 2],
    'zero and false'                 => [0, false],
    'zero and empty string'          => [0, ''],
    'zero and a letter'              => [0, 'a'],
    'zero and the string zero'       => [0, '0'],
    'one and its numeric string'     => [1, '1'],
    'one and a leading-numeric string' => [1, '1abc'],
    'one and a space-padded string'  => [1, ' 1'],
    'one and a trailing-space string' => [1, '1 '],
    'hundred and an exponent string' => [100, '1e2'],
    'exponent string and plain string' => ['1e1', '10'],
    'one and zero-padded one'        => ['1', '01'],
    'large integer strings one apart' => ['9007199254740993', '9007199254740992'],
    'overflowing exponent strings one apart' => ['1e999', '1e1000'],
    'large integer and the string one below it' => [9007199254740993, '9007199254740992'],
    'large integer and the string one above it' => [9007199254740992, '9007199254740993'],
    'large integers one apart'       => [9007199254740992, 9007199254740993],
    'two letters differing in case'  => ['abc', 'ABC'],
    'empty string and the string zero' => ['', '0'],
    'float sum and its literal'      => [0.1 + 0.2, 0.3],
    'negative zero float and "-0"'   => [-0.0, '-0'],
    'INF and the string INF'         => [INF, 'INF'],
    'negative INF and the string -INF' => [-INF, '-INF'],
    'INF and an overflowing exponent string' => [INF, '1e400'],
    'negative INF and an overflowing exponent string' => [-INF, '-1e999'],
    'NAN and the string NAN'         => [NAN, 'NAN'],
    'NAN and NAN'                    => [NAN, NAN],
    'empty array and zero'           => [[], 0],
    'empty array and empty string'   => [[], ''],
    'empty array and false'          => [[], false],
    'empty array and true'           => [[], true],
    'one-element array and one'      => [[1], 1],
    'lists with equal loose values'  => [[1, '2'], ['1', 2]],
    'lists in a different order'     => [[1, 2], [2, 1]],
    'assoc arrays in a different order' => [['a' => 1, 'b' => 2], ['b' => 2, 'a' => 1]],
];

foreach ($pairs as $label => [$a, $b]) {
    probe($label, var_export($a, true) . ' == ' . var_export($b, true), fn () => $a == $b);
}

// An object with __toString compares equal to its own string, in either direction; a plain object never does.
$stringable = new StringableProbe('hello');

probe('object with __toString and its own string', '$stringable == \'hello\'', fn () => $stringable == 'hello');
probe('a string and an object with __toString', '\'hello\' == $stringable', fn () => 'hello' == $stringable);
probe('object with __toString and a different string', '$stringable == \'world\'', fn () => $stringable == 'world');
probe('plain object and a string', 'new stdClass() == \'hello\'', fn () => new stdClass() == 'hello');

emit();
