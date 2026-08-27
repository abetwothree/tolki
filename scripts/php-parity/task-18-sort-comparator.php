<?php

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;

// T2 — the three direction arms Obj.sort's copy of the comparator never reached
$asc = [['age' => 10], ['age' => 2]];
probe('direction tuple [age,"asc"] — string form', 'Arr::sort($u, [["age","asc"]])', fn () => array_values(Arr::sort($asc, [['age', 'asc']])));
probe('direction tuple [age,SortDirection::Ascending]', 'Arr::sort($u, [["age",SortDirection::Ascending]])', fn () => array_values(Arr::sort($asc, [['age', SortDirection::Ascending]])));
$desc = [['age' => 2], ['age' => 10]];
probe('sortDesc overrides an explicit "asc" direction', 'Arr::sortDesc($u, [["age","asc"]])', fn () => array_values(Arr::sortDesc($desc, [['age', 'asc']])));

// B5 — sortByMany's comparison is <=>, not a string cast
$mixed = [['item' => '1'], ['item' => '10'], ['item' => 5], ['item' => 20]];
probe('sortByMany orders mixed numeric strings and ints numerically', 'collect($mixed)->sortBy(["item"])->pluck("item")', fn () => collect($mixed)->sortBy(['item'])->pluck('item')->all());
probe('sortByMany forced descending over the same mixed items', 'collect($mixed)->sortByDesc(["item"])->values()->pluck("item")', fn () => collect($mixed)->sortByDesc(['item'])->values()->pluck('item')->all());

emit();
