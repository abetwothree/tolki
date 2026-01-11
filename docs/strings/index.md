# String Utilities Installation

The [`@tolki/str`](https://www.npmjs.com/package/@tolki/str) package provides a variety of string manipulation utilities inspired by Laravel's Str class. You can install it via npm, yarn, or pnpm:

```bash
npm install @tolki/str
# or
yarn add @tolki/str
# or
pnpm add @tolki/str
```

## Importing the Package

You can import individual functions for better tree-shaking or the entire package (not recommended).:

Importing individual functions:

```typescript
// Import individual functions
import { camel, chopEnd } from "@tolki/str";

// Example usage
const camelCaseString = camel("hello world"); // 'helloWorld'
const choppedString = chopEnd("HelloWorld", 5); // 'Hello'
```

Importing the entire package:

```typescript
// Import the entire package (not recommended for tree-shaking)
import * as Str from "@tolki/str";

// Example usage
const camelCaseString = Str.camel("hello world"); // 'helloWorld'
const choppedString = Str.chopEnd("HelloWorld", 5); // 'Hello'
```

The reason that importing the entire package is not recommended is that it will include all functions in your bundle, even the ones you don't use, which can lead to larger bundle sizes. Importing individual functions allows your end files to only include the code that is actually used, resulting in smaller and more efficient bundles.

However, if you are working on a backend project where bundle size is not a concern, importing the entire package can be more convenient.
