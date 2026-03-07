# Componentization

## Problem

Sprae has no component abstraction. Apps grow, markup duplicates. Need composability without framework overhead.

## What Already Works

### Jekyll includes + `:scope`

Server-side includes handle HTML reuse. `:scope` handles state isolation. Parent scope inheritance handles prop passing.

```html
<!-- _includes/counter.html -->
<div :scope="{ count: count ?? 0 }">
  <button :onclick="count++">Count: <span :text="count"></span></button>
</div>
```

```html
<!-- page.html -->
<div :scope="{ count: 5 }">
  {% include counter.html %}
</div>

<!-- another instance, different initial state -->
<div :scope="{ count: 0 }">
  {% include counter.html %}
</div>
```

**How it works**: `:scope="{ count: count ?? 0 }"` in the include creates a local `count` signal. If parent scope has `count`, it uses that value as initial. Otherwise defaults to 0. The local `count` shadows the parent — writes stay local.

### Jekyll params (static props)

For compile-time values, Jekyll include params bake values directly:

```html
{% include counter.html initial=5 label="Clicks" %}
```

```html
<!-- _includes/counter.html -->
<div :scope="{ count: {{ include.initial | default: 0 }} }">
  <button :onclick="count++">{{ include.label | default: "Count" }}: <span :text="count"></span></button>
</div>
```

**Limitation**: Jekyll params are static — they produce fixed HTML before sprae runs. No reactivity across instances.

### Factory functions (shared logic)

For reusable JS behavior across multiple instances:

```html
<script>
function counter(initial = 0, step = 1) {
  return {
    count: initial,
    step,
    increment() { this.count += this.step },
    get label() { return `Count: ${this.count}` }
  }
}
</script>

<div :scope="counter(5, 2)">
  {% include counter.html %}
</div>
<div :scope="counter(0)">
  {% include counter.html %}
</div>
```

```html
<!-- _includes/counter.html (markup only, no state init) -->
<button :onclick="increment()"><span :text="label"></span></button>
```

**This separates concerns**: factory owns behavior, include owns markup. Multiple includes can share the same factory.

### Client-side template reuse

Without server includes, `<template>` + `:html` works:

```html
<template id="counter-tpl">
  <button :onclick="count++">Count: <span :text="count"></span></button>
</template>

<div :scope="{ count: 0 }" :html="document.querySelector('#counter-tpl').innerHTML"></div>
<div :scope="{ count: 5 }" :html="document.querySelector('#counter-tpl').innerHTML"></div>
```

`:html` injects and spraes the content. Each instance gets its own scope.

### Web Components

Already documented in docs.md. Full isolation via shadow DOM:

```js
class MyCounter extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <button :onclick="count++">Count: <span :text="count"></span></button>
    `
    this.state = sprae(this.shadowRoot, { count: 0 })
  }
}
customElements.define('my-counter', MyCounter)
```


## Prop Passing Patterns

### 1. Implicit (scope inheritance)

Child reads parent vars by name. Simplest, most natural.

```html
<div :scope="{ color: 'red', size: 10 }">
  {% include badge.html %}
</div>
```

```html
<!-- _includes/badge.html -->
<span :scope="{}" :style="{ color, fontSize: size + 'px' }">●</span>
```

No explicit prop declaration. `color` and `size` resolve from parent scope via prototype chain.

- **Pro**: zero boilerplate, just use the name
- **Con**: ambient — child reads ANY parent var, accidental coupling possible

### 2. Explicit defaults (recommended for includes)

Child declares its interface via `??` defaults:

```html
<!-- _includes/badge.html -->
<span :scope="{ color: color ?? 'gray', size: size ?? 12 }"
      :style="{ color, fontSize: size + 'px' }">●</span>
```

- **Pro**: self-documenting — you see what props the include expects
- **Con**: still reads parent implicitly

### 3. Namespaced (collision-safe)

Pass a single config object to avoid name collisions:

```html
<div :scope="{ badge: { color: 'red', size: 10 } }">
  {% include badge.html %}
</div>
```

```html
<!-- _includes/badge.html -->
<span :scope="{ color: badge.color, size: badge.size }"
      :style="{ color, fontSize: size + 'px' }">●</span>
