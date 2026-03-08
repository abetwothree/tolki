# Tolki JS Enum Package

This package provides enum utility functions similar to a PHP enum class.

## Documentation

The full documentation for the enum utilities can be found at [https://tolki.abe.dev](https://tolki.abe.dev/enums/).

<!-- AUTO-GENERATED-DOCS:START -->

# Enum Utilities Installation

The [`@tolki/enum`](https://www.npmjs.com/package/@tolki/enum) package provides a variety of enum manipulation utilities inspired by PHP's enum utilities like [from](https://www.php.net/manual/en/backedenum.from.php), [tryFrom](https://www.php.net/manual/en/backedenum.tryfrom.php), and [cases](https://www.php.net/manual/en/unitenum.cases.php).

This package is meant to be used with the Laravel enum package [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish), which transforms PHP enums into TypeScript enums. The `@tolki/enum` package provides utilities to work with these TypeScript enums in a way that is similar to how you would work with PHP enums in Laravel.

You can install this package via npm, yarn, or pnpm:

```bash [npm]
npm install @tolki/enum
```

```bash [yarn]
yarn add @tolki/enum
```

```bash [pnpm]
pnpm add @tolki/enum
```

# Tolki Enum Utilities List

## Enum Utilities List

As mentioned in the [Enum Utilities Installation](./index.md) page, the `@tolki/enum` package is not meant to be used as standalone package as it works with the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) package to transform PHP enums into TypeScript enums. The functions below are being listed out for reference, not necessarily for direct use.

[cases](#cases) [defineEnum](#defineenum) [from](#from) [tryFrom](#tryfrom)

## Enum Utilities Details

### cases

Similar to the PHP [cases](https://www.php.net/manual/en/unitenum.cases.php) method, this function returns an array of all the cases of the given enum.

```javascript
import { cases } from "@tolki/enum";
import { Status } from "@js/types/enums";

const result = cases(Status); // result is an array with an enum instance for each case in the Status enum
```

### defineEnum

This is a factory function that is automatically applied by the Laravel TypeScript Publisher package when it transforms PHP enums into TypeScript enums. It automatically adds the `cases`, `from`, and `tryFrom` methods to the transformed TypeScript enums.

```javascript
import { defineEnum } from "@tolki/enum";

const Status = defineEnum({
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  // automatically added by the Laravel TypeScript Publisher package
  _cases: ["ACTIVE", "INACTIVE", "PENDING"],
  _methods: [],
  _static: [],
});

Status.cases(); // result is an array with an enum instance for each case in the Status enum
Status.from("active"); // result is the enum instance for the ACTIVE case
Status.tryFrom("non-valid-key"); // result null
```

### from

Similar to the PHP [from](https://www.php.net/manual/en/backedenum.from.php) method, this function returns the enum instance for the given value. If the value does not exist in the enum, it throws an error.

```javascript
import { from } from "@tolki/enum";
import { Status } from "@js/types/enums";

const result = from(Status, "active"); // result is the enum instance for the ACTIVE case
const result2 = from(Status, "non-valid-key"); // throws an error because "non-valid-key" is not a valid value
```

### tryFrom

Similar to the PHP [tryFrom](https://www.php.net/manual/en/backedenum.tryfrom.php) method, this function returns the enum instance for the given value. If the value does not exist in the enum, it returns null instead of throwing an error.

```javascript
import { tryFrom } from "@tolki/enum";
import { Status } from "@js/types/enums";

const result = tryFrom(Status, "active"); // result is the enum instance for the ACTIVE case
const result2 = tryFrom(Status, "non-valid-key"); // result is null because "non-valid-key" is not a valid value
```

# Tolki Enum Laravel TypeScript Publisher Vite Plugin

The `@tolki/enum` package provides a Vite plugin to automatically watch for changes of the transformed PHP files by the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) package.

The Laravel TypeScript Publisher package can publish a JSON file list of transformed PHP files. This Vite plugin uses that JSON file list to watch for changes in those PHP files and automatically call the `php artisan ts:publish` command to transform the changed PHP files into TypeScript files.

## Usage

To use the Vite plugin, you need to add it to your Vite configuration file. Below is an example of how to add the plugin to your Vite configuration file:

```javascript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/enum";

export default defineConfig({
  plugins: [laravelTsPublish()],
});
```

## Default Functionality

By default, the plugin will work in the following way:

1. It will call `php artisan ts:publish` as the republish command when a file changes.
2. It will look for the list of transformed PHP files here: `resources/js/types/laravel-ts-collected-files.json`.
3. It will reload the page after you make any update to any of the transformed PHP files.
4. It will call the publish command on `vite build` before bundling.
5. It will throw an error if the publish command fails on `vite build`.

## Plugin Options

The plugin accepts an options object to customize its behavior. It is recommended to use `.env` config settings to sync settings between the PHP side and the Vite plugin for the `filename` and `directory` options.

Below are the available options with a description and default values:

```javascript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/enum";

export default defineConfig({
  plugins: [
    laravelTsPublish({
      /**
       * The publish command to run when a watched PHP file changes.
       *
       * If you use Sail and run your Vite dev server inside the Sail container,
       * you may need to change this command to `sail php artisan ts:publish`
       * or `./vendor/bin/sail php artisan ts:publish` depending on your setup.
       */
      command: "php artisan ts:publish",
      /**
       * The filename of the JSON manifest listing collected PHP files.
       */
      filename: "laravel-ts-collected-files.json",
      /**
       * The directory where the JSON manifest file exists, relative to the Vite root.
       */
      directory: "resources/js/types/",
      /**
       * Whether to run the publish command once when `vite dev` starts.
       *
       * Has no effect during `vite build`.
       */
      runOnDevStart: false,
      /**
       * Whether to run the publish command once before bundling during `vite build`.
       *
       * Has no effect during `vite dev`.
       */
      runOnBuildStart: true,
      /**
       * Whether to trigger a full browser reload after the
       * command runs successfully during `vite dev`.
       *
       * Has no effect during `vite build`.
       */
      reload: true,
      /**
       * Whether to throw an error (aborting the build) when the command fails.
       *
       * When not specified, defaults to `true` during `vite build`
       * and `false` during `vite dev`.
       *
       * When specified, it will apply to both `vite dev` and `vite build`.
       */
      failOnError: undefined,
    }),
  ],
});
```

<!-- AUTO-GENERATED-DOCS:END -->
