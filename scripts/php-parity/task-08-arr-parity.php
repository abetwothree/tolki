<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;

probe('Arr::query with booleans', 'Arr::query(["foo"=>"bar","bar"=>true])', function () {
    return [
        'true'  => Arr::query(['foo' => 'bar', 'bar' => true]),
        'false' => Arr::query(['foo' => 'bar', 'bar' => false]),
        'empty' => Arr::query(['foo' => 'bar', 'bar' => '']),
        'null'  => Arr::query(['foo' => 'bar', 'bar' => null]),
        'none'  => Arr::query([]),
    ];
});

probe('Arr::toCssClasses mixed keys', 'Arr::toCssClasses([...])', function () {
    return Arr::toCssClasses(['font-bold', 'mt-4', 'ml-2' => true, 'mr-2' => false]);
});

probe('Arr::toCssStyles mixed keys', 'Arr::toCssStyles([...])', function () {
    return Arr::toCssStyles([
        'font-weight: bold', 'margin-top: 4px;',
        'margin-left: 2px;' => true, 'margin-right: 2px' => false,
    ]);
});

probe('Arr::random on empty', 'Arr::random([])', function () {
    return Arr::random([]);
});

probe('Arr::random preserveKeys default', 'Arr::random([...], 2)', function () {
    return array_keys(Arr::random(['one'=>'foo','two'=>'bar','three'=>'baz'], 2));
});

probe('Arr::only with a bare string key', 'Arr::only(["foo"=>1,"bar"=>"baz"], "bar")', function () {
    return Arr::only(['foo' => 1, 'bar' => 'baz'], 'bar');
});

probe('Arr::flatten default depth', 'Arr::flatten(["a"=>["b"=>["c"=>["d"=>1]]]])', function () {
    return Arr::flatten(['a' => ['b' => ['c' => ['d' => 1]]]]);
});

probe('Arr::mapWithKeys numeric-like keys', 'Arr::mapWithKeys([...])', function () {
    return Arr::mapWithKeys(['a' => 1, 'b' => 2], fn ($v) => [$v => $v]);
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

probe('is_numeric matrix for CSS-helper keys', 'is_numeric($key) for each input', function () {
    $cases = [
        '', ' ', '0x10', '1e3', 'Infinity', 'NAN', 'INF',
        ' 42', '42 ', ' 42 ', '+42', '-42', '3.14', '-3.14',
        '1e-3', '1E3', '007', '0', '00', '.5', '5.', '5.5e2',
        'abc', '1abc', 'abc1', '1_000', '0b101', '0o17',
        "\t5", "5\n", "\n5\n", "5\t", '5,5', '  ',
    ];

    $result = [];
    foreach ($cases as $c) {
        $result[] = ['input' => $c, 'is_numeric' => is_numeric($c)];
    }

    return $result;
});

probe('Arr::toCssStyles with is_numeric edge-case keys', "Arr::toCssStyles(['' => 'foo', ' ' => 'foo', '0x10' => 'foo', '1e3' => 'foo', 'Infinity' => 'foo'])", function () {
    return [
        'empty'    => Arr::toCssStyles(['' => 'foo']),
        'space'    => Arr::toCssStyles([' ' => 'foo']),
        'hex'      => Arr::toCssStyles(['0x10' => 'foo']),
        'sci'      => Arr::toCssStyles(['1e3' => 'foo']),
        'infinity' => Arr::toCssStyles(['Infinity' => 'foo']),
    ];
});

probe('Arr::toCssClasses non-string value at numeric key', "Arr::toCssClasses([0 => 123, 1 => null, 3 => true])", function () {
    return Arr::toCssClasses([0 => 123, 1 => null, 3 => true]);
});

probe('Arr::toCssStyles non-string value at numeric key', "Arr::toCssStyles([0 => 123, 1 => null, 3 => true])", function () {
    // The null case routes through Str::finish -> preg_replace with a
    // null $subject, which PHP 8.1+ deprecates (not a Throwable, so it
    // does not hit the catch below) but still evaluates -- @ suppresses
    // the notice so it cannot corrupt this harness's JSON stdout, while
    // the actual return value below is unaffected by the suppression.
    return @Arr::toCssStyles([0 => 123, 1 => null, 3 => true]);
});

probe('Arr::toCssClasses false value at numeric key', "Arr::toCssClasses([0 => false, 1 => 'x'])", function () {
    return Arr::toCssClasses([0 => false, 1 => 'x']);
});

probe('Arr::toCssStyles false value at numeric key', "Arr::toCssStyles([0 => false, 1 => 'x'])", function () {
    return Arr::toCssStyles([0 => false, 1 => 'x']);
});

emit();
