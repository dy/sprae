# ∴ spræ [![tests](https://github.com/dy/sprae/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprae/actions/workflows/node.js.yml) [![npm bundle size](https://img.shields.io/bundlephobia/minzip/sprae)](https://bundlephobia.com/package/sprae) [![npm](https://img.shields.io/npm/v/sprae?color=orange)](https://www.npmjs.com/package/sprae)

> light reactive hydration for DOM tree

_Sprae_ is open & minimalistic progressive enhancement framework.<br/>
Good for small websites, static pages, prototypes, or SSR.<br/>
Based on _preact-signals_, a light and fast alternative to _alpine_ or _petite-vue_.

## Usage

```html
<div id="container" :if="user">
  Hello <span :text="user.name">there</span>.
</div>

<script type="module">
  import sprae from './sprae.js'

  // init
  const state = sprae(
    document.getElementById('container'),
    { user: { name: 'Friend' } }
  )

  // update
  state.user.name = 'Love'
</script>
```

Sprae evaluates `:`-directives, removes them, and returns a reactive state for updates.

### Autoinit

To automatically initialize all directives, use CDN version:

```html
<h1 :scope="{message:'Hello World!'}" :text="message"></h1>
<script src="https://cdn.jsdelivr.net/npm/sprae@12.x.x"></script>
```
<!--
### Flavors

