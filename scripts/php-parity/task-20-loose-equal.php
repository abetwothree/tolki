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
    'one and signed one'             => ['1', '+1'],
    // F4 — past PHP_INT_MAX there is no int: both sides become doubles and tie.
    'float past the int range and its integer string' => [1e23, '100000000000000000000000'],
    'larger float past the int range and its integer string' => [1e30, '1000000000000000000000000000000'],
    'negative float past the int range and its integer string' => [-1e23, '-100000000000000000000000'],
    'one and an integer string past the int range' => [1, '100000000000000000000000'],
    // F5 — zendi_smart_strcmp falls back to a byte compare when two integer strings
    // overflow zend_long on the same side and their doubles tie. The in-range controls
    // above ('one and zero-padded one', 'one and signed one') stay equal.
    'overflowing integer strings, one signed' => ['9223372036854775808', '+9223372036854775808'],
    'overflowing integer strings, one zero-padded' => ['9223372036854775808', '09223372036854775808'],
    'PHP_INT_MAX strings, one signed' => ['9223372036854775807', '+9223372036854775807'],
    'PHP_INT_MIN strings, one zero-padded' => ['-9223372036854775808', '-09223372036854775808'],
    'underflowing integer strings, one zero-padded' => ['-9223372036854775809', '-09223372036854775809'],
    'overflowing integer strings on opposite sides' => ['9223372036854775808', '-9223372036854775808'],
    'overflowing integer strings of different magnitude' => ['9223372036854775808', '99999999999999999999'],
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

// This port models a PLAIN JS object as a PHP array, and an array never takes the __toString
// cast — not even one whose own 'toString' key holds a closure. Read instead as a stdClass, a
// 'toString' property is still not the __toString method, so that spelling is false as well.
$arrayWithToStringKey = ['toString' => fn () => 'hello'];
probe(
    'array with a toString key and that string',
    '[\'toString\' => fn () => \'hello\'] == \'hello\'',
    fn () => $arrayWithToStringKey == 'hello'
);

$objectWithToStringProperty = new stdClass();
$objectWithToStringProperty->toString = 'hello';
probe(
    'object with a toString property but no __toString',
    '$o->toString = \'hello\'; $o == \'hello\'',
    fn () => $objectWithToStringProperty == 'hello'
);

// F1 — an object is ALWAYS truthy in PHP, whatever its state, and however empty it looks.
probe('plain object and true', 'new stdClass() == true', fn () => new stdClass() == true);
probe('plain object and false', 'new stdClass() == false', fn () => new stdClass() == false);
probe('plain object and null', 'new stdClass() == null', fn () => new stdClass() == null);
probe('stateless object and true', 'new DateTime(\'@0\') == true', fn () => new DateTime('@0') == true);
probe('stateless object and false', 'new DateTime(\'@0\') == false', fn () => new DateTime('@0') == false);
probe('stateless object and null', 'new DateTime(\'@0\') == null', fn () => new DateTime('@0') == null);

emit();
