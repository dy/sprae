## Start

```html
<div id="counter" :scope="{count: 1}">
  <p :text="`Clicked ${count} times`"></p>
  <button :onclick="count++">Click me</button>
</div>

<script type="module">
  import sprae from './sprae.js'

  // init
  const state = sprae(document.getElementById('counter'), { count: 0 })

  // update state
  state.count++
</script>
```

Sprae can also be used from CDN and auto-initialized with `start` or `data-start` attribute.

```html
<!-- auto-init on `#counter` -->
<script src="https://unpkg.com/sprae" data-start="#counter"></script>
<script>
  window.sprae; // available as global standalone
</script>
```

## Directives

#### `:text="value | text => expr"`

Set text content.

```html
<span :text="user.name">Guest</span>

<!-- function form: updates as `text` changes -->
<span :text="text => text.toUpperCase()"></span>
```

#### `:html="value | html => expr"`

Set innerHTML and init nested directives.

```html
<article :html="markdown(content)"></article>

<!-- function form -->
<article :html="html => sanitize(html)"></article>
```

#### `:class="value | cls => expr"`

Set className.

```html
<div :class="{ active: selected, disabled }"></div>
<div :class="['btn', size, variant]"></div>
<div :class="isActive && 'active'"></div>

<!-- function form -->
<div :class="cls => [cls, isActive && 'active']"></div>
```

#### `:style="value | style => expr"`

Set style.

```html
<div :style="{ opacity, '--progress': percent + '%' }"></div>
<div :style="'color:' + color"></div>

<!-- function form -->
<div :style="style => ({ ...style, color })"></div>
```

#### `:value="state | val => expr"`

Two-way bind input value.

```html
<input :value="query" />

<select :value="country">
  <option :each="c in countries" :value="c.code" :text="c.name"></option>
</select>

<input type="checkbox" :value="agreed" />
<textarea :value="text"></textarea>

<!-- function form: one-way formatted output -->
<input :value="v => '$' + v.toFixed(2)" />
```

#### `:attr="value"`, `:="{ ...attrs }"`

Set attribute(s).

```html
<button :disabled="loading" :aria-busy="loading">Save</button>
<input :id:name="field" />

<!-- spread: set multiple attributes -->
<input :="{ type: 'text', placeholder, required }" />

<!-- function form -->
<input :disabled="v => v > max" />
```

#### `:if="expr"`, `:else`

Conditional rendering.

```html
<span :if="loading">Loading...</span>
<span :else :if="error" :text="error"></span>
<span :else>Ready</span>

<!-- fragment: multiple elements -->
<template :if="showDetails">
  <dt :text="term"></dt>
  <dd :text="definition"></dd>
</template>
```

#### `:each="item, idx? in expr"`

Iterate over array, object, number, or function.

```html
<!-- array -->
<li :each="item in items" :text="item.name"></li>
<li :each="item, idx in items" :text="idx + '. ' + item.name"></li>

<!-- object -->
<li :each="val, key in obj" :text="key + ': ' + val"></li>

<!-- number -->
<li :each="n in 5" :text="n"></li>

<!-- function: live range -->
<li :each="item in () => items.filter(i => i.active)"></li>

<!-- fragment: multiple elements -->
<template :each="item in items">
  <dt :text="item.term"></dt>
  <dd :text="item.def"></dd>
</template>
```

#### `:scope="state | scope => state"`

Create local state (extends parent scope).

```html
<div :scope="{ count: 0 }">
  <button :onclick="count++">+</button>
  <span :text="count + ' / ' + total"></span> <!-- `total` from parent -->
</div>

<!-- inline variables -->
<span :scope="x = 1, y = 2" :text="x + y"></span>

<!-- blank: just alias parent scope -->
<span :scope :text="parentVar"></span>

<!-- function: access current scope -->
<span :scope="scope => ({ double: scope.x * 2 })"></span>
```

#### `:fx="expr | () => ondispose"`

Run side-effect.

```html
<div :fx="visible && track('view')"></div>

