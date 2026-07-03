---
title: Sprae under strict CSP
description: Full JS expressions in HTML with no eval and no new Function — strict Content-Security-Policy and Chrome MV3 extensions.
---

# Strict CSP

Expression-in-attribute frameworks normally compile `:onclick="count++"` with `new Function` — which a strict [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) (no `'unsafe-eval'`) blocks, and [Chrome MV3 extensions](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security) forbid outright. Banking, government, healthcare, extensions — same wall.

Sprae's evaluator is pluggable. The CSP build swaps `new Function` for [jessie](https://github.com/dy/subscript) — a JS interpreter, no eval anywhere — and keeps standard JS expressions:

```html
<!-- all of these run under script-src 'self' -->
<button :onclick="user.name = 'John'">Set name</button>
<li :each="item in items.filter(i => i.active)" :text="item.name"></li>
<input :onkeydown.enter="todos.push({ text: draft, done: false })" />
```

## Setup

```html
<!-- CDN (self-host the file for script-src 'self') -->
<script src="/js/sprae-csp.umd.js" data-start></script>
```

```js
// or ESM
import sprae from 'sprae'
import jessie from 'subscript/jessie'

sprae.use({ compile: jessie })
```

Get the bundle: [sprae-csp.umd.js](https://unpkg.com/sprae/dist/sprae-csp.umd.js) · [sprae-csp.js](https://unpkg.com/sprae/dist/sprae-csp.js) (ESM)

## vs Alpine's CSP build

Alpine offers a [CSP build](https://alpinejs.dev/advanced/csp) that restricts expressions to a small subset. Per its own docs:

| expression | sprae CSP | Alpine CSP |
|---|---|---|
| `user.name = 'John'` (property assignment) | ✅ | ❌ |
| `items.filter(i => i.active)` (arrow functions) | ✅ | ❌ |
| `Math.max(a, b)`, `JSON.stringify(x)` (globals) | ✅ | ❌ |
| `:html` / `x-html` | ✅ | ❌ |
| size, min+gzip | **18.1kb** | 20.3kb |

Alpine's recommended workaround is moving logic into `Alpine.data()` components — sprae just runs your expression.

## Known limits

The full sprae test suite runs against the CSP build on every commit ([CI](https://github.com/dy/sprae/actions)). Differences from the eval build:

- `await` is not supported inside expressions — fetch in [`:mount`](https://github.com/dy/sprae#mount) or state methods instead.
- `this` binding is not preserved in compiled functions — use [`:ref`](https://github.com/dy/sprae#ref) for element access.
- Getters and template literals have edge cases — prefer [`store`](https://github.com/dy/sprae#store) computeds and string concatenation.

## Chrome extension (MV3)

MV3 [disallows](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security) remotely-hosted code and string evaluation — so: bundle sprae-csp with the extension, no CDN.

```json
// manifest.json
{
  "manifest_version": 3,
  "action": { "default_popup": "popup.html" }
}
```

```html
<!-- popup.html -->
<script src="sprae-csp.umd.js" data-start></script>
<div :scope="{ on: false }">
  <button :onclick="on = !on" :text="on ? 'Disable' : 'Enable'"></button>
</div>
```

## Header example

```
Content-Security-Policy: default-src 'self'; script-src 'self'
```

No `'unsafe-eval'`, no `'unsafe-inline'` needed — directives are attributes, not inline scripts.
