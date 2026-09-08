---
title: "Alpine.js CSP build: what it restricts and what else you can use"
description: "Alpine's CSP build drops arrow functions, template literals, spread and global access. What that costs, the Alpine.data() workaround, and the honest alternatives."
permalink: /alpine-csp/
---

# Alpine's CSP build, and the alternatives

If your Content-Security-Policy has no `'unsafe-eval'`, ordinary Alpine stops working. Alpine compiles `x-on:click="count++"` with a `Function` constructor, and a strict policy blocks that the same way it blocks `eval`. The same wall shows up in [Chrome MV3 extensions](/manifest-v3/), which forbid string evaluation outright.

Alpine's answer is a separate [CSP build](https://alpinejs.dev/advanced/csp), `@alpinejs/csp`, which parses a restricted expression language instead of compiling JavaScript. It works, and for many pages it is enough. It is worth knowing exactly what you give up before you commit to it.

## What the CSP build allows

Per [Alpine's own documentation](https://alpinejs.dev/advanced/csp):

| | `@alpinejs/csp` |
|---|---|
| Object and array literals | yes |
| Arithmetic, comparison, ternaries | yes |
| String concatenation | yes |
| Method calls on data properties | yes |
| Assignment and increment | yes |
| Arrow functions | no |
| Template literals | no |
| Destructuring and spread | no |
| Globals (`Math`, `JSON`, `console`, `document`, `parseInt`) | no |
| `x-html` | no |

The recommended workaround is to move anything non-trivial into an `Alpine.data()` component and call a method from the attribute. That is a reasonable pattern, but it changes the shape of your code: expressions you could previously read in the markup move into a script file, and the markup stops telling you what happens.

The practical friction shows up in threads like [Alpine discussion #3537](https://github.com/alpinejs/alpine/discussions/3537) on contributing CSP-build improvements, and issues like [Replace AlpineJS with a CSP-compatible library](https://gitlab.com/up-learn-uk/admin_elf/-/issues/15).

## The options

There is no single right answer. What follows is the honest shape of each choice.

**Stay on `@alpinejs/csp`.** Cheapest if your expressions are already simple and you are happy pushing logic into `Alpine.data()`. You keep Alpine's ecosystem and plugins. You lose arrow functions, so anything list-shaped (`filter`, `map`, `sort`) has to become a component getter.

**[Stimulus](https://stimulus.hotwired.dev/).** No expressions in HTML at all: attributes name controllers, targets and actions, and the logic lives in JavaScript classes. Nothing to evaluate, so CSP is a non-issue. The trade is verbosity, and you write more wiring for simple interactions.

**[Lit](https://lit.dev/) or [Preact](https://preactjs.com/).** Real components, compiled ahead of time, so no runtime evaluation. Right answer if you were heading toward components anyway. Wrong answer if the appeal of Alpine was that you did not want a build step, because now you have one.

**Sprae's [CSP build](/csp/).** Keeps expressions in the markup and keeps them full JavaScript. The evaluator is pluggable, and the CSP build swaps `new Function` for [jessie](https://github.com/dy/subscript), a JavaScript interpreter that never calls `eval`. Arrow functions, globals, property assignment and `:html` all work under `script-src 'self'`. The trade is that you are moving off Alpine, so plugins and `Alpine.data()` need [migrating](/alpine/), and a few edge cases differ (no `await` inside expressions, `this` binding not preserved in compiled functions).

## Side by side

| Expression | `@alpinejs/csp` | sprae CSP |
|---|---|---|
| `count++` | yes | yes |
| `user.name = 'John'` | no | yes |
| `items.filter(i => i.active)` | no | yes |
| `Math.max(a, b)` | no | yes |
| `` `${count} items` `` | no | yes |
| `x-html` / `:html` | no | yes |
| Size, min+gzip | 22.5kb | 20.3kb |

Sizes measured for `@alpinejs/csp` 3.16.2 and sprae 13.9.1; reproduce them with the method in the [comparison](/compare/#methodology).

## If you switch

The [Alpine to sprae migration guide](/alpine/) maps every directive, magic and plugin. The short version is that `x-data` becomes `:scope`, `x-for` becomes `:each`, `x-on:click` becomes `:onclick`, and `Alpine.data("dropdown")` becomes a named function passed to `:scope`.

Setup is one file:

```html
<!-- self-hosted, so script-src 'self' covers it -->
<script src="/js/sprae-csp.umd.js" data-start></script>
```

Full setup, known limits and a header example are on the [strict CSP page](/csp/). For browser extensions, see [Manifest V3](/manifest-v3/).