* [sprae.js](dist/sprae.js) – ESM.
* [sprae.umd.js](dist/sprae.umd.js) – CJS / UMD / standalone with autoinit.
* [sprae.micro.js](dist/sprae.micro.js) – <2.5kb [micro version](#micro).
-->
<!-- * sprae.async.js - sprae with async events -->
<!-- * sprae.alpine.js - alpine sprae, drop-in alpinejs replacement -->
<!-- * sprae.vue.js - vue sprae, drop-in petite-vue replacement -->
<!-- * sprae.preact.js - sprae with preact-signals -->


## Directives

#### `:text`

Set element text content.

```html
Welcome, <span :text="user.name">Guest</span>.

<!-- fragment -->
Welcome, <template :text="user.name"><template>.

<!-- function -->
<span :text="val => val + text"></span>
```

#### `:class`

Set element className.

```html
<div :class="foo"></div>

<!-- appends to static class -->
<div class="bar" :class="baz"></div>

<!-- array/object, a-la clsx -->
<div :class="['foo', bar && 'bar', { baz }]"></div>

<!-- function -->
<div :class="str => [str, 'active']"></div>
```

#### `:style`

Set element style.

```html
<span :style="'display: inline-block'"></span>

<!-- extends static style -->
<div style="foo: bar" :style="'bar-baz: qux'">

<!-- object -->
<div :style="{bar: 'baz', '--qux': 'quv'}"></div>

<!-- function -->
<div :style="obj => ({'--bar': baz})"></div>
```

#### `:value`

Bind input, textarea or select value.

```html
<input :value="value" />
<textarea :value="value" />

<!-- handles option & selected attr -->
<select :value="selected">
  <option :each="i in 5" :value="i" :text="i"></option>
</select>

<!-- checked attr -->
<input type="checkbox" :value="item.done" />

<!-- function -->
<input :value="value => value + str" />
```

#### `:<attr>`, `:`

Set any attribute(s).

```html
<label :for="name" :text="name" />

<!-- multiple -->
<input :id:name="name" />

<!-- function -->
<div :hidden="hidden => !hidden"></div>

<!-- spread -->
<input :="{ id: name, name, type: 'text', value, ...props  }" />
```

#### `:if`, `:else`

Control flow of elements.

```html
<span :if="foo">foo</span>
<span :else :if="bar">bar</span>
<span :else>baz</span>

<!-- fragment -->
<template :if="foo">foo <span>bar</span> baz</template>

<!-- function -->
<span :if="active => test()"></span>
```

#### `:each`

Multiply element.

```html
<ul><li :each="item in items" :text="item" /></ul>

<!-- cases -->
<li :each="item, idx? in array" />
<li :each="value, key? in object" />
<li :each="count, idx? in number" />
<li :each="item, idx? in function" />

<!-- fragment -->
<template :each="item in items">
  <dt :text="item.term"/>
  <dd :text="item.definition"/>
</template>
```

#### `:scope`

Define variable scope for a subtree.

```html
<x :scope="{foo: 'foo'}">
  <y :scope="{bar: 'bar'}" :text="foo + bar"></y>
</x>

<!-- variables -->
<x :scope="x=1, y=2" :text="x+y"></x>

<!-- blank scope -->
<x :scope :ref="id"></x>
```

#### `:fx`

Run effect, not changing any attribute.

```html
<!-- inline -->
<div :fx="a.value ? foo() : bar()" />

<!-- function -->
<div :fx="() => {...}" />

<!-- cleanup -->
<div :fx="() => (id = setInterval(tick, 1000), () => clearInterval(id))" />
```

#### `:ref`

Expose an element in scope with `name` or get reference to the element.

```html
<div :ref="card" :fx="handle(card)"></div>

<!-- reference -->
<div :ref="el => el.innerHTML = '...'"></div>

<!-- local reference -->
<li :each="item in items" :scope :ref="li">
  <input :onfocus="e => li.classList.add('editing')"/>
</li>

<!-- mount / unmount -->
<textarea :ref="el => (/* onmount */, () => (/* onunmount */))" :if="show"></textarea>
```

#### `:on<event>`

Attach event listener.

```html
<!-- inline -->
<button :onclick="count++">Up</button>

<!-- function -->
<input type="checkbox" :onchange="event => isChecked = event.target.value">

<!-- multiple -->
<input :onvalue="text" :oninput:onchange="event => text = event.target.value">

<!-- sequence -->
<button :onfocus..onblur="event => (handleFocus(), event => handleBlur())">

<!-- modifiers -->
<button :onclick.throttle-500="handle()">Not too often</button>
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

Can be applied to any directives or events.

Modifier | Description | Note
---|---|---
`.debounce-<ms?>` | defer callback by `ms`. | default=100
`.throttle-<ms?>` | limit callback to once every `ms`. | default=100
`.tick` | defer callback to next microtask. |
`.once` | call only once. |
`.interval-<ms?>` | run callback every `ms`. | default=100
`.raf` | run callback in `requestAnimationFrame` loop (~60fps). |
`.idle` | run callback when system is idle. |
`.async` | await callback results. |
`.window`, `.document`, `.parent`, `.outside`, `.self` | specify event target. | events only
`.passive`, `.capture`, `.once` | event listener [options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options). | events only
`.prevent`, `.stop`, `.immediate` | prevent default or stop (immediate) propagation. | events only
`.<key>`, `.*-<key>` | filter event by [`event.key`](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values) or combination: <ul><li>`.ctrl`, `.shift`, `.alt`, `.meta`, `.enter`, `.esc`, `.tab`, `.space` – direct key <li>`.delete` – delete or backspace <li>`.arrow` – up, right, down or left arrow <li>`.digit` – 0-9 <li>`.letter` – A-Z, a-z or any [unicode letter](https://unicode.org/reports/tr18/#General_Category_Property) <li>`.char` – any non-space character</ul> | events only
`.persist-<kind?>` | persist value in local or session storage. | props only
`.*` | any other modifier has no effect, but allows binding multiple handlers. |

### Examples

```html
<!-- Debounce keyboard input updates -->
<input :oninput.debounce-200="e => update(e)" />

<!-- Track mouse y coord -->
<div :onmousemove.document="event => y=event.clientY">

<!-- Persist value in session storage -->
<textarea :value.persist="text" />

<!-- Throttle calculations -->
<span id="count" :text.throttle-100="text.length" />

<!-- Map JS props into CSS -->
<div :style.raf="{'--y':y}">

<!-- Simple counter -->
<span :text.interval-1000="count++">

<!-- Run on init -->
<div :fx.once="console.log('sprae init')">
```

## Reactivity

Sprae uses _preact-flavored signals_ store for reactivity.

```js
import sprae from 'sprae'
import store from 'sprae/store'
import { signal } from 'sprae/signal'

const name = signal('foo')

const state = store({
  count: 0,                             // prop
  inc(){ state.count++ },               // method
  name,                                 // signal
  get twice(){ return this.count * 2 }, // computed
  _i: 0,                                // untracked
},

// globals
{ Math }
)

sprae(element, state)

// update
state.inc()
state.count++

// signal update
name.value = 'bar'

// no update
state._i++

// sandbox
state.Math       // globalThis.Math
state.navigator  // undefined
```

Signals can be switched to an alternative preact-signals compatible implementation:

```js
import sprae from 'sprae';
import * as signals from '@preact/signals-core';

sprae.signals = signals
```

Provider | Size | Feature
:---|:---|:---
[`ulive`](https://ghub.io/ulive) | 350b | Minimal implementation, basic performance, good for small states.
[`signal`](https://ghub.io/@webreflection/signal) | 633b | Class-based, better performance, good for small-medium states.
[`usignal`](https://ghub.io/usignal) | 955b | Class-based with optimizations and optional async effects.
[`@preact/signals-core`](https://ghub.io/@preact/signals-core) | 1.47kb | Best performance, good for any states, industry standard.
[`signal-polyfill`](https://ghub.io/signal-polyfill) | 2.5kb | Proposal signals. Use via [adapter](https://gist.github.com/dy/bbac687464ccf5322ab0e2fd0680dc4d).
[`alien-signals`](https://github.com/WebReflection/alien-signals) | 2.67kb | Preact-flavored [alien signals](https://github.com/stackblitz/alien-signals).


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
sprae.dir['if'] = _if
sprae.dir['text'] = _text
sprae.dir['*'] = _attr

// custom directive :id="expression"
sprae.dir['id'] = (el, state, expr) => {
  // ...init
  return newValue => {
    // ...update
    let nextValue = el.id = newValue
    return nextValue
  }
}

// configure signals
sprae.use(signals)

// configure compiler
sprae.compile = subscript
```

## Micro

Micro sprae version is 2.5kb bundle with essentials:

* no multieffects `:a:b`
* no modifiers `:a.x.y`
* no sequences `:ona..onb`
* no `:each`, `:if`, `:value`
* async effects by default

## JSX

Sprae works with JSX via custom prefix (eg. `data-sprae-`).

Case: server components can't do dynamic UI – active nav, tabs, sliders etc. Converting to client components breaks data fetching and adds overhead. Sprae can offload UI logic to keep server components intact.

```jsx
// app/page.jsx - server component
export default function Page() {
  return <>
    <nav id="nav">
      <a href="/" data-sprae-class="location.pathname === '/' && 'active'">Home</a>
      <a href="/about" data-sprae-class="location.pathname === '/about' && 'active'">About</a>
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
    <Script src="https://unpkg.com/sprae" prefix="data-sprae-" />
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

Modern frontend stack is not healthy, like processed food. There are some alternatives, like:

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
