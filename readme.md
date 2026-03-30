# [∴](https://dy.github.io/sprae) sprae [![tests](https://github.com/dy/sprae/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprae/actions/workflows/node.js.yml) ![size](https://img.shields.io/badge/size-~5kb-white) [![npm](https://img.shields.io/npm/v/sprae?color=white)](https://www.npmjs.com/package/sprae)

> Microhydration for HTML/JSX tree.

Open & minimal PE framework with signals-based reactivity.


## Usage

```html
<!-- Day/Night switch -->
<div id="app" :scope="{ isDark: false }">
  <button :onclick="isDark = !isDark">
    <span :text="isDark ? '🌙' : '☀️'"></span>
    </button>
  <div :class="isDark ? 'dark' : 'light'">Welcome to Spræ!</div>
</div>

<style>
  .light { background: #fff; color: #000; }
  .dark { background: #333; color: #fff; }
</style>

<!-- default -->
<script type="module" src="//unpkg.com/sprae"></script>
```

Or with module:

```js
import sprae from 'sprae'

const state = sprae(document.querySelector('#app'), { count: 0 })
state.count++ // updates DOM
```

Sprae evaluates `:`-attributes and evaporates them, returning reactive state.


## Directives


#### `:text`

Set text content.

```html
<span :text="user.name">Guest</span>
<span :text="count + ' items'"></span>
<span :text="text => text.toUpperCase()">hello</span>  <!-- function form -->
```


#### `:html`

Set innerHTML. Initializes directives in inserted content.

```html
<article :html="marked(content)"></article>

<!-- template form -->
<section :html="document.querySelector('#card')"></section>

<!-- function form -->
<div :html="html => DOMPurify.sanitize(html)"></div>
```


#### `:class`

Set classes from object, array, or string.

```html
<div :class="{ active: isActive, disabled }"></div>
<div :class="['btn', size, variant]"></div>
<div :class="isError && 'error'"></div>

<!-- function form: extend existing -->
<div :class="cls => [...cls, 'extra']"></div>
```


#### `:style`

Set inline styles from object or string. Supports CSS variables.

```html
<div :style="{ color, opacity, '--size': size + 'px' }"></div>
<div :style="'color:' + color"></div>

<!-- function form -->
<div :style="style => ({ ...style, color })"></div>
```


#### `:<attr>`, `:="{ ...attrs }"`

Set any attribute. Spread form for multiple.

```html
<button :disabled="loading" :aria-busy="loading">Save</button>
<input :id:name="fieldName" />
<input :="{ type: 'email', required, placeholder }" />
```


#### `:if` / `:else`

Conditional rendering. Removes element from DOM when false.

```html
<div :if="loading">Loading...</div>
<div :else :if="error" :text="error"></div>
<div :else>Ready!</div>

<!-- fragment -->
<template :if="showDetails">
  <dt>Name</dt>
  <dd :text="name"></dd>
</template>
```


#### `:each`

Iterate arrays, objects, numbers.

```html
<li :each="item in items" :text="item.name"></li>
<li :each="item, index in items" :text="index + '. ' + item.name"></li>
<li :each="value, key in object" :text="key + ': ' + value"></li>
<li :each="n in 5" :text="'Item ' + n"></li>

<!-- filter (reactive) -->
<li :each="item in items.filter(i => i.active)" :text="item.name"></li>

<!-- fragment -->
<template :each="item in items">
  <dt :text="item.term"></dt>
  <dd :text="item.definition"></dd>
</template>
```


#### `:scope`

Create local reactive state. Inherits from parent scope.

```html
<div :scope="{ count: 0, open: false }">
  <button :onclick="count++">Count: <span :text="count"></span></button>
</div>

<!-- inline variables -->
<span :scope="x = 1, y = 2" :text="x + y"></span>

<!-- access parent scope -->
<div :scope="{ local: parentValue * 2 }">...</div>

<!-- function form -->
<div :scope="scope => ({ double: scope.value * 2 })">...</div>
```


#### `:value`

Bind state to form input (state → DOM).

```html
<input :value="query" />
<textarea :value="content"></textarea>
<input type="checkbox" :value="agreed" />
<select :value="country">
  <option :each="c in countries" :value="c.code" :text="c.name"></option>
</select>
```


#### `:change`

Write-back from input to state (DOM → state). Handles type coercion.

```html
<input :value="query" :change="v => query = v" />
<input type="number" :value="count" :change="v => count = v" />
<input :value="search" :change.debounce-300="v => search = v" />
```


#### `:fx`

Run side effect. Return cleanup function for disposal.

```html
<div :fx="console.log('count changed:', count)"></div>
<div :fx="() => {
  const id = setInterval(tick, 1000)
  return () => clearInterval(id)
}"></div>
```


#### `:ref`

Store element reference in state. Function form calls with element.

```html
<canvas :ref="canvas" :fx="draw(canvas)"></canvas>
<input :ref="el => el.focus()" />

<!-- path reference -->
<input :ref="$refs.email" />
```