<!-- return cleanup function -->
<div :fx="() => { const id = setInterval(tick, 1000); return () => clearInterval(id) }"></div>
```

#### `:ref="name | el => expr"`

Capture element reference.

```html
<canvas :ref="canvas" :fx="draw(canvas)"></canvas>

<!-- function: direct access -->
<input :ref="el => el.focus()" />

<!-- with :each: collects array -->
<li :each="item in items" :ref="itemEls" :text="item"></li>
<!-- itemEls = [li, li, li, ...] -->

<!-- mount/unmount callback -->
<div :ref="el => (onmount(el), () => onunmount(el))"></div>
```

#### `:hidden="expr"`

Toggle hidden attribute (keeps element in DOM, unlike `:if`).

```html
<div :hidden="!ready">Content</div>

<dialog :hidden="!open">Modal</dialog>
```

#### `:portal="target"`

Move element to target container.

```html
<!-- move to selector -->
<div :portal="'#modals'">Modal content</div>

<!-- move to body -->
<div :portal="document.body">Toast</div>

<!-- conditional: move when open, return when closed -->
<dialog :portal="open && '#portal-target'">...</dialog>
```

#### `:on*="handler"`, `:on*..on*="e => () => dispose"`

Attach event(s).

```html
<button :onclick="count++">Click</button>

<form :onsubmit.prevent="submit()">...</form>

<input :onkeydown.enter="send()" />

<!-- multiple events -->
<input :oninput:onchange="e => update(e)" />

<!-- sequence: init on first, cleanup on second -->
<div :onfocus..onblur="e => (open = true, () => open = false)"></div>
```




## Modifiers

#### `.debounce[-time][-immediate]`

Delay until quiet. Time: number (ms), `100ms`, `1s`, `1m`, `idle`, `raf`, `tick`. Default: microtask.

```html
<input :oninput.debounce-300="e => search(e.target.value)" />
<input :oninput.debounce-1s="save" />
<div :onscroll.debounce-raf="update">...</div>
<button :onclick.debounce-100-immediate="submit()">Submit</button>  <!-- fires first, blocks rest -->
```

#### `.throttle[-time]`

Limit rate. Time: number (ms), `100ms`, `1s`, `1m`, `idle`, `raf`, `tick`. Default: microtask.

```html
<div :onscroll.throttle-100="updatePos()">...</div>
<div :onmousemove.throttle-raf="track">...</div>
```

#### `.delay[-time]`

Delay each call. Time: number (ms), `100ms`, `1s`, `1m`, `idle`, `raf`, `tick`. Default: microtask.

```html
<div :onmouseenter.delay-500="showTooltip = true">...</div>
<div :fx.delay-idle="heavyTask()">...</div>
```

#### `.once`

Run once.

```html
<button :onclick.once="init()">Start</button>
```

#### `.window`, `.document`, `.body`, `.root`, `.parent`, `.away`, `.self`

Event target.

```html
<div :onkeydown.window.esc="close()">...</div>

<div :onclick.away="open = false">...</div>
```

#### `.passive`, `.capture`

Listener [options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options).

```html
<div :onscroll.passive="handleScroll">...</div>
```

#### `.prevent`, `.stop`, `.stop-immediate`

Prevent default or stop propagation.

```html
<a :onclick.prevent="navigate()" href="/fallback">Link</a>
```

#### `.<key>`

Filter by key: `.enter`, `.esc`, `.tab`, `.space`, `.delete`, `.arrow`, `.ctrl`, `.shift`, `.alt`, `.meta`, `.digit`, `.letter`.

```html
<input :onkeydown.enter="submit()" />

<input :onkeydown.ctrl-s.prevent="save()" />
```


## Store

Sprae uses signals-powered store for reactivity.

```js
import sprae, { store, signal, effect, computed, throttle, debounce } from 'sprae'
// or standalone
import { store } from 'sprae/store'
import { signal, effect, computed, batch, untracked } from 'sprae/signal'

const name = signal('foo');
const capname = computed(() => name.value.toUpperCase());

