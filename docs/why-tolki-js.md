# Why Tolki JS?

## Reasoning for Porting Laravel PHP Utilities to JavaScript?

I love [Laravel](https://laravel.com/). I love JavaScript [frontend frameworks](https://vuejs.org/). [Inertia](https://inertiajs.com/) bridged the gap between these two worlds. I just wish I could use the incredible helper functions that Laravel provides in my JavaScript code.

That's why I created Tolki JS Utilities - to bring the power of Laravel's helper functions to your JavaScript codebase. With these utilities, you can use the same utilities between your backend and frontend code.

## Aren't There Already Similar Packages?

Yes, there are a few packages that provide string and collection utilities for JavaScript. However, most of these packages are either incomplete, not recently maintained, do not support TypeScript, or are not [tree-shakeable](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking) in an efficient way.

It's about time us Laravel devs with a love for the JavaScript ecosystem have sturdy frontend utility helpers that behave the same way as their backend counterparts.

## What about Lodash?

Lodash is great! I've used it myself in many projects. However, many of the functions do not behave the same way as their Laravel counterparts. For example, the lodash `get` function returns `undefined` if the value is not found, whereas Laravel's `Arr.get` function allows you to specify a default value and returns `null` if the value is not found and no default is provided.

In order to have a consistent experience between your backend and frontend code, I wanted to create a package that behaves as closely as possible to Laravel's helper functions. This way, whether you do `Arr.get()` in PHP or `get()` in JavaScript, you can expect the same behavior.

## TypeScript Support

I am big fan of TypeScript, so I wanted to make sure that these utilities have first-class TypeScript support. The entire codebase is written in TypeScript, and type definitions are included for all functions.

On top of the data utilities, there are some TypeScript types available so that you don't have to type them in your project. These types include pagination, models, and HTTP resource responses. The goal is to make it as easy as possible to work with Laravel-style data structures in your TypeScript code.

## Do I have to use Laravel to use these utilities?

No!

These utilities are designed to be used in any JavaScript or TypeScript project, regardless of whether you're using Laravel on the backend. You can use them in React, Vue, Angular, or any other frontend framework or library. You can even use them in plain JavaScript projects that never touch a backend.

You can even use these utilities in your Node.js backend projects if you want to have a consistent experience between your backend and frontend code. (Though I personally hate using JavaScript on the backend)
