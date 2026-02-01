---
---

# Migrating from Alpine to Sprae

## Quick Reference

| Alpine | Sprae |
|--------|-------|
| `x-data="{ count: 0 }"` | `:scope="{ count: 0 }"` |
| `x-text="message"` | `:text="message"` |
| `x-html="content"` | `:html="content"` |
| `x-show="open"` | `:hidden="!open"` |
| `x-if="condition"` | `:if="condition"` |
| `x-for="item in items"` | `:each="item in items"` |
| `x-bind:class="..."` | `:class="..."` |
| `x-bind:disabled="..."` | `:disabled="..."` |
| `x-on:click="..."` | `:onclick="..."` |
| `@click="..."` | `:onclick="..."` |
| `x-model="value"` | `:value="value"` |
| `x-ref="name"` | `:ref="name"` |
| `x-effect="..."` | `:fx="..."` |
| `x-teleport="#target"` | `:portal="'#target'"` |
| `x-cloak` | CSS: `[\:scope] { visibility: hidden }` |
| `x-init="..."` | `:fx.once="..."` or `:scope.once="..."` |
| `x-transition` | CSS transitions |

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
<div :scope.once="fetchData(), { data }">
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

### $dispatch

Use native events:

```html
<!-- Alpine -->
<button @click="$dispatch('notify', { message: 'Hello' })">

<!-- Sprae -->
<button :onclick="dispatchEvent(new CustomEvent('notify', { detail: { message: 'Hello' }}))">
```

### $nextTick

Use `queueMicrotask` or `setTimeout`:

```html
<!-- Alpine -->
<button @click="count++; $nextTick(() => console.log($refs.count.innerText))">

<!-- Sprae -->
<button :onclick="count++; queueMicrotask(() => console.log(countEl.innerText))">
```

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