```

- **Pro**: explicit, no accidental reads
- **Con**: verbose

### 4. Factory (cleanest isolation)

Factory function returns exactly what the component needs:

```html
<div :scope="badgeState('red', 10)">
  {% include badge.html %}
</div>
```

The `:scope` expression can access parent vars, but the resulting scope only contains what the factory returns. Children of the include see only factory-provided state.

- **Pro**: true isolation — children can't accidentally read parent, interface is a function signature
- **Con**: requires JS, two files to maintain


## Communication Patterns

### Child → Parent via callbacks

Pass a function down:

```html
<div :scope="{ items: [], onAdd(item) { items.push(item) } }">
  {% include item-form.html %}
  <ul><li :each="item in items" :text="item"></li></ul>
</div>
```

```html
<!-- _includes/item-form.html -->
<div :scope="{ value: '' }">
  <input :value="value" />
  <button :onclick="onAdd(value); value = ''">Add</button>
</div>
```

`onAdd` resolves from parent scope. Clean, explicit.

### Sibling communication via shared state

```html
<div :scope="{ selected: null }">
  {% include sidebar.html %}
  {% include detail.html %}
</div>
```

Both includes read/write `selected` from the shared parent scope.


## What's Missing

### 1. No client-side include mechanism

Without Jekyll/SSI, reusing HTML fragments requires either:
- `<template>` + `:html` (manual, verbose selector)
- Web Components (heavy, shadow DOM isolation may be unwanted)
- Copy-paste (not DRY)

A `:include` directive could fill this gap:

```html
<template id="counter">
  <button :onclick="count++"><span :text="count"></span></button>
</template>

<div :scope="{ count: 0 }" :include="'#counter'"></div>
```

But `:html` with a selector expression already approximates this. The question is whether the use case is common enough to warrant a dedicated directive.

### 2. No slot/transclusion

Can't pass child content into an include's designated slot:

```html
<!-- Desired but impossible -->
<div :scope="{ open: false }">
  {% include modal.html %}
    <p>This content should go inside the modal body</p>
  {% endinclude %}  <!-- not a thing -->
</div>
```

**Workaround**: pass HTML via state or use `:html`:

```html
<div :scope="{ open: false, body: '<p>Modal content</p>' }">
  {% include modal.html %}
</div>
```

Or structure includes as wrappers:

```html
{% include modal-open.html %}
  <p>Modal content</p>
{% include modal-close.html %}
```

Both are awkward. Slots would require something like declarative custom elements or a new directive.

### 3. No registration/lookup

Alpine has `Alpine.data('name', factory)`. Sprae has no equivalent to register reusable behaviors by name and reference them from markup.

Possible:

```js
sprae.component('counter', (el, props) => {
  el.innerHTML = `<button :onclick="count++"><span :text="count"></span></button>`
  return { count: props.count ?? 0 }
})
```

```html
<div :component="'counter'" :scope="{ count: 5 }"></div>
```

But this duplicates what factory functions + includes already do. And the JS-defined-template pattern goes against sprae's HTML-first philosophy.


## Recommendation

**For Jekyll/SSI projects (primary case):**

Convention: **factory function + include**.

```
_includes/
  counter.html       ← markup
js/
  components.js      ← factory functions
```

```js
// js/components.js
function counter(initial = 0) {
  return { count: initial, increment() { this.count++ } }
}

function todoList(items = []) {
  return {
    items, value: '',
    add() { this.items.push(this.value); this.value = '' },
    remove(i) { this.items.splice(i, 1) }
  }
}
```

```html
<!-- usage -->
<div :scope="counter(5)">{% include counter.html %}</div>
<div :scope="todoList(['Buy milk'])">{% include todo.html %}</div>
```

This gives:
- **Reuse**: include for markup, function for logic
- **Isolation**: factory returns exactly what component needs
- **Props**: function arguments
- **State**: local via `:scope`
- **Communication**: callbacks via parent scope
- **No new API**: works today

**For client-only (no server includes):**

Web Components for true isolation, or `<template>` + `:html` + `:scope` for lightweight reuse.

**What NOT to build (yet):**
- Component registration system (YAGNI — factory functions + includes cover it)
- Slot/transclusion directive (too complex for the benefit; structure includes differently)
- `:include` directive (`:html` with selector is close enough)

Revisit if/when the pattern breaks down at scale.
