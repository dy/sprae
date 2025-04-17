# ∴ spræ [![tests](https://github.com/dy/sprae/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprae/actions/workflows/node.js.yml) [![npm bundle size](https://img.shields.io/bundlephobia/minzip/sprae)](https://bundlephobia.com/package/sprae) [![npm](https://img.shields.io/npm/v/sprae?color=orange)](https://www.npmjs.com/package/sprae)

> DOM tree microhydration

_Sprae_ is open & minimalistic progressive enhancement framework with _preact-signals_ reactivity.<br/>
Perfect for small websites, static pages, prototypes, lightweight UI or SSR.<br/>
A light and fast alternative to _alpine_, _petite-vue_, _lucia_ etc.

## Usage

```html
<div id="container" :if="user">
  Hello <span :text="user.name">there</span>.
</div>

<script type="module">
  import sprae from './sprae.js' // https://unpkg.com/sprae/dist/sprae.js

  // init
  const state = sprae(
    document.getElementById('container'),
    { user: { name: 'friend' } }
  )

  // update
  state.user.name = 'love'
</script>
```

Sprae evaluates `:`-directives and evaporates them, returning reactive state for updates.


### As a script

Sprae CDN script autoinits document and exposes `sprae` global.

```html
<h1 :scope="{message:'Hello World!'}" :text="message"></h1>

<script src="https://cdn.jsdelivr.net/npm/sprae@12.x.x"></script>
<script>
  window.sprae; // global standalone
</script>
```

### Flavors

