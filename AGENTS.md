
## What is Sprae

Reactive HTML templating. Bind state to DOM via `:` attributes. No build step.

## Codebase

| File | Role |
|------|------|
| `sprae.js` | Main entry. Registers all directives, modifiers, default compiler. Exports everything. |
| `core.js` | Engine: `sprae()`, `parse`, `use`, `decorate`, `frag`, `start`, symbols. |
| `signal.js` | Built-in signals implementation (preact-compatible API). |
| `store.js` | Reactive proxy store. Props → signals. Arrays, getters, methods. |
| `directive/` | One file per directive. `_.js` = default (any attribute). |
| `test/` | Tests: `test.js` entry, `directive/` per-directive, `modifier.js`, `mods.js`. |
| `types/` | Generated `.d.ts` (via `npm run types`). |
| `docs.md` | Public docs. API changes must be reflected here. |

### Commands

```sh
npm run test:base   # run tests (default signals + compiler)
npm run test        # run tests with all signal/compiler combos
npm run build       # esbuild bundle → dist/
npm run types       # generate types/ from JSDoc
```

### Exports

```js
// Main entry
import sprae, { store, signal, effect, computed, batch, untracked, start, use, throttle, debounce, dispose } from 'sprae'

// Sub-entries
import sprae from 'sprae/core'     // bare engine (no directives/modifiers registered)
import store from 'sprae/store'
import { signal, effect, computed, batch, untracked } from 'sprae/signal'
```

### Internal Symbols

| Symbol | Purpose |
|--------|---------|
| `_state` | Element's reactive state store |
| `_dispose` | Dispose function (= `Symbol.dispose`) |
| `_on` / `_off` | Enable/disable element effects |
| `_add` | Init child element (walk + apply directives) |
| `_signals` | Store's internal signals map |
| `_change` | Store's key-count tracking signal |

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
| `:on*..on*` | Event sequence | `<input :onfocus..onblur="handler" />` |

## Modifiers

Chain modifiers with `.` after directive name: `:directive.mod1.mod2-arg="expr"`. Modifiers work on any directive, not just events.

### Timing
- `.debounce[-time]` — delay until quiet. `.debounce-immediate` for leading edge.
- `.throttle[-time]` — limit rate.
- `.delay[-time]` — delay each call.
- `.once` — run once.

Time formats: `100` (ms), `100ms`, `1s`, `1m`, `raf`, `idle`, `tick`

```html
<input :oninput.debounce-300="search()" />
<input :oninput.debounce-1s="save()" />
<button :onclick.throttle-100="submit()">Submit</button>
<button :onclick.once="init()">Initialize</button>
<div :onmouseenter.delay-500="showTooltip = true">Hover</div>
```

### Event Targets
- `.window`, `.document`, `.body`, `.root`, `.parent` — attach listener to target.
- `.away` (alias `.outside`) — trigger when clicking outside element.
- `.self` — only if `e.target` is element itself.

```html
<div :onkeydown.window.escape="close()">Modal</div>
<div :onclick.away="open = false">Dropdown</div>
<div :onclick.self="handleClick()">Only direct clicks</div>
```

### Event Behavior
- `.prevent` — `preventDefault()`.
- `.stop` — `stopPropagation()`. `.stop-immediate` — `stopImmediatePropagation()`.
- `.passive`, `.capture` — listener options.

```html
<form :onsubmit.prevent="handleSubmit()">...</form>
<a :onclick.prevent="navigate()" href="/fallback">Link</a>
<div :onscroll.passive="handleScroll">...</div>
```

### Key Filters
- `.enter`, `.esc`, `.tab`, `.space`, `.delete`, `.arrow`
- `.ctrl`, `.shift`, `.alt`, `.meta`, `.cmd`
- `.digit`, `.letter`, `.char`
- Combinations: `.ctrl-s`, `.ctrl-shift-z`

```html
<input :onkeydown.enter="submit()" />
<input :onkeydown.ctrl-s.prevent="save()" />
<input :onkeydown.escape="cancel()" />
```

### Combining Modifiers
Modifiers chain naturally:
```html
<input :oninput.debounce-300.prevent="search()" />
<div :onkeydown.window.ctrl-s.prevent="save()">Global save</div>
<button :onclick.once.prevent="init()">Init</button>
```

## State Management

```js
import sprae, { store, signal, effect, computed } from 'sprae'

// Store: object → reactive proxy (props become signals)
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

## APIs

### `sprae(el?, state?) → state`
Apply directives to element. Returns reactive state.

### `start(root?, state?) → state`
Auto-init + MutationObserver for dynamically added/removed elements.

### `dispose(el)`
Destroy element's state and effects. Same as `el[Symbol.dispose]()`.

### `use(config)`
Configure signals, compiler, prefix: `use({ signal, effect, computed, batch, untracked, compile, prefix, dir })`.

### Custom Directive

```js
import { directive, parse } from 'sprae'

directive.id = (el, state, expr) => value => el.id = value
```

### Custom Modifier

```js
import { modifier } from 'sprae'

modifier.log = (fn) => (e) => (console.log(e), fn(e))
```

## Non-obvious Patterns

### Side effects with cleanup
```html
<div :fx="() => { const id = setInterval(tick, 1000); return () => clearInterval(id) }"></div>
```

### Event sequences
```html
<input :onfocus..onblur="e => (setup(), () => teardown())" />
```

### Refs in loops
```html
<li :each="item in items" :ref="itemEls"></li>
<!-- itemEls = [li, li, li, ...] -->
```

## Key Points

1. **Attribute order matters**: `:each` before `:text`, not after.
2. **Expressions can be async**: `:text="await load()"`.
3. **Self-closing**: only valid HTML self-closing tags (`<input />`, not `<div />`).
4. **Cleanup**: `el[Symbol.dispose]()` or `dispose(el)`.
5. **FOUC prevention**: `<style>[\:each],[\:if],[\:else] {visibility: hidden}</style>`. With `data-` prefix: `[data-each],[data-if],[data-else]`.
6. **`this`**: refers to current element in expressions.
7. **Prefix**: default `:`, configurable via `use({ prefix })` or `data-prefix` attribute.
8. **`data-` prefix eats all `data-*` attrs**: use spread for ambiguous names: `:="{ src: url }"`.
9. **`class` is a reserved word**: use `cls` as variable name, not `class`.
10. **Modifiers work on any directive**: `:text.once`, `:fx.debounce-300`, not just events.
