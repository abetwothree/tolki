---
description: "Guidelines for Pull Request Review Instructions"
applyTo: "**/**"
---

# Pull Request Review Instructions

When reviewing this pull request, please follow these instructions.

## PHP Stubs & Function Lists

You should not do code review of PHP files or the text function list files location in `packages/*/fn-lists/`. The PHP files are copied from the [Laravel framework](https://github.com/laravel/framework) and the function list files are generated from those stubs.

When a branch is named something like `framework-sync-*` or `stubs-update-*`, it indicates that the changes are related to syncing or updating the stubs and function lists. In such cases, focus your review on the TypeScript code and the related tests. You can can compare the PHP to the TypeScript code to make sure the TypeScript implementation accurately reflects the PHP logic.

You can use the function list files to make sure that all functions from the PHP stubs have been implemented in TypeScript. They are named according to the source PHP file, e.g., the PHP stub file in `packages/str/stubs/Str.php` has function list file in `packages/str/fn-lists/Str-Function-List.txt`.

Read the `AGENTS.md` file at the root of the repository for more information on how to work with the PHP stubs, function lists, and overall structure of this project.
