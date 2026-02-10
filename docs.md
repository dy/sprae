## Getting Started

Include sprae and add directives to your HTML:

```html
<script src="https://unpkg.com/sprae" data-start></script>

<ul :scope="{ items: ['Buy milk', 'Walk dog', 'Call mom'] }">
  <li :each="item in items" :text="item"></li>
</ul>
```

Or initialize manually for more control:

```html
<div id="app">
  <input :value="search" placeholder="Search..." />
  <ul>
    <li :each="item in items.filter(i => i.includes(search))" :text="item"></li>
  </ul>
</div>

<script type="module">
  import sprae from 'sprae'

  const state = sprae(document.getElementById('app'), {
    search: '',
    items: ['Apple', 'Banana', 'Cherry', 'Date']
  })

  // Update state anytime
  state.items.push('Elderberry')
</script>
```

### CDN

```html
<!-- Auto-init with data-start -->
<script src="https://unpkg.com/sprae" data-start></script>

<!-- Or manual init -->
<script type="module">
  import sprae from 'https://unpkg.com/sprae?module'
</script>
```

### Package

```bash
npm i sprae
```

```js
import sprae from 'sprae'
```



## Directives


#### `:text`

Set text content of an element.

```html
<span :text="user.name">Guest</span>
<span :text="count + ' items'"></span>

<!-- Function form: transform existing text -->
<span :text="text => text.toUpperCase()">hello</span>
```


#### `:html`

Set innerHTML (initializes directives in inserted content).

```html
<article :html="marked(content)"></article>

<!-- Function form -->
<div :html="html => DOMPurify.sanitize(html)"></div>
```


#### `:class`

Set classes from object, array, or string.

```html
<div :class="{ active: isActive, disabled }"></div>
<div :class="['btn', size, variant]"></div>
<div :class="isError && 'error'"></div>

<!-- Function form -->
<div :class="cls => [...cls, 'extra']"></div>
```


#### `:style`

Set inline styles from object or string.

```html
<div :style="{ color, opacity, '--size': size + 'px' }"></div>
<div :style="'color:' + color"></div>

<!-- Function form -->
<div :style="style => ({ ...style, color })"></div>
```


#### `:<attr>` or `:="{ ...attrs }"`

Set any attribute. Use spread form for multiple.

```html
<button :disabled="loading" :aria-busy="loading">Save</button>
<input :id:name="fieldName" />

<!-- Spread multiple attributes -->
<input :="{ type: 'email', required, placeholder }" />
```


#### `:hidden`

Toggle `hidden` attribute (element stays in DOM, unlike `:if`).

```html
<div :hidden="!ready">Loading...</div>
<dialog :hidden="!open">Modal content</dialog>
```


#### `:if` / `:else`

Conditional rendering. Elements are removed from DOM when false.

```html
<div :if="loading">Loading...</div>
<div :else :if="error" :text="error"></div>
<div :else>Ready!</div>

<!-- Multiple elements with template -->
<template :if="showDetails">
  <dt>Name</dt>
  <dd :text="name"></dd>
</template>
```


#### `:each`

Iterate over arrays, objects, numbers, or live functions.

```html
<!-- Array -->
<li :each="item in items" :text="item.name"></li>
<li :each="item, index in items" :text="index + '. ' + item.name"></li>

<!-- Object -->
<li :each="value, key in user" :text="key + ': ' + value"></li>

<!-- Range -->
<li :each="n in 5" :text="'Item ' + n"></li>

<!-- Filter (reactive) -->
<li :each="item in items.filter(i => i.active)" :text="item.name"></li>

<!-- Multiple elements with template -->
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

<!-- Inline variables -->
<span :scope="x = 1, y = 2" :text="x + y"></span>

<!-- Access parent scope -->
<div :scope="{ local: parentValue * 2 }">...</div>

<!-- Function form -->
<div :scope="scope => ({ double: scope.value * 2 })">...</div>
```


#### `:ref`

Get element reference. In `:each`, creates local reference for each node.

