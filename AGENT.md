# Sprae Agent Reference

Quick reference for AI agents building with sprae.

## What is Sprae

Reactive HTML templating. Bind state to DOM via `:` attributes. No build step.

## Core Pattern

```html
<script type="module">
  import sprae from 'sprae'
  const state = sprae(document.getElementById('app'), { count: 0 })
  state.count++  // updates DOM reactively
</script>

<div id="app">
  <span :text="count"></span>
  <button :onclick="count++">+</button>
</div>
```

## Directives

| Directive | Purpose | Example |
|-----------|---------|---------|
| `:text` | Set text content | `<span :text="name"></span>` |
| `:html` | Set innerHTML (inits nested) | `<div :html="content"></div>` |
| `:class` | Set className | `<div :class="{ active, disabled }"></div>` |
| `:style` | Set style | `<div :style="{ opacity, '--x': v }"></div>` |
| `:value` | Two-way bind input | `<input :value="query" />` |
| `:<attr>` | Set any attribute | `<button :disabled="loading">` |
| `:=""` | Spread attributes | `<input :="{ type, placeholder }" />` |
| `:if` | Conditional render | `<span :if="loading">...</span>` |
| `:else` | Else branch | `<span :else>Ready</span>` |
| `:each` | Iterate | `<li :each="item in items" :text="item"></li>` |
| `:scope` | Local state | `<div :scope="{ open: false }">` |
| `:fx` | Side effect | `<div :fx="visible && track()"></div>` |
| `:ref` | Capture element | `<canvas :ref="canvas"></canvas>` |
| `:hidden` | Toggle hidden (keeps in DOM) | `<div :hidden="!ready">` |
| `:portal` | Move to container | `<div :portal="'#modals'">` |
| `:on*` | Event handler | `<button :onclick="submit()">` |

## Modifiers

Apply to any directive: `:directive.mod1.mod2="expr"`

### Timing
- `.debounce[-time]` - delay until quiet (default: microtask)
- `.throttle[-time]` - limit rate (default: microtask)
- `.delay[-time]` - delay each call
- `.once` - run once

Time formats: `100` (ms), `100ms`, `1s`, `1m`, `raf`, `idle`, `tick`

### Event Targets
- `.window`, `.document`, `.body`, `.root`, `.parent` - attach to target
- `.away` - trigger when clicking outside element
- `.self` - only if target is element itself

### Event Behavior
- `.prevent` - preventDefault()
- `.stop` - stopPropagation()
- `.stop-immediate` - stopImmediatePropagation()
- `.passive`, `.capture` - listener options

### Key Filters
- `.enter`, `.esc`, `.tab`, `.space`, `.delete`
- `.ctrl`, `.shift`, `.alt`, `.meta`
- `.ctrl-s`, `.ctrl-shift-z` - combinations

## State Management

```js
import sprae, { store, signal, effect, computed } from 'sprae'

// Store wraps object with reactive signals
const state = store({
  count: 0,
  get double() { return this.count * 2 },  // computed
  inc() { this.count++ },                   // method
  _private: 0                               // untracked (underscore prefix)
})

// Direct signals
const name = signal('foo')
effect(() => console.log(name.value))
name.value = 'bar'  // triggers effect
```

## Common Patterns

### Conditional rendering
```html
<span :if="loading">Loading...</span>
<span :else :if="error" :text="error"></span>
<span :else>Ready</span>
```

### Lists with index
```html
<li :each="item, i in items" :text="`${i}. ${item.name}`"></li>
```

### Two-way binding
```html
<input :value="search" />
<select :value="country">
  <option :each="c in countries" :value="c.code" :text="c.name"></option>
</select>
```

### Local component state
```html
<div :scope="{ open: false }">
  <button :onclick="open = !open">Toggle</button>
  <div :hidden="!open">Content</div>
</div>
```

### Side effects with cleanup
```html
<div :fx="() => { const id = setInterval(tick, 1000); return () => clearInterval(id) }"></div>
```

### Event sequences
```html
<!-- init on focus, cleanup on blur -->
<input :onfocus..onblur="e => (setup(), () => teardown())" />
```

### Refs in loops
```html
<li :each="item in items" :ref="itemEls"></li>
<!-- itemEls = [li, li, li, ...] -->
```

### Debounced search
```html
<input :oninput.debounce-300="e => search(e.target.value)" />
```

### Keyboard shortcuts
```html
<div :onkeydown.window.ctrl-s.prevent="save()">
```

### Modals/Toasts
```html
<div :portal="open && '#modal-container'">Modal content</div>
```

## Auto-initialization

```html
<!-- CDN with auto-init -->
<script src="https://unpkg.com/sprae" data-start="#app"></script>
<script src="https://unpkg.com/sprae" data-start></script> <!-- inits document.body -->
```

## JSX / Server Components

```jsx
// Use custom prefix for JSX compatibility
<nav js-class="{ active: isActive }">...</nav>

// In layout
<Script src="https://unpkg.com/sprae" data-prefix="js-" data-start />
```

## Custom Directives

```js
sprae.directive.id = (el, state, expr) => {
  // init
  return value => {
    // update
    el.id = value
  }
}
```

## Key Points

1. **Attribute order matters**: `:each` before `:text`, not after
2. **Expressions can be async**: `:text="await load()"`
3. **Self-closing**: only valid HTML self-closing tags work (`<input />`, not `<div />`)
4. **Cleanup**: `element[Symbol.dispose]()` destroys state
5. **FOUC prevention**: add `<style>[\:each],[\:if],[\:else] {visibility: hidden}</style>`
6. **this**: refers to current element in expressions
