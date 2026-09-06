<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Collection;

probe('pad negative on assoc', 'array_pad(["a"=>1,"b"=>2],-5,0)', function () {
    return array_pad(['a' => 1, 'b' => 2], -5, 0);
});

probe('pad positive on assoc', 'array_pad(["a"=>1,"b"=>2],5,0)', function () {
    return array_pad(['a' => 1, 'b' => 2], 5, 0);
});

probe('pad when no padding needed', 'array_pad(["a"=>1,"b"=>2],2,0)', function () {
    return array_pad(['a' => 1, 'b' => 2], 2, 0);
});

probe('union — left wins, including null', '["a"=>null] + ["a"=>1]', function () {
    return ['a' => null] + ['a' => 1];
});

probe('Collection::union', '$c->union(["a"=>1,"b"=>2])', function () {
    return (new Collection(['a' => null]))->union(['a' => 1, 'b' => 2])->all();
});

emit();