```html
<canvas :ref="canvas" :fx="draw(canvas)"></canvas>

<!-- Function form -->
<input :ref="el => el.focus()" />

<!-- With :each, local reference per iteration -->
<li :each="item in items" :ref="el">
  <!-- el is the current <li> in this iteration's scope -->
</li>
```

**Lifecycle** — return a cleanup function:

```html
<div :ref="el => {
  const observer = new IntersectionObserver(callback)
  observer.observe(el)
  return () => observer.disconnect()
}"></div>

<!-- Shorthand -->
<div :ref="el => (setup(el), () => cleanup(el))"></div>
```


#### `:fx`

Run side effects. Return cleanup function for disposal.

```html
<div :fx="console.log('count changed:', count)"></div>

<!-- With cleanup -->
<div :fx="() => {
  const id = setInterval(tick, 1000)
  return () => clearInterval(id)
}"></div>
```


#### `:on<event>`

Attach event listeners. Chain modifiers with `.`.

```html
<button :onclick="count++">Click</button>
<form :onsubmit.prevent="handleSubmit()">...</form>
<input :onkeydown.enter="send()" />

<!-- Multiple events -->
<input :oninput:onchange="e => validate(e)" />

<!-- Sequence: setup on first event, cleanup on second -->
<div :onfocus..onblur="e => (active = true, () => active = false)"></div>
```


#### `:value`

Two-way bind form inputs.

```html
<input :value="query" />
<textarea :value="content"></textarea>
<input type="checkbox" :value="agreed" />

<select :value="country">
  <option :each="c in countries" :value="c.code" :text="c.name"></option>
</select>

<!-- One-way with formatting -->
<input :value="v => '$' + v.toFixed(2)" />
```


#### `:portal`

Move element to another container.

```html
<div :portal="'#modals'">Modal content</div>
<div :portal="'body'">Toast notification</div>

<!-- Conditional: move when true, return when false -->
<dialog :portal="open && '#portal-target'">...</dialog>
```



## Modifiers

Modifiers transform directive behavior. Chain with `.` after directive name.


#### `.debounce`

Delay until activity stops. Accepts time value.

```html
<input :oninput.debounce="search()" />
<input :oninput.debounce-300="search()" />
<input :oninput.debounce-1s="save()" />
```

Time formats: `100` (ms), `100ms`, `1s`, `1m`, `raf`, `idle`, `tick`

Add `-immediate` for leading edge (fires first, then blocks):
```html
<button :onclick.debounce-100-immediate="submit()">Submit</button>
```


#### `.throttle`

Limit call frequency.

```html
<div :onscroll.throttle-100="updatePosition()">...</div>
<div :onmousemove.throttle-raf="trackMouse">...</div>
```


#### `.delay`

Delay each call.

```html
<div :onmouseenter.delay-500="showTooltip = true">Hover me</div>
```


#### `.once`

Run only once.

```html
<button :onclick.once="init()">Initialize</button>
<img :onload.once="loaded = true" />
```


#### `.window` `.document` `.body` `.parent` `.self`

Change event target.

```html
<div :onkeydown.window.escape="close()">...</div>
<div :onclick.self="handleClick()">Only direct clicks</div>
```


#### `.away`

Trigger when clicking outside element.

```html
<div :onclick.away="open = false">Dropdown content</div>
```


#### `.prevent` `.stop` `.stop-immediate`

Control event propagation.

```html
<a :onclick.prevent="navigate()" href="/fallback">Link</a>
<button :onclick.stop="handleClick()">Don't bubble</button>
```


#### `.passive` `.capture`

Listener options.

```html
<div :onscroll.passive="handleScroll">...</div>
```


#### Key Filters

Filter keyboard events: `.enter`, `.esc`, `.tab`, `.space`, `.delete`, `.arrow`, `.ctrl`, `.shift`, `.alt`, `.meta`, `.digit`, `.letter`

```html
<input :onkeydown.enter="submit()" />
<input :onkeydown.ctrl-s.prevent="save()" />
<input :onkeydown.shift-enter="newLine()" />
```