const state = store(
  {
    count: 0,                             // prop
    inc(){ this.count++ },                // method
    name, capname,                        // signal
    get twice(){ return this.count * 2 }, // computed
    _i: 0,                                // untracked
  },

  // globals / sandbox
  { Math }
)

sprae(element, state).      // init

state.count++               // update
name.value = 'bar'          // signal update
state._i++                  // no update

state.Math                  // == globalThis.Math
state.navigator             // == undefined
```

### Utilities

```js
import { throttle, debounce } from 'sprae'

// throttle: limit call rate
const fn = throttle(handler, 100)

// debounce: delay until quiet, optional immediate (leading edge)
const fn = debounce(handler, 100)
const fn = debounce(handler, 100, true)  // fires first, blocks rest
```




## Signals

Default signals can be replaced with any _preact-signals_ compatible alternative:

```js
import sprae, { signal, computed, effect, batch, untracked } from 'sprae';
import * as signals from '@preact/signals-core';

// switch signals to @preact/signals-core
sprae.use(signals);

signal(0);
```

Provider | Size | Feature
:---|:---|:---
[`ulive`](https://ghub.io/ulive) | 350b | Minimal implementation, basic performance, good for small states.
[`signal`](https://ghub.io/@webreflection/signal) | 633b | Class-based, better performance, good for small-medium states.
[`usignal`](https://ghub.io/usignal) | 955b | Class-based with optimizations and optional async effects.
[`@preact/signals-core`](https://ghub.io/@preact/signals-core) | 1.47kb | Best performance, good for any states, industry standard.
[`alien-signals`](https://github.com/webreflection/alien-signals) | 1.9kb | Preact-flavored [alien signals](https://github.com/stackblitz/alien-signals), presumably even better performance.
[`signal-polyfill`](https://ghub.io/signal-polyfill) | 2.5kb | Standard signals proposal. Use via [adapter](https://gist.github.com/dy/bbac687464ccf5322ab0e2fd0680dc4d).


## Evaluator

Default evaluator is fast and compact, but violates "unsafe-eval" CSP.<br/>
To make eval stricter & safer, any alternative can be used, eg. [_jessie_](https://github.com/dy/subscript#presets):

```js
import sprae from 'sprae'
import jessie from 'subscript/jessie'

sprae.use({ compile: jessie })
```

_Jessie_ is a safe JS subset supporting statements, functions and control flow:

`++ -- ! - + * / % ** && || ??`<br/>
`= < <= > >= == != === !==`<br/>
`<< >> >>> & ^ | ~ ?: . ?. [] ()=>{} in`<br/>
`= += -= *= /= %= **= &&= ||= ??= ... ,`<br/>
`[] {} "" ''`<br/>
`1 2.34 -5e6 0x7a`<br/>
`true false null undefined NaN`<br/>
`if else for while do return break continue function =>`

#### Jessie Limitations

* **`await` keyword**: Use `async () => Promise.then()` instead of `async () => await`
* **`this` binding**: Jessie doesn't preserve `this` context in compiled functions



## JSX

Sprae works with JSX via custom prefix (eg. `js-`).
Useful to offload UI logic from server components in react / nextjs, instead of switching to client components.

```jsx
// app/page.jsx - server component
export default function Page() {
  return <>
    <nav id="nav">
      <a href="/" js-class="location.pathname === '/' && 'active'">Home</a>
      <a href="/about" js-class="location.pathname === '/about' && 'active'">About</a>
    </nav>
    ...
  </>
}
```

```jsx
// layout.jsx
import Script from 'next/script'

export default function Layout({ children }) {
  return <>
    {children}
    <Script src="https://unpkg.com/sprae" data-prefix="js-" data-start />
  </>
}
```

## Custom directive

Directives are functions that receive element, state, expression, and full attribute name. Return an update function to react to expression changes.

```js
import { directive, parse } from 'sprae'

// Simple: :id="expr" → sets el.id
directive.id = (el, state, expr) => value => el.id = value

// With init: :autofocus
directive.autofocus = (el) => (el.focus(), null)

