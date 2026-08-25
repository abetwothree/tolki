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

emit();