## Store & Signals

Sprae uses signals for fine-grained reactivity.

```js
import { signal, computed, effect, batch } from 'sprae'

// Create reactive values
const count = signal(0)
const doubled = computed(() => count.value * 2)

// React to changes
effect(() => console.log('Count:', count.value))

// Update
count.value++

// Batch multiple updates
batch(() => {
  count.value++
  count.value++
}) // Effect runs once
```


### Store

`store()` creates reactive objects from plain data:

```js
import sprae, { store } from 'sprae'

const state = store({
  count: 0,
  items: [],

  // Methods
  increment() { this.count++ },

  // Getters become computed
  get double() { return this.count * 2 },

  // Underscore prefix = untracked
  _cache: {}
})

sprae(element, state)

state.count++           // Reactive
state._cache.key = 1    // Not reactive
```



### Signals

Replace built-in signals with any preact-signals compatible library:

```js
import sprae from 'sprae'
import * as signals from '@preact/signals-core'

sprae.use(signals)
```

| Library | Size | Notes |
|---------|------|-------|
| Built-in | ~1kb | Default, good performance |
| [@preact/signals-core](https://github.com/preactjs/signals) | 1.5kb | Industry standard, best performance |
| [ulive](https://github.com/nickmccurdy/ulive) | 350b | Minimal, basic performance |
| [`signal`](https://ghub.io/@webreflection/signal) | 633b | Enhanced performance. |
| [usignal](https://github.com/nickmccurdy/usignal) | 955b | Optimized, async effects support |

<!-- [`signal-polyfill`](https://ghub.io/signal-polyfill) | 2.5kb | Proposal signals. Use via [adapter](https://gist.github.com/dy/bbac687464ccf5322ab0e2fd0680dc4d). -->
<!-- [`alien-signals`](https://github.com/WebReflection/alien-signals) | 2.67kb | Preact-flavored [alien signals](https://github.com/stackblitz/alien-signals). -->


### Utils

```js
import { throttle, debounce } from 'sprae'

const search = debounce(query => fetch('/search?q=' + query), 300)
const scroll = throttle(updatePosition, 100)
```



## Configuration


### Custom Evaluator

Default uses `new Function` (fast but requires `unsafe-eval` CSP). Use [jessie](https://github.com/nickmccurdy/subscript) for strict CSP:

```js
import sprae from 'sprae'
import jessie from 'subscript/jessie'

sprae.use({ compile: jessie })
```


### Custom Prefix

```js
sprae.use({ prefix: 'data-' })
```

```html
<div data-text="message">...</div>
```


### Custom Directive

```js
import { directive, parse } from 'sprae'

// Simple: return update function
directive.id = (el, state, expr) => value => el.id = value

// With state access
directive.log = (el, state, expr) => {
  const evaluate = parse(expr)
  return () => console.log(evaluate(state))
}

// With cleanup
directive.timer = (el, state, expr) => {
  let id
  return ms => {
    clearInterval(id)
    id = setInterval(() => el.textContent = Date.now(), ms)
    return () => clearInterval(id)
  }
}
```


### Custom Modifier

```js
import { modifier } from 'sprae'

modifier.log = (fn) => (e) => (console.log(e.type), fn(e))
modifier.uppercase = (fn) => (v) => fn(String(v).toUpperCase())
```

```html
<button :onclick.log="save">Save</button>
<span :text.uppercase="name"></span>
```




## Integration


### JSX / React / Next.js

Use custom prefix to avoid JSX attribute conflicts:

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
// page.jsx (server component)
export default function Page() {
  return <nav>
    <a href="/" x-class="location.pathname === '/' && 'active'">Home</a>
    <a href="/about" x-class="location.pathname === '/about' && 'active'">About</a>
  </nav>
}
```


### SSR / Hydration

Server renders HTML, sprae hydrates interactive parts:

```jsx
// Server component — no 'use client' needed
export default function Counter() {
  return <div x-scope="{count: 0}">
    <button x-onclick="count++">
      Clicked <span x-text="count">0</span> times
    </button>
  </div>
}
```

> **Tip**: Include default content inside elements. Directives replace it on hydration, providing graceful fallback if JS fails.


### Web Components

Sprae works with shadow DOM. Initialize in `connectedCallback`:

```js
class MyComponent extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' }).innerHTML = `
        <div :scope="{ msg: 'Hello' }">
          <span :text="msg"></span>
        </div>
      `
      sprae(this.shadowRoot)
    }
  }
}
customElements.define('my-component', MyComponent)
```

Or pass state directly:

```js
class Counter extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' }).innerHTML = `
        <button :onclick="count++">Count: <span :text="count"></span></button>
      `
      this.state = sprae(this.shadowRoot, { count: 0 })
    }
  }
}
customElements.define('my-counter', Counter)
```




## Recipes


### Tabs

```html
<div :scope="{ tab: 'one' }">
  <button :class="{ active: tab === 'one' }" :onclick="tab = 'one'">One</button>
  <button :class="{ active: tab === 'two' }" :onclick="tab = 'two'">Two</button>

  <section :if="tab === 'one'">Content One</section>
  <section :else>Content Two</section>
</div>
```


### Modal

```html
<div :scope="{ open: false }">
  <button :onclick="open = true">Open Modal</button>

  <dialog :if="open" :onclick.self="open = false" :onkeydown.window.escape="open = false">
    <h2>Title</h2>
    <p>Content</p>
    <button :onclick="open = false">Close</button>
  </dialog>
</div>
```


### Dropdown

```html
<div :scope="{ open: false }">
  <button :onclick="open = !open" :onfocusout.delay-100="open = false">
    Menu ▾
  </button>

  <ul :if="open">
    <li><a href="#">Option 1</a></li>
    <li><a href="#">Option 2</a></li>
    <li><a href="#">Option 3</a></li>
  </ul>
</div>
```


### Form Validation

```html
<form :scope="{ email: '', valid: false }" :onsubmit.prevent="valid && submit()">
  <input
    type="email"
    :value="email"
    :oninput="e => (email = e.target.value, valid = e.target.checkValidity())"
  />
  <button :disabled="!valid">Submit</button>
</form>
```


### Infinite Scroll

```html
<div :scope="{ items: [], page: 1 }"
     :fx="load()"
     :ref="el => {
       const io = new IntersectionObserver(([e]) => e.isIntersecting && load())
       io.observe(el.lastElementChild)
       return () => io.disconnect()
     }">
  <div :each="item in items" :text="item.name"></div>
  <div>Loading...</div>
</div>

<script>
  async function load() {
    const data = await fetch('/api?page=' + page++).then(r => r.json())
    items.push(...data)
  }
</script>
```


### Accordion

```html
<div :each="item, i in items" :scope="{ open: i === 0 }">
  <button :onclick="open = !open">
    <span :text="item.title"></span>
    <span :text="open ? '−' : '+'"></span>
  </button>
  <div :if="open" :text="item.content"></div>
</div>
```


### Live Search

```html
<div :scope="{ q: '', results: [] }">
  <input :value="q" :oninput.debounce-300="e => search(e.target.value)" placeholder="Search..." />

  <ul :if="results.length">
    <li :each="r in results" :text="r.title"></li>
  </ul>
  <p :else :if="q">No results</p>
</div>

<script>
  async function search(query) {
    results = query ? await fetch('/search?q=' + query).then(r => r.json()) : []
  }
</script>
```




## Hints

- **Prevent [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content)**: Add `<style>[\:each],[\:if],[\:else]{visibility:hidden}</style>`
- **Attribute order matters**: `<li :each="el in els" :text="el.name"></li>` is not the same as `<li :text="el.name" :each="el in els"></li>`, or `<input tyle="slider" :max=1 :value=0.5 />`
- **Validate self-closing tags**: `<a :text="item" />` will cause error. Valid self-closing tags are: `li`, `p`, `dt`, `dd`, `option`, `tr`, `td`, `th`, `input`, `img`, `br`.
- **Async expressions**: `<div :text="await fetchData()"></div>` works
- **Dispose**: Call `sprae.dispose(el)` or `el[Symbol.dispose]()` to cleanup
- **No `key` needed**: `:each` uses direct list mapping, not DOM diffing
- **Expose refs**: Use paths like `:ref="$refs.myEl"` for Alpine-style ref access
- **`this` refers to current element**: but it's recommended to use `:ref="element => {...}"`.


## FAQ

**Why sprae?**
: Minimal syntax, non-disruptive HTML. No build, no config. Ecosystem-agnostic (CDN, ESM, JSX). Open, configurable. Preact-signals compatible. Fast, practical and safe.

**Yet another framework?**
: Not a framework. A 5kb enhancer for existing HTML. No ecosystem lock-in, works alongside anything.

**Is it slow?**
: No. See [js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/2024/table_chrome_130.0.6723.58.html) — faster than Alpine, comparable to Vue.

**Why not Alpine.js?**
: Simpler API, 3× lighter, ESM-first, open state, signals support, prop modifiers, aliases, event chains. See [alpine.md](alpine.md) for migration guide.

**Why not vanilla JS?**
: `createElement` is wrong mantra. [Just use framework](https://justfuckingusereact.com/).

**Why not Next/React?**
: Sprae augments [JSX](#jsx--react--nextjs), which can help server components. Some find react [not worth the time](https://www.keithcirkel.co.uk/i-dont-have-time-to-learn-react/).

**Why signals?**
: It is the emerging [standard](https://github.com/tc39/proposal-signals) for reactivity. [Preact-signals](https://github.com/preactjs/signals) provide minimal API surface.

**Who cares for progressive enhancement?**
: PE is for long-lasting, low-maintenance, fail-proof, accessible, portable and SEO-optimized web.

**Is it just a toy?**
: Fun to play, comes with state sandbox. But production-ready too.

**Does it scale to complex state?**
: As far as you and CPU can handle it.

**Is new Function unsafe?**
: If your HTML comes from strangers, there is [safe evaluator](#custom-evaluator) for CSP. If you control your HTML, it's no different from inline `onclick` handlers.

**Learning curve?**
: If you know HTML and JS, you know sprae. No new syntax, no special compilation, just `:attribute="expression"`.

**Components support?**
: [Manage duplication](https://tailwindcss.com/docs/styling-with-utility-classes#managing-duplication), otherwise plop a [web component](#web-components).

**TypeScript support?**
: Yes, full types included. If you need more please [leave a request](https://github.com/dy/sprae/issues/new).

**Browser compatibility?**
: Any browser with [Proxy support](https://caniuse.com/proxy).

**Is it stable?**
: Yes, since v10.

**How old is it?**
: 3+ years old ([first commit](https://github.com/dy/sprae/commit/ee7e372fb372bde5bdd7bfd3524cdaa815793663) Nov 7, 2022).

**Will it be maintained long-term?**
: 12 versions, 1.5k+ commits and future plans.

**What's future plan?**
: Plugins, components, integration cases, generators.

**Is it backed by a company?**
: No, indie. You can [support it](https://github.com/sponsors/dy)!




## Comparison

|  | Sprae | Alpine | Petite-Vue |
|--|:--:|:--:|:--:|
| Size (min+gz) | ~5kb | ~16kb | ~6kb |
| Signals | Pluggable | Custom | @vue/reactivity |
| CSP Support | Full | Limited | No |
| TypeScript | Full | Partial | No |
| Maintained | ✓ | ✓ | ✗ |
| Event Modifiers | 10+ | Limited | Few |
| Custom Directives | Yes | Yes | Limited |
| No-build Required | ✓ | ✓ | ✓ |
| SSR-friendly | ✓ | Limited | ✓ |

**Coming from Alpine?** See [alpine](/alpine) for a step-by-step migration guide.