// With state access: :log="message"
directive.log = (el, state, expr) => {
  const evaluate = parse(expr)
  return () => console.log(evaluate(state))
}

// With cleanup: :timer="interval"
directive.timer = (el, state, expr) => {
  let id
  return value => {
    clearInterval(id)
    id = setInterval(() => el.textContent = Date.now(), value)
    return () => clearInterval(id) // cleanup on unmount
  }
}

// Destructor only (no updates): :track
directive.track = (el, state, expr) => {
  analytics.track(expr)
  return { [Symbol.dispose]: () => analytics.untrack(expr) }
}
```

#### Signature

```ts
(el: Element, state: object, expr: string, name: string) =>
  void |                              // no updates needed
  ((value: any) => void | (() => void)) |  // updater, optionally returns cleanup
  { [Symbol.dispose]: () => void }    // destructor only
```

## Custom modifier

Modifiers wrap event handlers or directive values. They receive the function and any dash-separated arguments.

```js
import { modifier } from 'sprae'

// :onclick.log → logs before calling handler
modifier.log = (fn) => (e) => (console.log('event:', e.type), fn(e))

// :onclick.delay-500 → delays handler by 500ms
modifier.delay = (fn, ms) => (e) => setTimeout(() => fn(e), +ms || 0)

// :text.uppercase → transforms value
modifier.uppercase = (fn) => (v) => fn(String(v).toUpperCase())
```

Usage: `<button :onclick.log.delay-200="save">Save</button>`

## Custom build

Sprae build can be tweaked for project needs / size:

```js
// sprae.custom.js
import sprae, { directive, modifier use } from 'sprae/core'
import * as signals from '@preact/signals'
import jessie from 'subscript/jessie'

import _default from 'sprae/directive/default.js'
import _if from 'sprae/directive/if.js'
import _text from 'sprae/directive/text.js'

use({
  // custom prefix, defaults to ':'
  prefix: 'data-sprae-',

  // use preact signals
  ...signals,

  // use safer compiler
  compile: jessie
})

// standard directives
directive.if = _if;
directive.text = _text;
directive.default = _default;

// custom directive :id="expression"
directive.id = (el, state, expr) => {
  // ...init
  return value => {
    // ...update
    el.id = value
  }
}

export default sprae;
```

<!--
## Micro

Micro sprae version is 2.5kb bundle with essentials:

* no multieffects `:a:b`
* no modifiers `:a.x.y`
* no sequences `:ona..onb`
* no `:each`, `:if`, `:value`
-->


## Comparison

|  | [Sprae](https://github.com/dy/sprae) | [Alpine](https://github.com/alpinejs/alpine) | [Petite-Vue](https://github.com/vuejs/petite-vue) |
|--|:--:|:--:|:--:|
| **Size** (min+gz) | ~5kb | ~16kb | ~6kb |
| **Performance** | 1.00× | ~2× | ~1.5× |
| **CSP** | Full | Limited | No |
| **Signals** | [Pluggable](#signals) | Custom store | @vue/reactivity |
| **Evaluator** | [Pluggable](#evaluator) | `new AsyncFunction` | `new Function` |
| **Sandboxing** | Yes | No | No |
| **TypeScript** | Full | Partial | No |
| **JSX/SSR** | Yes | No | No |
| **Prefix** | [Customizable](#custom-build) | `x-`, `:`, `@` | `v-`, `:`, `@` |
| **Fragments** | Yes | Yes | No |
| **Plugins** | Yes | Yes | No |
| **Modifiers** | Yes | Yes | No |
| **Maintained** | ✓ | ✓ | ✗ (2022) |

<sub>Performance from internal benchmark (create 1000 rows). Lower is better.</sub>

#### Feature Notes

- **CSP**: Sprae with [jessie](docs.md#evaluator) passes strict CSP without `unsafe-eval`. Alpine CSP build has limitations (no arrow functions, no nested property assignments). Petite-vue requires `unsafe-eval`.
- **Signals**: Sprae works with any preact-signals compatible library. Alpine uses custom reactive store. Petite-vue uses @vue/reactivity.
- **Sandboxing**: Sprae isolates expressions from global scope by default. Alpine/petite-vue expose globals.
- **Petite-vue**: Last updated 2022, essentially abandoned. Fast but lacks features and maintenance.


## Server / SSR

Sprae enables client-side interactivity in server components without converting them to client components. Add directives to server-rendered HTML and initialize sprae once:

```jsx
// app/page.jsx — remains a server component
export default function Page({ user }) {
  return <main>
    <h1>Welcome, {user.name}</h1>

    {/* interactive counter — no 'use client' needed */}
    <div id="counter" :scope="{count: 0}">
      <button :onclick="count++">Clicked <span :text="count">0</span> times</button>
    </div>
  </main>
}
```

```jsx
// app/layout.jsx
import Script from 'next/script'

