# [∴](https://dy.github.io/sprae) sprae [![tests](https://github.com/dy/sprae/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprae/actions/workflows/node.js.yml) ![size](https://img.shields.io/badge/size-~8kb-white) ![deps](https://img.shields.io/badge/deps-0-white) [![npm](https://img.shields.io/npm/v/sprae?color=white)](https://www.npmjs.com/package/sprae) [![license](https://img.shields.io/npm/l/sprae?color=white)](./license)

> Reactive sprinkles for HTML/JSX.

**DOM microhydration** — add reactivity to the HTML via `:attributes` — no build step, no new syntax. [Signals](https://github.com/tc39/proposal-signals)-based and pluggable, with a full-JS [CSP build](https://dy.github.io/sprae/csp) for strict environments and browser extensions. Use it for server-rendered pages, static sites, or prototypes — anywhere a full framework is overkill, with any backend and +JSX.

[website](https://dy.github.io/sprae) | [bench](https://krausest.github.io/js-framework-benchmark/)


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

With an ES module:

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

Run a non-reactive lifecycle hook once when the element connects. The hook can return a cleanup function.

```html
<canvas :mount="el => initChart(el)"></canvas>
<div :mount="el => {
  const timer = setInterval(tick, 1000)
  return () => clearInterval(timer)
}"></div>
```


#### `:intersect`

Run an expression when the element enters the viewport. A function receives the observer entry.

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

* `.ctrl`, `.shift`, `.alt`, `.meta`: modifier keys
* `.enter`, `.esc`, `.tab`, `.space`: common keys
* `.delete`: delete or backspace
* `.arrow`: any arrow key
* `.digit`: 0-9
* `.letter`: any Unicode letter
* `.char`: any non-space character
* `.ctrl-<key>`, `.alt-<key>`, `.meta-<key>`, `.shift-<key>`: combinations

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

`store()` creates reactive objects from plain data. Getters become computed values. Properties prefixed with `_` are untracked.

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

Replace the built-in signals with any Preact Signals-compatible library:

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
| [@preact/signals-core](https://github.com/preactjs/signals) | 1.5kb | Compatibility target |
| [ulive](https://github.com/kethan/ulive) | 350b | Smallest |
| [signal](https://ghub.io/@webreflection/signal) | 633b | Minimal |
| [usignal](https://github.com/@webreflection/usignal) | 955b | Async effects |


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

Keep server components and let sprae handle client-side interactivity without `'use client'`:

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
// page.jsx: server component without 'use client'
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

Sprae works with Jekyll, Hugo, Eleventy, and Astro. Its own site uses this setup.


### Server Templates

PHP, Django, Rails, and Jinja can render the HTML while sprae handles client-side interactivity:

```html
<script src="https://unpkg.com/sprae" data-start></script>
<div :scope="{ count: <?= $initial ?> }">
  <button :onclick="count++">Count: <span :text="count"></span></button>
</div>
```

### Web Components

Sprae treats a custom element as a boundary. Directives set its props, but sprae does not descend into its children. The component owns its DOM.

```html
<user-card :each="u in users" :name="u.name" :avatar="u.avatar"></user-card>
```

Works with [define-element](https://github.com/dy/define-element), Lit, or any CE library.



## Hints

* Prevent [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content): `<style>[\:each],[\:if],[\:else]{visibility:hidden}</style>`
* Attribute order matters: `:each` before `:text`, not after.
* Async expressions work: `<div :text="await fetchData()"></div>`
* Dispose: `sprae.dispose(el)` or `el[Symbol.dispose]()`
* `:each` keys object items by identity and primitives by position; no `key` is needed.
* `this` refers to current element, but prefer `:ref` or `:mount` for element access.
* Properties prefixed with `_` are untracked.


## FAQ

**What is sprae?**<br>
Sprae adds reactivity to HTML through `:attribute="expression"`. It is ~8kb and needs no build step.

**Learning curve?**<br>
You write JavaScript expressions in HTML attributes: `:attribute="expression"`.

**How does it compare to Alpine?**<br>
Sprae is ~1.5× smaller over the wire, ~2.3× faster, and uses ~3× less runtime memory in [this comparison](https://dy.github.io/sprae/compare). It has pluggable signals, built-in modifiers, event chains, and a full-JS [CSP build](https://dy.github.io/sprae/csp).

**How does it compare to React/Vue?**<br>
Sprae needs no build step or virtual DOM. In [JSX](#jsx--nextjs), it adds client-side interactivity without `'use client'`.

**Why signals?**<br>
Signals have a [TC39 proposal](https://github.com/tc39/proposal-signals), and sprae accepts any Preact Signals-compatible implementation.

**Is `new Function` unsafe?**<br>
`new Function` executes directive expressions as JavaScript. Use the default build only with trusted markup; under strict CSP, use the [CSP build](https://dy.github.io/sprae/csp).

**Components?**<br>
Use [define-element](https://github.com/dy/define-element) for declarative web components, or any custom-element library. For simpler cases, [manage duplication](https://tailwindcss.com/docs/styling-with-utility-classes#managing-duplication) with templates or includes.

**TypeScript?**<br>
Full types included.

**Browser support?**<br>
Any browser with [Proxy](https://caniuse.com/proxy) (all modern browsers, no IE).

**Does it scale?**<br>
State uses plain reactive objects. For complex apps, use [store](#store) with computed getters and methods.

**Is it production-ready?**<br>
Sprae has 3+ years of releases across ~200 [npm versions](https://www.npmjs.com/package/sprae?activeTab=versions). It has no dependencies or open issues, and its tests include the CSP build.

**Is it backed by a company?**<br>
Indie project. [Support it](https://github.com/sponsors/dy).


## Used by

[settings-panel](https://dy.github.io/settings-panel), [wavearea](https://dy.github.io/wavearea), [watr](https://dy.github.io/watr/play)

## Refs

<sup>[alpine](https://github.com/alpinejs/alpine), [petite-vue](https://github.com/vuejs/petite-vue), [lucia](https://github.com/aidenybai/lucia), [nuejs](https://github.com/nuejs/nuejs), [hmpl](https://github.com/hmpl-language/hmpl), [unpoly](https://unpoly.com/up.link), [dagger](https://github.com/dagger8224/dagger.js)</sup>

<p align="center"><a href="https://krishnized.github.io/license">ॐ</a></p>
