# Tolki JS

Use the PHP Laravel framework utilities in your JavaScript projects.

## Backstory

I love the Laravel PHP framework utilities. I love frontend frameworks like Vue. I love using Inertia JS to bridge the two. However, I missed the ability to use Laravel-like utilities in my JavaScript code. So, I ported multiple Laravel utilities to TypeScript so that I could use them in my projects.

I thus decided to open-source these utilities so that others could benefit from them as well. Thus, the Tolki JS project was born.

## Packages

| Package                                      | Description                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| [`@tolki/all`](./packages/all)               | A wrapper package to install all Tolki packages at once.                 |
| [`@tolki/arr`](./packages/arr)               | Utilities for working with arrays.                                       |
| [`@tolki/collection`](./packages/collection) | A Collection class similar to Laravel's Collection class.                |
| [`@tolki/data`](./packages/data)             | Utilities for working with JavaScript objects and arrays in one package. |
| [`@tolki/num`](./packages/num)               | Utilities for working with numbers like Laravel's Num class.             |
| [`@tolki/obj`](./packages/obj)               | Utilities for working with JavaScript objects.                           |
| [`@tolki/str`](./packages/str)               | Utilities for working with strings like Laravel's Str class.             |
| [`@tolki/types`](./packages/types)           | Utility TypeScript types for Tolki packages and Laravel HTTP responses.  |