> For lifecycle hooks with setup/cleanup, use [`:mount`](#mount).


#### `:on<event>`

Attach event listeners. Chain modifiers with `.`.

```html
<button :onclick="count++">Click</button>
<form :onsubmit.prevent="handleSubmit()">...</form>
<input :onkeydown.enter="send()" />
<input :oninput:onchange="e => validate(e)" />

<!-- sequence: setup on first event, cleanup on second -->
<div :onfocus..onblur="e => (active = true, () => active = false)"></div>
```


#### `:hidden`

Toggle `hidden` attribute. Unlike `:if`, keeps element in DOM.

```html
<p :hidden="!ready">Loading...</p>
```


#### `:mount`

Lifecycle hook — runs once on connect. Not reactive. Can return cleanup.

```html
<canvas :mount="el => initChart(el)"></canvas>
<div :mount="el => {
  const timer = setInterval(tick, 1000)
  return () => clearInterval(timer)
}"></div>
```


#### `:intersect`

IntersectionObserver wrapper. Fires on enter, or receive entry for full control.

```html
<img :intersect.once="loadImage()" :src="placeholder" />
<div :intersect="entry => visible = entry.isIntersecting"></div>
```


#### `:resize`

ResizeObserver wrapper.

```html
<div :resize="({width}) => cols = Math.floor(width / 200)"></div>
```


#### `:portal`

Move element to another container.

```html
<div :portal="'#modals'">Modal content</div>
<dialog :portal="open && '#portal-target'">...</dialog>
```



## Modifiers

Chain with `.` after directive name.

#### Timing

```html
<input :oninput.debounce-300="search()" />       <!-- delay until activity stops -->
<div :onscroll.throttle-100="update()">...</div>  <!-- limit frequency -->
<div :onmouseenter.delay-500="show = true" />     <!-- delay each call -->
<button :onclick.once="init()">Initialize</button>
```

Time formats: `100` (ms), `100ms`, `1s`, `1m`, `raf`, `idle`, `tick`.
Add `-immediate` to debounce for leading edge.

#### Event targets

```html
<div :onkeydown.window.escape="close()">...</div>
<div :onclick.self="only direct clicks"></div>
<div :onclick.away="open = false">Click outside to close</div>
```

`.window` `.document` `.body` `.root` `.parent` `.self` `.away`

#### Event control

```html
<a :onclick.prevent="navigate()" href="/fallback">Link</a>
<button :onclick.stop="handleClick()">Don't bubble</button>
```

`.prevent` `.stop` `.stop-immediate` `.passive` `.capture`

#### Key filters

Filter keyboard events by key or combination.

* `.ctrl`, `.shift`, `.alt`, `.meta` — modifier keys
* `.enter`, `.esc`, `.tab`, `.space` — common keys
* `.delete` — delete or backspace
* `.arrow` — any arrow key
* `.digit` — 0-9
* `.letter` — any unicode letter
* `.char` — any non-space character
* `.ctrl-<key>`, `.alt-<key>`, `.meta-<key>`, `.shift-<key>` — combinations

```html
<input :onkeydown.enter="submit()" />
<input :onkeydown.ctrl-s.prevent="save()" />
<input :onkeydown.shift-enter="newLine()" />
<input :onkeydown.meta-x="cut()" />
```



## Signals

Sprae uses signals for reactivity.

```js
import { signal, computed, effect, batch } from 'sprae'

const count = signal(0)
const doubled = computed(() => count.value * 2)
effect(() => console.log('Count:', count.value))
count.value++
```

### Store

`store()` creates reactive objects from plain data. Getters become computed, `_`-prefixed properties are untracked.

```js
import sprae, { store } from 'sprae'

const state = store({
  count: 0,
  items: [],
  increment() { this.count++ },
  get double() { return this.count * 2 },
  _cache: {}  // untracked
})

sprae(element, state)
state.count++       // reactive
state._cache.x = 1  // not reactive
```

### Alternative signals

Replace built-in signals with any preact-signals compatible library:

```html
<script src="//unpkg.com/sprae/dist/sprae-preact.umd.js" data-start></script>
```

```js
import sprae from 'sprae'
import * as signals from '@preact/signals-core'
sprae.use(signals)
```

| Library | Size | Notes |
|---------|------|-------|
| Built-in | ~300b | Default |
| [@preact/signals-core](https://github.com/preactjs/signals) | 1.5kb | Industry standard, best performance |
| [ulive](https://github.com/kethan/ulive) | 350b | Minimal |
| [signal](https://ghub.io/@webreflection/signal) | 633b | Enhanced performance. |
| [usignal](https://github.com/@webreflection/usignal) | 955b | Async effects support |


## Configuration

```js
import sprae, { directive, parse, modifier } from 'sprae'
import jessie from 'subscript/jessie'

sprae.use({
  // CSP-safe evaluator: <script src="//unpkg.com/sprae/dist/sprae-csp.umd.js" data-start></script>
  // or define manually
  compile: jessie,

  // custom prefix: <div data-text="message">...</div>
  prefix: 'data-'
})

// Custom directive
directive.id = (el, state, expr) => value => el.id = value

directive.timer = (el, state, expr) => {
  let id
  return ms => {
    clearInterval(id)
    id = setInterval(() => el.textContent = Date.now(), ms)
    return () => clearInterval(id)
  }
}

// Custom modifier
modifier.log = (fn) => (e) => (console.log(e.type), fn(e))
```


## Integration

### JSX / Next.js

Avoids `'use client'` — keep server components, let sprae handle client-side interactivity:

```jsx
// layout.jsx
import Script from 'next/script'
export default function Layout({ children }) {
  return <>
    {children}
    <Script src="https://unpkg.com/sprae" data-prefix="x-" data-start />
  </>
}
```

```jsx
// page.jsx — server component, no 'use client' needed
export default function Page() {
  return <div x-scope="{count: 0}">
    <button x-onclick="count++">
      Clicked <span x-text="count">0</span> times
    </button>
  </div>
}
```

### Markdown / Static Sites

Markdown processors strip `:` attributes, so use `data-` prefix:

```html
<script src="https://unpkg.com/sprae" data-prefix="data-" data-start></script>
```

```md
<div data-scope="{ count: 0 }">
  <button data-onclick="count++">
    Clicked <span data-text="count">0</span> times
  </button>
</div>
```

Works with Jekyll, Hugo, Eleventy, Astro. Sprae site itself is built this way.


### Server Templates

Same pattern works with PHP, Django, Rails, Jinja — server renders HTML, sprae handles client interactivity:

```html
<script src="https://unpkg.com/sprae" data-start></script>
<div :scope="{ count: <?= $initial ?> }">
  <button :onclick="count++">Count: <span :text="count"></span></button>
</div>
```

### Web Components

Sprae treats custom elements as boundaries — directives on the element set props, but sprae does not descend into children. The component owns its DOM.

```html
<user-card :each="u in users" :name="u.name" :avatar="u.avatar"></user-card>
```

Works with [define-element](https://github.com/dy/define-element), Lit, or any CE library.



## Hints

* Prevent [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content): `<style>[\:each],[\:if],[\:else]{visibility:hidden}</style>`
* Attribute order matters: `:each` before `:text`, not after.
* Async expressions work: `<div :text="await fetchData()"></div>`
* Dispose: `sprae.dispose(el)` or `el[Symbol.dispose]()`
* No `key` needed — `:each` auto-keys object items by identity; primitives use positional mapping.
* `this` refers to current element, but prefer `:ref` or `:mount` for element access.
* Properties prefixed with `_` are untracked.


## FAQ

**What is sprae?**<br>
~5kb script that adds reactivity to HTML via `:attribute="expression"`. No build step, no new syntax.

**Learning curve?**<br>
If you know HTML and JS, you know sprae. Just `:attribute="expression"`.

**How does it compare to Alpine?**<br>
3x lighter, pluggable signals, prop modifiers, event chains. Faster in [benchmarks](https://krausest.github.io/js-framework-benchmark/).

**How does it compare to React/Vue?**<br>
No build step, no virtual DOM. Can inject into [JSX](#jsx--nextjs) for server components without framework overhead.

**Why signals?**<br>
Signals are the emerging [standard](https://github.com/tc39/proposal-signals) for reactivity. Pluggable — first to support native signals when browsers ship.

**Is new Function unsafe?**<br>
No more than inline `onclick` handlers. For strict CSP, use the [safe evaluator](#csp-safe-evaluator).

**Components?**<br>
Use [define-element](https://github.com/dy/define-element) for declarative web components, or any CE library. For simpler cases, [manage duplication](https://tailwindcss.com/docs/styling-with-utility-classes#managing-duplication) with templates/includes.

**TypeScript?**<br>
Full types included.

**Browser support?**<br>
Any browser with [Proxy](https://caniuse.com/proxy) (all modern browsers, no IE).

**Does it scale?**<br>
State is plain reactive objects — scales as far as your data model does. Use [store](#store) with computed getters and methods for complex apps.

**Is it production-ready?**<br>
It is used by a few SaaS systems and landing pages of big guys.

**Is it backed by a company?**<br>
Indie project. [Support it](https://github.com/sponsors/dy).


## Used by

[settings-panel](https://dy.github.io/settings-panel) · [wavearea](https://dy.github.io/wavearea) · [watr](https://dy.github.io/watr/play)

## Refs

<sup>[alpine](https://github.com/alpinejs/alpine) · [petite-vue](https://github.com/vuejs/petite-vue) · [lucia](https://github.com/aidenybai/lucia) · [nuejs](https://github.com/nuejs/nuejs) · [hmpl](https://github.com/hmpl-language/hmpl) · [unpoly](https://unpoly.com/up.link) · [dagger](https://github.com/dagger8224/dagger.js)</sup>

<p align="center"><a href="https://krishnized.github.io/license">ॐ</a></p>
