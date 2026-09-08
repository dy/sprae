---
title: "Migrating from petite-vue to sprae"
description: "petite-vue's last release was January 2022. Every v-directive mapped to its sprae equivalent, what changes, and what petite-vue still does fine."
permalink: /petite-vue/
---

# Migrating from petite-vue

petite-vue's last release, 0.4.1, was published in **January 2022**. It still gets around ten thousand downloads a month, so plenty of pages are running it, and nothing about it has broken. But it is not being maintained, and if you are reading this you have probably already noticed.

This page maps every petite-vue directive to its sprae equivalent. It also says plainly what you lose, because one thing does not survive the move cleanly.

## Quick reference

| petite-vue | sprae |
|---|---|
| `v-scope="{ count: 0 }"` | `:scope="{ count: 0 }"` |
| `v-scope` (no value) | `:scope` |
| {% raw %}`{{ count }}`{% endraw %} | `:text="count"` (see [below](#text-interpolation)) |
| `v-text="msg"` | `:text="msg"` |
| `v-html="raw"` | `:html="raw"` |
| `v-if` / `v-else-if` / `v-else` | `:if` / `:else :if` / `:else` |
| `v-for="item in items"` | `:each="item in items"` |
| `v-for="(item, i) in items"` | `:each="item, i in items"` |
| `v-show="open"` | `:hidden="!open"` |
| `:class` / `v-bind:class` | `:class` |
| `:style` / `v-bind:style` | `:style` |
| `:disabled` / `v-bind:disabled` | `:disabled` |
| `v-bind="obj"` | `:="obj"` |
| `@click` / `v-on:click` | `:onclick` |
| `@click.prevent.stop` | `:onclick.prevent.stop` |
| `@keyup.enter` | `:onkeydown.enter` |
| `v-model="q"` | `:value="q" :change="v => q = v"` |
| `v-effect="..."` | `:fx="..."` |
| `@vue:mounted` | `:mount` |
| `@vue:unmounted` | return a cleanup from `:mount` |
| `ref="input"`, `$refs.input` | `:ref="input"` |
| `$el` | `this`, or `:ref` |
| `v-cloak` | CSS: `[\:scope] { visibility: hidden }` |
| `reactive(obj)` | `store(obj)` from `sprae/store` |
| `createApp(state).mount()` | `sprae(el, state)` |
| `createApp().directive(name, fn)` | `sprae.use({ dir: { name: fn } })` |

## Text interpolation

This is the one real cost of the move. petite-vue supports mustaches; sprae has no interpolation, because it never parses text nodes — it only reads attributes.

```html
<!-- petite-vue -->
<p>{% raw %}Hello, {{ name }}! You have {{ items.length }} items.{% endraw %}</p>

<!-- sprae -->
<p><span :text="'Hello, ' + name + '!'"></span>
   You have <span :text="items.length"></span> items.</p>
```

In exchange, the text you write in the HTML is what a crawler and a reader with JavaScript off actually see, instead of raw mustaches flashing before hydration. There is no `v-cloak` problem to solve because there is nothing to hide. If most of your templating is mustache-heavy prose, budget for this; if it is mostly attributes and lists, you will barely notice.

## Two-way binding is two directives

petite-vue's `v-model` does both directions. sprae splits it:

```html
<!-- petite-vue -->
<input v-model="query" />

<!-- sprae -->
<input :value="query" :change="v => query = v" />
```

It is one attribute longer, and it buys you the write-back path: `:change` hands you the value already coerced to the right type, so you can validate, clamp, format or debounce it without giving up the binding.

```html
<input :value="search" :change.debounce-300="v => search = v" />
```

## Components

petite-vue components are functions returning a scope object, optionally with `$template`. sprae takes the function directly:

```html
<!-- petite-vue -->
<script>
  function Counter({ initialCount }) {
    return { count: initialCount, inc() { this.count++ } }
  }
</script>
<div v-scope="Counter({ initialCount: 1 })">
  <button @click="inc" v-text="count"></button>
</div>

<!-- sprae -->
<script>
  window.Counter = (scope) => ({ count: 1, inc() { count++ } })
</script>
<div :scope="Counter">
  <button :onclick="inc()" :text="count"></button>
</div>
```

There is no `$template` equivalent. Reuse markup with your server template's own includes, with a `<template>` element and [`:html`](/directives/), or with a custom element — sprae sets a custom element's props and stops at its boundary.

## What changes for the better

- **Lists key themselves.** `:each` keys by item identity, so reordering moves the existing elements. There is no `:key` to write and no way to get it wrong.
- **Map and Set are reactive.** petite-vue [dropped collection reactivity](https://github.com/vuejs/petite-vue#not-supported) for size. sprae keeps it.
- **Strict CSP.** petite-vue has no CSP mode at all. sprae's [CSP build](/csp/) runs full JavaScript expressions with no `eval`, which is also what makes it work in [Manifest V3 extensions](/manifest-v3/).
- **Pluggable signals.** Reactivity runs on the TC39 signals proposal polyfill, Preact signals, or its own — petite-vue is welded to `@vue/reactivity`.
- **Teleport.** [`:portal`](/directives/) moves an element to another container; petite-vue dropped Teleport.

## What petite-vue still does fine

Being honest about this is the point: if none of the above is a problem for you, petite-vue is not broken. It is 6.4kb, it is Vue-compatible enough that Vue muscle memory transfers, and mustache interpolation is genuinely more pleasant for text-heavy templates. A page that works today will keep working.

The reasons to move are: you want a maintained dependency, you need CSP or extension support, you hit collection reactivity, or you are already writing around a bug nobody is going to fix.

## Moving over

Sizes and speed against Alpine and petite-vue are on the [comparison page](/compare/), measured and reproducible. The whole directive set is on the [reference](/directives/), and there are [working examples](/drops/) of the usual patterns.

```html
<script src="https://unpkg.com/sprae" defer></script>
```
