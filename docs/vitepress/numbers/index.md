# Number Utilities Installation

The [`@tolki/num`](https://www.npmjs.com/package/@tolki/num) package provides a variety of number manipulation utilities inspired by Laravel's Num class. You can install it via npm, yarn, or pnpm:

::: code-group

```bash [npm]
npm install @tolki/num
```

```bash [yarn]
yarn add @tolki/num
```

```bash [pnpm]
pnpm add @tolki/num
```

:::

## Importing the Package

You can import individual functions for better tree-shaking or the entire package (not recommended).:

Importing individual functions:

```typescript
// Import individual functions
import { format, parse } from "@tolki/num";

// Example usage
const formattedNumber = format(1234567.89); // '1,234,567.89'
const parsedNumber = parse("1,234,567.89"); // 1234567.89
```

Importing the entire package:

```typescript
// Import the entire package (not recommended for tree-shaking)
import * as Num from "@tolki/num";

// Example usage
const formattedNumber = Num.format(1234567.89); // '1,234,567.89'
const parsedNumber = Num.parse("1,234,567.89"); // 1234567.89
```

The reason that importing the entire package is not recommended is that it will include all functions in your bundle, even the ones you don't use, which can lead to larger bundle sizes. Importing individual functions allows your end files to only include the code that is actually used, resulting in smaller and more efficient bundles.

However, if you are working on a backend project where bundle size is not a concern, importing the entire package can be more convenient.
