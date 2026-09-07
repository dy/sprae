---
title: Migrating from Alpine to Sprae
description: Alpine directives, magics, plugins and Alpine.data() with their sprae equivalents, side by side.
---

# Migrating from Alpine to Sprae

## Quick Reference

| Alpine | Sprae |
|--------|-------|
| `x-data="{ count: 0 }"` | `:scope="{ count: 0 }"` |
| `x-data="dropdown"` | `:scope="dropdown()"` (see [below](#alpinedata)) |
| `x-text="message"` | `:text="message"` |
| `x-html="content"` | `:html="content"` |
| `x-show="open"` | `:hidden="!open"` |
| `x-if="condition"` | `:if="condition"` |
| `x-for="item in items"` | `:each="item in items"` |
| `x-bind:class="..."` | `:class="..."` |
| `x-bind:disabled="..."` | `:disabled="..."` |
| `x-bind="obj"` | `:="obj"` for attributes; directives stay inline |
| `x-on:click="..."` | `:onclick="..."` |
| `@click="..."` | `:onclick="..."` |
| `x-model="value"` | `:value="value"` |
| `x-ref="name"` | `:ref="name"` |
| `x-effect="..."` | `:fx="..."` |
| `x-teleport="#target"` | `:portal="'#target'"` |
| `x-cloak` | CSS: `[\:scope] { visibility: hidden }` |
| `x-init="..."` | `:fx.once="..."` or `:scope.once="..."` |
| `x-transition` | CSS transitions (see [below](#x-transition)) |
| `$el` | `:ref="el"` (preferred) or `this` |
| `$root` | Use `:ref` on root element |
| `$id('field')` | `:id="'field-' + i"` in `:each` (see [below](#id)) |

## Directives

### Data/Scope

```html
<!-- Alpine -->
<div x-data="{ count: 0, name: 'World' }">

<!-- Sprae -->
<div :scope="{ count: 0, name: 'World' }">
```

### Text & HTML

```html
<!-- Alpine -->
<span x-text="message"></span>
<div x-html="content"></div>

<!-- Sprae -->
<span :text="message"></span>
<div :html="content"></div>
```

### Conditionals

```html
<!-- Alpine -->
<template x-if="show">
  <div>Visible</div>
</template>
<template x-else>
  <div>Hidden</div>
</template>

<!-- Sprae -->
<div :if="show">Visible</div>
<div :else>Hidden</div>

<!-- or with template for fragments -->
<template :if="show">
  <div>Visible</div>
</template>
```

### Show/Hidden

```html
<!-- Alpine: x-show keeps element, toggles display -->
<div x-show="open">Content</div>

<!-- Sprae: :hidden toggles hidden attribute -->
<div :hidden="!open">Content</div>

<!-- Sprae: :if removes/adds element -->
<div :if="open">Content</div>
```

### Loops

```html
<!-- Alpine -->
<template x-for="item in items" :key="item.id">
  <li x-text="item.name"></li>
</template>

<!-- Sprae: key is automatic (item identity) -->
<li :each="item in items" :text="item.name"></li>

<!-- with index -->
<li :each="item, idx in items" :text="idx + ': ' + item.name"></li>
```

### Events

```html
<!-- Alpine -->
<button x-on:click="count++">Click</button>
<button @click="count++">Click</button>
<form @submit.prevent="save()">

<!-- Sprae -->
<button :onclick="count++">Click</button>
<form :onsubmit.prevent="save()">

<!-- Accessing event object -->
<!-- Alpine: $event magic -->
<input @input="search($event.target.value)">

<!-- Sprae: arrow function -->
<input :oninput="e => search(e.target.value)">
```

### Attributes

```html
<!-- Alpine -->
<input x-bind:disabled="loading">
<input :disabled="loading">
<div x-bind:class="{ active: isActive }">

<!-- Sprae -->
<input :disabled="loading">
<div :class="{ active: isActive }">
```

### Model (Two-way Binding)

```html
<!-- Alpine -->
<input x-model="query">
<select x-model="country">

<!-- Sprae -->
<input :value="query">
<select :value="country">
```

### Refs

```html
<!-- Alpine -->
<input x-ref="input">
<button @click="$refs.input.focus()">

<!-- Sprae -->
<input :ref="input">
<button :onclick="input.focus()">
```

### Effects

```html
<!-- Alpine -->
<div x-effect="console.log(count)">

<!-- Sprae -->
<div :fx="console.log(count)">

<!-- with cleanup -->
<div :fx="() => { const id = setInterval(tick, 1000); return () => clearInterval(id) }">
```

### Teleport/Portal

```html
<!-- Alpine -->
<template x-teleport="#modals">
  <div>Modal</div>
</template>

<!-- Sprae: selector must be quoted -->
<div :portal="'#modals'">Modal</div>
```

## Modifiers

| Alpine | Sprae |
|--------|-------|
| `.prevent` | `.prevent` |
| `.stop` | `.stop` |
| `.outside` | `.away` |
| `.window` | `.window` |
| `.document` | `.document` |
| `.once` | `.once` |
| `.debounce` | `.debounce` |
| `.throttle` | `.throttle` |
| `.self` | `.self` |
| `.passive` | `.passive` |
| `.capture` | `.capture` |

```html
<!-- Alpine -->
<button @click.prevent.stop="save()">

<!-- Sprae -->
<button :onclick.prevent.stop="save()">
```

## No Direct Equivalent

### x-init

Use `:fx` or initialize in `:scope`:

```html
<!-- Alpine -->
<div x-init="fetchData()">

<!-- Sprae: via effect -->
<div :fx.once="fetchData()">

<!-- or in scope -->
<div :scope="{ data: [] }" :fx.once="fetchData().then(d => data = d)">
```

### x-cloak

Sprae removes directive attributes after processing, so use CSS to hide unprocessed elements:

```css
[\:scope], [\:if], [\:each], [\:text] { visibility: hidden }
```

This hides elements until sprae initializes them (removes the attributes).

### $store

Use shared state object:

```js
// Alpine
Alpine.store('user', { name: 'John' })
// <span x-text="$store.user.name">

// Sprae
const user = { name: 'John' }
sprae(el, { user })
// <span :text="user.name">
```

### $watch

Use `:fx`:

```html
<!-- Alpine -->
<div x-data x-init="$watch('count', v => console.log(v))">

<!-- Sprae -->
<div :scope :fx="console.log(count)">
```

### $el

Use `:ref` to get element reference:

```html
<!-- Alpine -->
<div @click="$el.classList.toggle('active')">

<!-- Sprae -->
<div :ref="el" :onclick="el.classList.toggle('active')">
```

### $root

No magic property. Use `:ref` on the root element:

```html
<!-- Alpine -->
<div x-data @click="$root.style.color = 'red'">

<!-- Sprae -->
<div :scope :ref="root" :onclick="root.style.color = 'red'">
```

### $id

Alpine generates scoped ids to pair `for`/`id` and `aria-*` attributes. In sprae, derive the id from the loop index; a single instance needs no generator:

```html
<!-- Alpine -->
<div x-id="['field']">
  <label :for="$id('field')">Name</label>
  <input :id="$id('field')">
</div>

<!-- Sprae -->
<div :each="f, i in fields">
  <label :for="'field-' + i" :text="f.label"></label>
  <input :id="'field-' + i">
</div>
```

### $dispatch

Use native `CustomEvent`:

```html
<!-- Alpine -->
<button @click="$dispatch('notify', { message: 'Hello' })">

<!-- Sprae: this = current element -->
<button :onclick="this.dispatchEvent(new CustomEvent('notify', { bubbles: true, detail: { message: 'Hello' }}))">
```

### $nextTick

Use `queueMicrotask`:

```html
<!-- Alpine -->
<button @click="count++; $nextTick(() => console.log($refs.count.innerText))">

<!-- Sprae -->
<button :onclick="count++; queueMicrotask(() => console.log(countEl.innerText))">
```

### x-transition

Alpine's `x-transition` adds enter/leave classes automatically. In sprae, use CSS transitions on `:if` or `:hidden`:

```html
<!-- Alpine -->
<div x-show="open" x-transition>Content</div>
<div x-show="open" x-transition.opacity>Content</div>
<div x-show="open" x-transition.duration.500ms>Content</div>

<!-- Sprae: fade with :if -->
<div :if="open" class="fade">Content</div>
```

```css
.fade {
  animation: fade-in 200ms;
}

@keyframes fade-in {
  from { opacity: 0; }
}
```

For enter + leave animations, use `:hidden` (keeps element in DOM):

```html
<div :hidden="!open" :class="{ 'fade-out': !open }" class="fade-in">Content</div>
```

```css
.fade-in { transition: opacity 200ms; }
.fade-out { opacity: 0; }
```

### Alpine.data()

Alpine.data() registers reusable component logic. In sprae the function is the component: no registry.

```js
// Alpine
Alpine.data('counter', () => ({
  count: 0,
  increment() { this.count++ }
}))
// <div x-data="counter">

// Sprae: plain function
function counter() {
  return { count: 0, increment() { this.count++ } }
}
// <div :scope="counter()">
```

`init()` becomes `:scope.once` or `:fx.once`; `destroy()` is the cleanup returned from `:mount`:

```html
<!-- Alpine: init() and destroy() live inside Alpine.data('clock') -->
<div x-data="clock">

<!-- Sprae -->
<div :scope="clock()" :mount="el => { const id = setInterval(tick, 1000); return () => clearInterval(id) }">
```

### Alpine.bind()

Alpine.bind() bundles directives into an object for `x-bind="name"`. Sprae's spread `:="obj"` sets attributes; directives stay in the markup:

```html
<!-- Alpine -->
<button x-bind="trigger">
<!-- trigger: { ['@click']() { this.open = !this.open }, [':aria-expanded']() { return this.open } } -->

<!-- Sprae -->
<button :="{ 'aria-expanded': open, 'aria-controls': 'menu' }" :onclick="open = !open">
```

### Alpine plugins

| Alpine Plugin | Sprae Equivalent |
|---------------|------------------|
| `@alpinejs/intersect` | `:intersect="..."`, `:intersect.once="..."` |
| `@alpinejs/resize` | `:resize="..."` |
| `@alpinejs/persist` | Read/write `localStorage` in `:scope` or `:fx` |
| `@alpinejs/collapse` | `:class="{ open }"` on a `display: grid` wrapper: `grid-template-rows: 0fr`, `.open { grid-template-rows: 1fr }`, `transition: grid-template-rows`; child `min-height: 0; overflow: hidden` |
| `@alpinejs/anchor` | CSS [anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning), no JS |
| `@alpinejs/mask` | `:oninput="e => e.target.value = mask(e.target.value)"` |
| `@alpinejs/sort` | No built-in. Use a sortable library + `:mount` for init. |
| `@alpinejs/focus` | `:ref="el => el.focus()"` or native `autofocus` |

No plugin system needed — sprae expressions have full JS access, so most Alpine plugins reduce to a few lines.

## CSP (Content Security Policy)

Alpine's CSP build has limitations (no arrow functions, no nested property assignments).

Sprae with jessie supports full CSP compliance with more features:

```js
import sprae from 'sprae'
import jessie from 'subscript/jessie'

sprae.use({ compile: jessie })
```

```html
<!-- Works with jessie (fails in Alpine CSP) -->
<button :onclick="user.name = 'John'">Set Name</button>
<button :onclick="items.filter(i => i.active)">Filter</button>
```

## Example Migration

### Alpine

```html
<div x-data="{ todos: [], newTodo: '' }">
  <input x-model="newTodo" @keydown.enter="todos.push({ text: newTodo, done: false }); newTodo = ''">
  <template x-for="todo in todos" :key="todo.text">
    <div>
      <input type="checkbox" x-model="todo.done">
      <span x-text="todo.text" :class="{ 'line-through': todo.done }"></span>
    </div>
  </template>
  <span x-text="todos.filter(t => !t.done).length + ' remaining'"></span>
</div>
```

### Sprae

```html
<div :scope="{ todos: [], newTodo: '' }">
  <input :value="newTodo" :onkeydown.enter="todos.push({ text: newTodo, done: false }); newTodo = ''">
  <div :each="todo in todos">
    <input type="checkbox" :value="todo.done">
    <span :text="todo.text" :class="{ 'line-through': todo.done }"></span>
  </div>
  <span :text="todos.filter(t => !t.done).length + ' remaining'"></span>
</div>
```
