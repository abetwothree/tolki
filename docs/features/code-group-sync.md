# Code-group sync

`docs/vitepress/.vitepress/theme/code-group-sync.ts` keeps VitePress code groups that offer the same tabs in step, and remembers the choice. The reference pages hold about 100 groups titled `@tolki/arr`, `@tolki/obj` and `@tolki/data`, so one pick should apply to all of them.

## Markup contract

Written against VitePress `2.0.0-alpha.17`:

```html
<div class="vp-code-group">
  <div class="tabs">
    <input type="radio" name="group-1" id="tab-1" checked />
    <label data-title="@tolki/arr" for="tab-1">@tolki/arr</label>
  </div>
  <div class="blocks">
    <div class="language-ts active">...</div>
  </div>
</div>
```

- A label's position matches its block's position in `.blocks`.
- Groups belong together when their sorted `data-title` values, joined by `|`, are equal. `groupSignature` returns that string. Package-manager groups (`npm|pnpm|yarn`) sync the same way.

## Why it never calls `input.click()`

VitePress's own click handler ends with `label.scrollIntoView({ block: "nearest" })`. A synthetic click on every other group would scroll the page to each one. `activateTab` instead sets `input.checked`, moves `.active` to the matching block and dispatches `vitepress:codeGroupTabActivate` on `window` with the block as `detail`, which is what other listeners (such as group icons) expect.

The listener ignores events without `isTrusted`, so script-made clicks (including VitePress's own) never start a sync. Keyboard arrows on a radio produce a trusted click, so they sync too.

## Scroll compensation

Groups above the viewport change height when their tab changes. `syncFrom` reads the clicked group's `getBoundingClientRect().top` before and after, and calls `window.scrollBy(0, after - before)` when it moved, so the tab under the pointer stays put.

On load, `restoreSelections` does the same for the element named by `location.hash`, so a deep link still lands on its heading after stored tabs are applied.

## Storage

- Key: `tolki:code-group:` plus the signature, for example `tolki:code-group:@tolki/arr|@tolki/data|@tolki/obj`. The value is the tab title.
- Reading `window.localStorage`, `getItem` and `setItem` are all wrapped in `try`/`catch`. In a private window or with blocked site data the tabs still sync on the page; they just are not remembered.
- Restore applies a stored title only to groups that have it. Other groups keep their tab.

## Wiring and dev mode

`theme/index.ts` calls `installCodeGroupSync(window)` in `enhanceApp` when `inBrowser`. Restore runs from the theme's `setup()` (typed as deprecated in `Theme` but still called by VitePress) through `onContentUpdated`, then `nextTick`.

In dev mode VitePress resets every group to its first tab in its own `onContentUpdated`. The `nextTick` makes restore run after that reset.

## After a VitePress upgrade

Recheck:

- The markup above, and the `vitepress:codeGroupTabActivate` event in `app/composables/codeGroups.js`.
- That `Theme.setup` still exists. If it is removed, call `onContentUpdated` from a `setup` in the `Layout` wrapper.
- In `pnpm docs:dev`, reload a page with a stored non-first tab and a `#heading` hash. The tab must be restored and the heading must stay at the top.
