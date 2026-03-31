---
description: "Guidelines for Pull Request Review Instructions"
applyTo: "**/**"
---

# Pull Request Review Instructions

When reviewing this pull request, please follow these instructions.

## Review Process

Use `GetWorkspaceDiff` to review the workspace diff against base.
Start with `GetWorkspaceDiff` using `stat: true` to identify changed files and the directories they touch. Use `GetWorkspaceDiff` without arguments for the full diff, and with `file` when you need the unified diff for a specific file.

Find all relevant `AGENTS.md` and `CLAUDE.md` files, including:

- the root-level file, if it exists
- any `AGENTS.md` or `CLAUDE.md` files in directories containing modified files
- any parent `AGENTS.md` or `CLAUDE.md` files whose scope applies to a changed file

When evaluating instruction compliance for a file, only use instruction files that actually apply to that file path.

If this workspace has an associated PR, use `gh` to read the PR title and description for context, but do not review the PR changes through GitHub. Review the workspace diff instead.

If subagents are available:

- use a lightweight model for discovery and diff summarization
- use a capable model for bug-finding and validation

If subagents are available, parallelize the review:

- one lightweight subagent summarizes the diff
- two more capable subagents check `AGENTS.md` / `CLAUDE.md` compliance
- two more capable subagents independently look for high-signal bugs, regressions, security issues, or incorrect logic in the changed code
- then launch validation subagents for each proposed issue and keep only issues that survive validation

If subagents are not available, perform the same review axes yourself sequentially and validate each issue before reporting it.

Only report high-signal issues:

- objective bugs that are likely to cause incorrect runtime behavior
- clear security or logic problems in changed code
- clear instruction-file violations where you can cite the exact rule and explain why it applies

Do not report:

- style preferences or subjective suggestions
- speculative concerns or low-confidence warnings
- issues that require context outside the diff unless you validate them
- linter-only issues
- generic code quality commentary like missing tests unless an instruction file explicitly requires it
- pre-existing issues that are not introduced by the reviewed changes

Do not post comments as subagents. Only the main reviewer should produce the final review output.

Output a concise list of validated issues ordered by severity. For each issue include:

- a short title
- a brief explanation of the problem
- the file path
- the reason it was flagged, such as `bug`, `security`, or `AGENTS.md compliance`

If no validated issues remain, say so explicitly and mention any residual risk or testing gap briefly.

## PHP Stubs & Function Lists

You should not do code review of PHP files or the text function list files location in `packages/*/fn-lists/`. The PHP files are copied from the [Laravel framework](https://github.com/laravel/framework) and the function list files are generated from those stubs.

When a branch is named something like `framework-sync-*` or `stubs-update-*`, it indicates that the changes are related to syncing or updating the stubs and function lists. In such cases, focus your review on the TypeScript code and the related tests. You can can compare the PHP to the TypeScript code to make sure the TypeScript implementation accurately reflects the PHP logic.

You can use the function list files to make sure that all functions from the PHP stubs have been implemented in TypeScript. They are named according to the source PHP file, e.g., the PHP stub file in `packages/str/stubs/Str.php` has function list file in `packages/str/fn-lists/Str-Function-List.txt`.

Read the `AGENTS.md` file at the root of the repository for more information on how to work with the PHP stubs, function lists, and overall structure of this project.
