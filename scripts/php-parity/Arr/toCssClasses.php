<?php

/**
 * Ground truth for Arr::toCssClasses().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('Arr::toCssClasses mixed keys', 'Arr::toCssClasses([...])', function () {
    return Arr::toCssClasses(['font-bold', 'mt-4', 'ml-2' => true, 'mr-2' => false]);
});

probe('Arr::toCssClasses with is_numeric edge-case keys', "Arr::toCssClasses(['' => 'foo', ' ' => 'foo', '0x10' => 'foo', '1e3' => 'foo', 'Infinity' => 'foo'])", function () {
    return [
        'empty'    => Arr::toCssClasses(['' => 'foo']),
        'space'    => Arr::toCssClasses([' ' => 'foo']),
        'hex'      => Arr::toCssClasses(['0x10' => 'foo']),
        'sci'      => Arr::toCssClasses(['1e3' => 'foo']),
        'infinity' => Arr::toCssClasses(['Infinity' => 'foo']),
    ];
});

probe('Arr::toCssClasses non-string value at numeric key', "Arr::toCssClasses([0 => 123, 1 => null, 3 => true])", function () {
    return Arr::toCssClasses([0 => 123, 1 => null, 3 => true]);
});

probe('Arr::toCssClasses false value at numeric key', "Arr::toCssClasses([0 => false, 1 => 'x'])", function () {
    return Arr::toCssClasses([0 => false, 1 => 'x']);
});

probe('CSS helpers use PHP truthiness for the value', 'Arr::toCssClasses(["foo"=>"0"])', function () {
    return [
        'zero_string' => Arr::toCssClasses(['foo' => '0']),
        'empty_array' => Arr::toCssClasses(['foo' => []]),
        'double_zero' => Arr::toCssClasses(['foo' => '00']),
        'zero_point_zero' => Arr::toCssClasses(['foo' => '0.0']),
        'styles_zero' => Arr::toCssStyles(['a:b' => '0']),
        'styles_double_zero' => Arr::toCssStyles(['foo' => '00']),
        'styles_zero_point_zero' => Arr::toCssStyles(['foo' => '0.0']),
    ];
});

probe('X22 CSS helpers emit the value for numeric keys', "Arr::toCssClasses(['font-bold','text-red'])", function () {
    return [
        'classes' => Arr::toCssClasses(['font-bold', 'text-red']),
        'styles' => Arr::toCssStyles(['color:red', 'font-size:14px']),
        'conditional' => Arr::toCssClasses(['font-bold', 'hidden' => false, 'active' => true]),
    ];
});

probe('toCssClasses-out-of-order', "Arr::toCssClasses([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => Arr::toCssClasses(OUT_OF_ORDER));
probe('toCssClasses-mixed', "Arr::toCssClasses(['x' => 1, 0 => 2, 'y' => 3])", fn () => Arr::toCssClasses(MIXED));
probe('toCssClasses-out-of-order-booleans', "Arr::toCssClasses([2 => 'c2', 'x' => true, 0 => 'c0', 'off' => false, 1 => 'c1'])", fn () => Arr::toCssClasses([2 => 'c2', 'x' => true, 0 => 'c0', 'off' => false, 1 => 'c1']));
probe('toCssClasses-collision', "Arr::toCssClasses([1 => 'a', 0 => 'z', '1' => 'b'])", fn () => Arr::toCssClasses([1 => 'a', 0 => 'z', '1' => 'b']));

emit();
