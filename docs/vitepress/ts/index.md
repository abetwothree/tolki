# Enum Utilities Installation

The [`@tolki/ts`](https://www.npmjs.com/package/@tolki/ts) package provides a variety of enum manipulation utilities inspired by PHP's enum utilities like [from](https://www.php.net/manual/en/backedenum.from.php), [tryFrom](https://www.php.net/manual/en/backedenum.tryfrom.php), and [cases](https://www.php.net/manual/en/unitenum.cases.php).

This package is meant to be used with the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish), which transforms PHP enums & routes into functional TypeScript objects.

The `@tolki/ts` package provides utilities to work with these TypeScript enums in a way that is similar to how you would work with PHP enums in Laravel. It also provides a `defineRoute` utility factory function to work with Laravel defined routes on the frontend.

You can install this package via npm, yarn, or pnpm:

::: code-group

```bash [npm]
npm install @tolki/ts
```

```bash [yarn]
yarn add @tolki/ts
```

```bash [pnpm]
pnpm add @tolki/ts
```

:::
