# Tolki Enum Laravel TypeScript Publisher Vite Plugin

The `@tolki/enum` package provides a Vite plugin to automatically watch for changes of the transformed PHP files by the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) package.

The Laravel TypeScript Publisher package can publish a JSON file list of transformed PHP files. This Vite plugin uses that JSON file list to watch for changes in those PHP files and automatically call the `php artisan ts:publish` command to transform the changed PHP files into TypeScript files.

## Usage

To use the Vite plugin, you need to add it to your Vite configuration file. Below is an example of how to add the plugin to your Vite configuration file:

```javascript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/enum";

export default defineConfig({
  plugins: [
    laravelTsPublish(),
  ],
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