* [sprae.js](dist/sprae.js) – standard ESM.
* [sprae.umd.js](dist/sprae.umd.js) – CJS / UMD / standalone with autoinit.
* [sprae.micro.js](dist/sprae.micro.js) – <2.5kb with only `:scope`, `:ref`, `:fx`, `:on<event>`, `:<attr>`.
* [sprae.secure.js](dist/sprae.secure.js) - CSP-enabled with [secure eval](#evaluator).
<!-- * sprae.async.js - sprae with async events -->
<!-- * sprae.alpine.js - alpine sprae, drop-in alpinejs replacement -->
<!-- * sprae.vue.js - vue sprae, drop-in petite-vue replacement -->
<!-- * sprae.preact.js - sprae with preact-signals -->

## Directives

#### `:text="value"`

Set text content of an element.

```html
Welcome, <span :text="user.name">Guest</span>.

<!-- fragment -->
Welcome, <template :text="user.name"><template>.

<!-- function -->
<span :text="text => text + value"></span>
```

#### `:class="value"`

Set class value.

```html
<div :class="foo"></div>

<!-- appends to static class -->
<div class="bar" :class="baz"></div>

<!-- array/object, a-la clsx -->
<div :class="['foo', bar && 'bar', { baz }]"></div>

<!-- function -->
<div :class="classList => classList.add('active')"></div>
```

#### `:style="value"`

Set style value.

```html
<span style="'display: inline-block'"></span>

<!-- extends static style -->
<div style="foo: bar" :style="'bar-baz: qux'">

<!-- object -->
<div :style="{barBaz: 'qux'}"></div>

<!-- CSS variable -->
<div :style="{'--bar': baz}"></div>

<!-- function -->
<div :style="s => s.setProperty('--bar', 'qux')"></div>
```

#### `:value="value"`

Set value to/from an input, textarea or select.

```html
<input :value="value" />
<textarea :value="value" />

<!-- option & selected attr -->
<select :value="selected">
  <option :each="i in 5" :value="i" :text="i"></option>
</select>

<!-- checked attr -->
<input type="checkbox" :value="item.done" />

<!-- function with modifier -->
<input :value.defer-300="value => value + query" />
```

#### `:on<event>="code"`

Attach event(s) listener with optional [modifiers](#modifiers).

```html
<!-- inline -->
<button :onclick="submitForm()">Submit</button>

<!-- event -->
<input type="checkbox" :onchange="event => isChecked = event.target.value">

<!-- multiple events -->
<input :value="text" :oninput:onchange="event => text = event.target.value">

<!-- sequence of events -->
<button :onfocus..onblur="event => (handleFocus(), event => handleBlur())">

<!-- modifiers -->
<button :onclick.throttle-500="handler">Not too often</button>
```

#### `:<attr>="value"`

Set any attribute.

```html
<label :for="name" :text="name" />

<!-- multiple -->
<input :id:name="name" />

<!-- function -->
<div :hidden="hidden => !hidden"></div>
```

#### `:="values"`

Set multiple attributes.

```html
<input :="{ id: name, name, type: 'text', value, ...props  }" />

<!-- function -->
<input :="attributes => attributes.special.value = specialValue">
```

#### `:if="condition"`, `:else`

Control flow of elements.

```html
<span :if="foo">foo</span>
<span :else :if="bar">bar</span>
<span :else>baz</span>

<!-- fragment -->
<template :if="foo">foo <span>bar</span> baz</template>

<!-- function -->
<span :if="() => foo"></span>
```

#### `:each="item, idx in items"`

Multiply element.

```html
<ul><li :each="item in items" :text="item" /></ul>

<!-- cases -->
<li :each="item, idx? in array" />
<li :each="value, key? in object" />
<li :each="count, idx0? in number" />
<li :each="value, key? in func" />

<!-- fragment -->
<template :each="item in items">
  <dt :text="item.term"/>
  <dd :text="item.definition"/>
</template>
```

#### `:scope="values"`

Define scope for a subtree.

```html
<x :scope="{foo: 'foo', bar}">
  <y :scope="{baz: 'qux'}" :text="foo + bar + baz"></y>
</x>

<!-- blank scope -->
<x :scope :ref="id"></x>

<!-- variables -->
<x :scope="x=1, y=2" :text="x+y"></x>

<!-- function -->
<x :scope="state => ({})" :text="x+y"></x>
```

#### `:fx="code"`

Run effect, not changing any attribute.

```html
<div :fx="a.value ? foo() : bar()" />

<!-- cleanup -->
<div :fx="id = setInterval(tick, 1000), () => clearInterval(id)" />

<!-- function -->
<div :fx="() => ...">
```

#### `:ref="name"`, `:ref="el => (...)"`

Expose element in state with `name` or get element.

```html
<div :ref="card" :fx="handle(card)"></div>

<!-- local reference -->
<li :each="item in items" :scope :ref="li">
  <input :onfocus="e => li.classList.add('editing')"/>
</li>

<!-- set innerHTML -->
<div :ref="el => el.innerHTML = '...'"></div>

<!-- mount / unmount -->
<textarea :ref="el => (/* onmount */, () => (/* onunmount */))" :if="show"></textarea>
```


<!--
#### `:data="values"`

Set `data-*` attributes. CamelCase is converted to dash-case.

```html
<input :data="{foo: 1, barBaz: true}" />
<!-- <input data-foo="1" data-bar-baz />
```

#### `:aria="values"`

Set `aria-*` attributes. Boolean values are stringified.

```html
<input role="combobox" :aria="{
  controls: 'joketypes',
  autocomplete: 'list',
  expanded: false,
  activeOption: 'item1',
  activedescendant: ''
}" />
<!--
<input role="combobox" aria-controls="joketypes" aria-autocomplete="list" aria-expanded="false" aria-active-option="item1" aria-activedescendant>
```
-->

<!--
#### `:onvisible..oninvisible="e => e => {}"`

Trigger when element is in/out of the screen.

```html
<div :onvisible..oninvisible="e => (
  e.target.classList.add('visible'),
  e => e.target.classlist.remove('visible')
)"/>
```

#### `:onmount..onunmount="e => e => {}"`

Trigger when element is connected / disconnected from DOM.

```html
<div :onmount..onunmount="e => (dispose = init(), e => dispose())"/>
```
-->

## Modifiers

Modifiers adjust execuion of any directive.

* `.debounce-<ms>` – defer update until `<ms>` after last change.
* `.throttle-<ms>` – limit updates to once every `<ms>`.
* `.once` – run only once on init.
* `.next` – defer to next microtask.
* `.interval-<ms>` – run effect every `<ms>`.
* `.raf` – run `requestAnimationFrame` (~60fps).
* `.async` – await callback results.

### Event modifiers

For `:on<event>`, additional modifiers apply:

* `.passive`, `.capture` – listener [options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options).
* `.prevent`, `.stop` (`.immediate`) – prevent default or stop (immediate) propagation.
* `.window`, `.document`, `.parent`, `.outside`, `.self` – specify event target.
* `.<key>` – filtered by [`event.key`](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values):
  * `.ctrl`, `.shift`, `.alt`, `.meta`, `.enter`, `.esc`, `.tab`, `.space` – direct key
  * `.delete` – delete or backspace
  * `.arrow` – up, right, down or left arrow
  * `.digit` – 0-9
  * `.letter` – A-Z, a-z or any [unicode letter](https://unicode.org/reports/tr18/#General_Category_Property)
  * `.char` – any non-space character
  * `.ctrl-<key>, .alt-<key>, .meta-<key>, .shift-<key>` – key combinations, eg. `.ctrl-alt-delete` or `.meta-x`.
* `.*` – any other modifier has no effect, but allows binding multiple handlers.


## Store

Sprae uses _signals_-based store for reactivity with sandboxing and inheritance.

```js
import sprae from 'sprae'
import store from 'sprae/store'

// create store
const state = store(
  {
    count: 0,

    inc(){ state.count++, state._i++ },

    // computed
    get twice(){ return this.count * 2 },

    // untracked
    _i: 0,
  },

  // globals
  { Math }
)

// init sprae
sprae(element, state)

// update
state.inc()
state.count++

// bulk update
sprae(element, { count: 2 })

// sandbox
state.Math       // globalThis.Math
state.navigator  // undefined
```


## Signals

Sprae uses _preact-flavored signals_ for reactivity and can take _signal_ values as inputs.<br/>
Signals can be switched to an alternative preact/compatible implementation:

```js
import sprae from 'sprae';
import { signal, computed, effect, batch, untracked } from 'sprae/signal';
import * as signals from '@preact/signals-core';

// switch sprae signals to @preact/signals-core
sprae.use(signals);

// use signal as state value
const name = signal('Kitty')
sprae(el, { name });

// update state
name.value = 'Dolly';
```

Provider | Size | Feature
:---|:---|:---
[`ulive`](https://ghub.io/ulive) | 350b | Minimal implementation, basic performance, good for small states.
[`@webreflection/signal`](https://ghub.io/@webreflection/signal) | 531b | Class-based, better performance, good for small-medium states.
[`usignal`](https://ghub.io/usignal) | 850b | Class-based with optimizations and optional async effects.
[`@preact/signals-core`](https://ghub.io/@preact/signals-core) | 1.47kb | Best performance, good for any states, industry standard.
[`signal-polyfill`](https://ghub.io/signal-polyfill) | 2.5kb | Proposal signals. Use via [adapter](https://gist.github.com/dy/bbac687464ccf5322ab0e2fd0680dc4d).


## Evaluator

Expressions use _new Function_ as default evaluator, which is fast & compact, but violates "unsafe-eval" CSP.
To make eval stricter & safer, an alternative evaluator can be used, eg. _justin_:

```js
import sprae from 'sprae'
import justin from 'subscript/justin'

sprae.compile = justin; // set up justin as default compiler
```

[_Justin_](https://github.com/dy/subscript#justin) is minimal JS subset that avoids "unsafe-eval" CSP and provides sandboxing.

###### Operators:

`++ -- ! - + * / % ** && || ??`<br/>
`= < <= > >= == != === !==`<br/>
`<< >> >>> & ^ | ~ ?: . ?. [] ()=>{} in`<br/>
`= += -= *= /= %= **= &&= ||= ??= ... ,`

###### Primitives:

`[] {} "" ''`<br/>
`1 2.34 -5e6 0x7a`<br/>
`true false null undefined NaN`


## Custom Build

Sprae can be tailored to project needs / size:

```js
// sprae.custom.js
import sprae from 'sprae/core'
import * as signals from '@preact/signals'
import subscript from 'subscript'

// standard directives from sprae/directive
import _attr from 'sprae/directive/attr.js'
import _if from 'sprae/directive/if.js'
import _text from 'sprae/directive/text.js'

// register directives
sprae.dir('if', _if)
sprae.dir('text', _text)
sprae.dir('*', _attr)

// custom directive :id="expression"
sprae.dir('id', (el, state, expr) => {
  // ...init
  return value => el.id = value // update
})

// configure signals
sprae.use(signals)

// configure compiler
sprae.compile = subscript

// custom prefix, default is `:`
sprae.prefix = 'js-'
```

## JSX

Sprae works with JSX via custom prefix.

Case: Next.js server components can't do dynamic UI – active nav, tabs, sliders etc. Converting to client components breaks data fetching and adds overhead. Sprae can offload UI logic to keep server components intact.

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
    <Script src="https://unpkg.com/sprae" prefix="js-" />
  </>
}
```

## Hints

* To prevent [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content) add `<style>[\:each],[\:if],[\:else] {visibility: hidden}</style>`.
* Attributes order matters, eg. `<li :each="el in els" :text="el.name"></li>` is not the same as `<li :text="el.name" :each="el in els"></li>`.
* Invalid self-closing tags like `<a :text="item" />` cause error. Valid self-closing tags are: `li`, `p`, `dt`, `dd`, `option`, `tr`, `td`, `th`, `input`, `img`, `br`.
* To destroy state and detach sprae handlers, call `element[Symbol.dispose]()`.
* `this` is not used, to get element reference use `:ref`.
* `key` is not used, `:each` uses direct list mapping instead of DOM diffing.
* `:ref` comes after `:if` for mount/unmount events `<div :if="cond" :ref="(init(), ()=>dispose())"></div>`.
<!-- * `inert` attribute can disable autoinit `<script src='./sprae.js' inert/>`. -->

## Justification

Modern frontend stack is obese and unhealthy, like non-organic processed food. There are healthy alternatives, but:

* [Template-parts](https://github.com/dy/template-parts) is stuck with native HTML quirks ([parsing table](https://github.com/github/template-parts/issues/24), [SVG attributes](https://github.com/github/template-parts/issues/25), [liquid syntax](https://shopify.github.io/liquid/tags/template/#raw) conflict etc).
* [Alpine](https://github.com/alpinejs/alpine) / [petite-vue](https://github.com/vuejs/petite-vue) / [lucia](https://github.com/aidenybai/lucia) escape native HTML quirks, but have excessive API (`:`, `x-`, `{}`, `@`, `$`), tend to [self-encapsulate](https://github.com/alpinejs/alpine/discussions/3223) and not care about size/performance.

_Sprae_ holds open & minimalistic philosophy:

* Minimal syntax space.
* _Signals_ for reactivity.
* Pluggable directives, configurable internals.
* Small, safe & performant.
* Bits of organic sugar.
* Aims at making developers happy 🫰


<!--
|                       | [AlpineJS](https://github.com/alpinejs/alpine)          | [Petite-Vue](https://github.com/vuejs/petite-vue)        | Sprae            |
|-----------------------|-------------------|-------------------|------------------|
| _Size_              | ~10KB             | ~6KB              | ~5KB             |
| _Memory_            | 5.05             | 3.16              | 2.78             |
| _Performance_       | 2.64             | 2.43              | 1.76             |
| _CSP_               | Limited                | No                | Yes              |
| _SSR_ | No | No | No |
| _Evaluation_        | [`new AsyncFunction`](https://github.com/alpinejs/alpine/blob/main/packages/alpinejs/src/evaluator.js#L81) | [`new Function`](https://github.com/vuejs/petite-vue/blob/main/src/eval.ts#L20) | [`new Function`]() / [justin](https://github.com/dy/subscript)           |
| _Reactivity_        | `Alpine.store`    | _@vue/reactivity_   | _signals_ |
| _Sandboxing_        | No                | No                | Yes              |
| _Directives_ | `:`, `x-`, `{}` | `:`, `v-`, `@`, `{}` | `:` |
| _Magic_               | `$data` | `$app`   | - |
| _Fragments_ | Yes | No | Yes |
| _Plugins_ | Yes | No | Yes |
| _Modifiers_ | Yes | No | Yes |

_Nested directives_ Yes
_Inline directives_ Yes
-->

<!--
<details>
<summary><strong>Benchmark</strong></summary>

See [js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/current.html#eyJmcmFtZXdvcmtzIjpbIm5vbi1rZXllZC9wZXRpdGUtdnVlIiwibm9uLWtleWVkL3NwcmFlIl0sImJlbmNobWFya3MiOlsiMDFfcnVuMWsiLCIwMl9yZXBsYWNlMWsiLCIwM191cGRhdGUxMHRoMWtfeDE2IiwiMDRfc2VsZWN0MWsiLCIwNV9zd2FwMWsiLCIwNl9yZW1vdmUtb25lLTFrIiwiMDdfY3JlYXRlMTBrIiwiMDhfY3JlYXRlMWstYWZ0ZXIxa194MiIsIjA5X2NsZWFyMWtfeDgiLCIyMV9yZWFkeS1tZW1vcnkiLCIyMl9ydW4tbWVtb3J5IiwiMjNfdXBkYXRlNS1tZW1vcnkiLCIyNV9ydW4tY2xlYXItbWVtb3J5IiwiMjZfcnVuLTEway1tZW1vcnkiLCIzMV9zdGFydHVwLWNpIiwiMzRfc3RhcnR1cC10b3RhbGJ5dGVzIiwiNDFfc2l6ZS11bmNvbXByZXNzZWQiLCI0Ml9zaXplLWNvbXByZXNzZWQiXSwiZGlzcGxheU1vZGUiOjF9).

![Benchmark](./bench.png)
</details>
-->

<!--
<details>
<summary>How to run</summary>

```sh
# prerequisite
npm ci
npm run install-server
npm start

# build
cd frameworks/non-keyed/sprae
npm ci
npm run build-prod

# bench
[cd ../../../webdriver-ts
npm ci
npm run compile]
npm run bench keyed/sprae

# show results
[cd ../webdriver-ts-results
npm ci]
cd ../webdriver-ts
npm run results
```
</details>
-->

<!-- ## See also -->

<!--
## Alternatives

* [Alpine](https://github.com/alpinejs/alpine)
* ~~[Lucia](https://github.com/aidenybai/lucia)~~ deprecated
* [Petite-vue](https://github.com/vuejs/petite-vue)
* [nuejs](https://github.com/nuejs/nuejs)
* [hmpl](https://github.com/hmpl-language/hmpl)
* [unpoly](https://unpoly.com/up.link)
 -->


## Examples

* ToDo MVC: [demo](https://dy.github.io/sprae/examples/todomvc), [code](https://github.com/dy/sprae/blob/main/examples/todomvc.html)
* JS Framework Benchmark: [demo](https://dy.github.io/sprae/examples/js-framework-benchmark), [code](https://github.com/dy/sprae/blob/main/examples/js-framework-benchmark.html)
* Wavearea: [demo](https://dy.github.io/wavearea?src=//cdn.freesound.org/previews/586/586281_2332564-lq.mp3), [code](https://github.com/dy/wavearea)
* Carousel: [demo](https://rwdevelopment.github.io/sprae_js_carousel/), [code](https://github.com/RWDevelopment/sprae_js_carousel)
* Tabs: [demo](https://rwdevelopment.github.io/sprae_js_tabs/), [code](https://github.com/RWDevelopment/sprae_js_tabs?tab=readme-ov-file)
* Prostogreen [demo](https://web-being.org/prostogreen/), [code](https://github.com/web-being/prostogreen/)

<!--
## See Also

* [nadi](https://github.com/dy/nadi) - 101 signals. -->


<p align="center"><a href="https://github.com/krsnzd/license/">🕉</a></p>
