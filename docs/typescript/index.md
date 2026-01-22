# TypeScript Type Utilities Installation

The [`@tolki/types`](https://www.npmjs.com/package/@tolki/types) package provides a variety of TypeScript types inspired by Laravel's data structures such as pagination results and models. You can install it via npm, yarn, or pnpm:

::: code-group

```bash [npm]
npm install @tolki/types
```

```bash [yarn]
yarn add @tolki/types
```

```bash [pnpm]
pnpm add @tolki/types
```

:::

## Importing the Package

Example usage of types in a Vue SFC setup script section:

```vue
<script lang="ts" setup>
import type { LengthAwarePaginator, TimestampModel } from "@tolki/types";

interface User extends TimestampModel {
  name: string;
  email: string;
}

const { users } = defineProps<{
  users: LengthAwarePaginator<User>;
}>();
</script>
```

See the [TypeScript Types Documentation](/typescript/typescript-utilities-list) for a full list of available types and their descriptions.