export default function Layout({ children }) {
  return <html><body>
    {children}
    <Script src="https://unpkg.com/sprae" data-start />
  </body></html>
}
```

Server renders static HTML, sprae hydrates interactive parts. No client component boundary needed.

> **Tip**: Server-render default content inside elements. Directives like `:text` replace content on hydration, providing graceful fallback.


## Recipes

#### Tabs

```html
<div :scope="{ tab: 'one' }">
  <button :class="{ active: tab === 'one' }" :onclick="tab = 'one'">One</button>
  <button :class="{ active: tab === 'two' }" :onclick="tab = 'two'">Two</button>

  <div :if="tab === 'one'">Content one</div>
  <div :else :if="tab === 'two'">Content two</div>
</div>
```

#### Modal

```html
<div :scope="{ open: false }">
  <button :onclick="open = true">Open</button>

  <dialog :if="open" :onclick.self="open = false">
    <h2>Modal</h2>
    <button :onclick="open = false">Close</button>
  </dialog>
</div>
```

#### Dropdown

```html
<div :scope="{ open: false }">
  <button :onclick="open = !open" :onfocusout.delay-100="open = false">Menu ▾</button>

  <ul :if="open">
    <li><a href="#">Item 1</a></li>
    <li><a href="#">Item 2</a></li>
  </ul>
</div>
```

#### Form Validation

```html
<form :scope="{ email: '', valid: false }"
      :onsubmit.prevent="valid && submit()">
  <input type="email" :value="email"
         :oninput="e => (email = e.target.value, valid = e.target.checkValidity())" />
  <button :disabled="!valid">Submit</button>
</form>
```

#### Infinite Scroll

```html
<div :scope="{ items: [], page: 1, load }"
     :fx="load()"
     :ref="el => new IntersectionObserver(([e]) => e.isIntersecting && load()).observe(el.lastElementChild)">
  <div :each="item in items" :text="item.name"></div>
</div>

<script>
  async function load() { items.push(...await fetch(`/api?page=${page++}`).then(r => r.json())) }
</script>
```

#### Accordion

```html
<div :each="item in items" :scope="{ open: false }">
  <button :onclick="open = !open" :text="item.title"></button>
  <div :if="open" :text="item.content"></div>
</div>
```


## Hints

* To prevent [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content) add `<style>[\:each],[\:if],[\:else] {visibility: hidden}</style>`.
* Attributes order matters, eg. `<li :each="el in els" :text="el.name"></li>` is not the same as `<li :text="el.name" :each="el in els"></li>`.
* Invalid self-closing tags like `<a :text="item" />` cause error. Valid self-closing tags are: `li`, `p`, `dt`, `dd`, `option`, `tr`, `td`, `th`, `input`, `img`, `br`.
* To destroy state and detach sprae handlers, call `sprae.dispose(el)` or `element[Symbol.dispose]()`.
* `key` is not used, `:each` uses direct list mapping instead of DOM diffing.
* Expressions can be async: `<div :text="await load()"></div>`.
* Refs can be exposed under path, eg. as `<div :ref="$refs.el"></div>` in alpinejs style.

<!--
## FAQ

1. Errors handling
2. Typescript
3. Performance
-->
