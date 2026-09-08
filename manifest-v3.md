---
title: "Reactive HTML in a Chrome Manifest V3 extension"
description: "MV3 bans string evaluation and remotely hosted code, which breaks most attribute-expression libraries. A working popup with full JS expressions, bundled and CSP-clean."
permalink: /manifest-v3/
---

# Chrome extensions on Manifest V3

Manifest V3 [removes two things](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security) that extension UIs used to lean on:

- **String evaluation.** `eval`, `new Function` and `setTimeout("...")` are blocked in extension pages. The default policy is `script-src 'self'` and you cannot add `'unsafe-eval'` to it.
- **Remotely hosted code.** Every script must ship inside the extension package. No CDN tag, no dynamic import from a URL.

Together these rule out most of the "sprinkle reactivity onto HTML" libraries, because compiling `x-on:click="count++"` into a function is exactly what MV3 forbids. Alpine's [CSP build](/alpine-csp/) exists for this, at the cost of a restricted expression subset; petite-vue has no CSP mode at all.

## The two escape hatches

**A sandboxed iframe.** MV3 still permits `eval` inside a [sandboxed page](https://developer.chrome.com/docs/extensions/mv2/sandboxingEval/), so you can run a normal library there and message it. It works, and it costs you a document boundary: the sandbox has no extension API access, so every read and write becomes `postMessage` plumbing. Reasonable for a templating engine you cannot replace, heavy for a popup with three buttons.

**An interpreter instead of a compiler.** If expressions are parsed and walked rather than compiled to a function, nothing is ever evaluated as a string and the policy is satisfied without a sandbox. This is what sprae's CSP build does, using [jessie](https://github.com/dy/subscript).

## A working popup

Three files, no build step, no bundler.

```json
// manifest.json
{
  "manifest_version": 3,
  "name": "Example",
  "version": "1.0",
  "action": { "default_popup": "popup.html" },
  "permissions": ["storage"]
}
```

Download [sprae-csp.umd.js](https://unpkg.com/sprae/dist/sprae-csp.umd.js) into the extension folder, then:

```html
<!-- popup.html -->
<!doctype html>
<meta charset="utf-8">
<script src="sprae-csp.umd.js" data-start></script>

<div :scope="{ sites: [], draft: '' }"
  :mount="s => chrome.storage.sync.get('sites', r => s.sites = r.sites || [])"
  :fx="chrome.storage.sync.set({ sites })">

  <input :value="draft" :change="v => draft = v"
    :onkeydown.enter="sites.push(draft), draft = ''"
    placeholder="Block a site..." />

  <ul>
    <li :each="site, i in sites">
      <span :text="site"></span>
      <button :onclick="sites.splice(i, 1)">×</button>
    </li>
  </ul>

  <p :if="!sites.length">Nothing blocked yet.</p>
</div>
```

That is the whole popup. The arrow functions, the array methods and the `chrome.*` global calls all run under `script-src 'self'`, because none of them are compiled from a string.

## What still differs from the eval build

The full test suite runs against the CSP build on [every commit](https://github.com/dy/sprae/actions), and three differences remain:

- `await` is not supported inside an expression. Do async work in `:mount` or in a state method, as the popup above does with `chrome.storage`.
- `this` binding is not preserved in compiled functions. Use `:ref` when you need the element.
- Getters and template literals have edge cases. Prefer store computeds and string concatenation.

## Content scripts

The same file works in a content script, with one caveat: a content script shares the host page's DOM but runs under the extension's policy, so bundle the script rather than injecting a CDN tag.

```json
"content_scripts": [{
  "matches": ["https://example.com/*"],
  "js": ["sprae-csp.umd.js", "init.js"]
}]
```

More on policies, headers and the Alpine comparison: [strict CSP](/csp/) and [Alpine's CSP build](/alpine-csp/).
