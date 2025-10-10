# ∴ spræ [![tests](https://github.com/dy/sprae/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprae/actions/workflows/node.js.yml) [![npm bundle size](https://img.shields.io/bundlephobia/minzip/sprae)](https://bundlephobia.com/package/sprae) [![npm](https://img.shields.io/npm/v/sprae?color=orange)](https://www.npmjs.com/package/sprae)

Simple progressive enhancement for DOM or JSX.<br/>

<!-- [Usage](#usage) · [Directives](#directives) · [Modifiers](#modifiers) · [Store](#store) · [Signals](#signals) · [Evaluator](#evaluator) · [Start](#autoinit) · [JSX](#jsx) · [Build](#custom-build) · [Hints](#hints) · [Examples](#examples) -->

## Usage

```html
<div id="counter" :scope="{ count: 0 }">
  <p :text="`Clicked ${count} times`"></p>
  <button :onclick="count++">Click me</button>
</div>

<script src="https://cdn.jsdelivr.net/npm/sprae@12.x.x" start></script>
```

Sprae evaluates `:`-directives enabling reactivity.

<!--
## Concepts

**Directives** are `:` prefixed attributes that evaluate JavaScript expressions:
`<div :text="message"></div>`

**Reactivity** happens automatically through signals—just mutate values:
`<button :onclick="count++">` updates `<span :text="count">`

**Scope** creates a state container for a subtree:
`<div :scope="{ user: 'Alice' }">` makes `user` available to children

**Effects** run side effects:
`:fx="console.log(count)"` logs when `count` changes

**Modifiers** adjust directive behavior:
`:oninput.debounce-200` delays handler by 200ms
-->

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

Set text content.

```html
Welcome, <span :text="user.name">Guest</span>.

<!-- fragment -->
Welcome, <template :text="user.name"><template>.

<!-- function -->
<span :text="val => val + text"></span>
```

#### `:class`

Set className.

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

Set style.

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

Control flow.

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

Multiply content.

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

Define state container for a subtree.

```html
<!-- transparent -->
<x :scope="{foo: 'foo'}">
  <y :scope="{bar: 'bar'}" :text="foo + bar"></y>
</x>

<!-- define variables -->
<x :scope="x=1, y=2" :text="x+y"></x>

<!-- blank -->
<x :scope :ref="id"></x>

<!-- access to local scope instance -->
<x :scope="scope => { scope.x = 'foo'; return scope }" :text="x"></x>
```

#### `:fx`

Run effect.

```html
<!-- inline -->
<div :fx="a.value ? foo() : bar()" />

<!-- function / cleanup -->
<div :fx="() => (id = setInterval(tick, 1000), () => clearInterval(id))" />
```

#### `:ref`

Expose an element in scope or get ref to the element.

```html
<div :ref="card" :fx="handle(card)"></div>

<!-- reference -->
<div :ref="el => el.innerHTML = '...'"></div>

<!-- local reference -->
<li :each="item in items" :scope :ref="li">
  <input :onfocus="e => li.classList.add('editing')"/>
</li>

<!-- mount / unmount -->
<textarea :ref="el => {/* onmount */ return () => {/* onunmount */}}" :if="show"></textarea>
```

#### `:on<event>`

Add event listener.

```html
<!-- inline -->
<button :onclick="count++">Up</button>

<!-- function -->
<input type="checkbox" :onchange="event => isChecked = event.target.value">

<!-- multiple -->
<input :onvalue="text" :oninput:onchange="event => text = event.target.value">

<!-- sequence -->
<button :onfocus..onblur="evt => { handleFocus(); return evt => handleBlur()}">

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


#### `.debounce-<ms|tick|frame|idle>?`

Defer callback by ms, next tick/animation frame, or until idle. Defaults to 250ms.

```html
<!-- debounce keyboard input by 200ms -->
<input :oninput.debounce-200="event => update(event)" />

<!-- set class in the next tick -->
<div :class.debounce-tick="{ active }">...</div>

<!-- debounce resize to animation framerate -->
<div :onresize.window.debounce-frame="updateSize()">...</div>

<!-- batch logging when idle -->
<div :fx.debounce-idle="sendAnalytics(batch)"></div>
```

#### `.throttle-<ms|tick|frame>?`

Limit callback rate to interval in ms, tick or animation framerate. By default 250ms.

```html
<!-- throttle text update -->
<div :text.throttle-100="text.length"></div>

<!-- lock style update to animation framerate -->
<div :onscroll.throttle-frame="progress = (scrollTop / scrollHeight) * 100"/>

<!-- ensure separate stack for events -->
<div :onmessage.window.throttle-tick="event => log(event)">...</div>
```

#### `.once`

Call only once.

```html
<!-- run event callback only once -->
<button :onclick.once="loadMoreData()">Start</button>

<!-- run once on sprae init -->
<div :fx.once="console.log('sprae init')">
```

#### `.window`, `.document`, `.parent`, `.outside`, `.self`  <kbd>events only</kbd>

Specify event target.

```html
<!-- close dropdown when click outside -->
<div :onclick.outside="closeMenu()" :class="{ open: isOpen }">Dropdown</div>

<!-- interframe communication -->
<div :onmessage.window="e => e.data.type === 'success' && complete()">...</div>
```

#### `.passive`, `.capture`  <kbd>events only</kbd>

Event listener [options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options).

```html
<div :onscroll.passive="e => pos = e.scrollTop">Scroll me</div>

<body :ontouchstart.capture="logTouch(e)"></body>
```

#### `.prevent`, `.stop`, `.stop-immediate`  <kbd>events only</kbd>

Prevent default or stop (immediate) propagation.

```html
<!-- prevent default -->
<a :onclick.prevent="navigate('/page')" href="/default">Go</a>

<!-- stop immediate propagation -->
<button :onclick.stop-immediate="criticalHandle()">Click</button>
```

#### `.<key>-<*>` <kbd>events only</kbd>

Filter event by [`event.key`](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values) or combination:

* `.ctrl`, `.shift`, `.alt`, `.meta`, `.enter`, `.esc`, `.tab`, `.space` – direct key
* `.delete` – delete or backspace
* `.arrow` – up, right, down or left arrow
* `.digit` – 0-9
* `.letter` – A-Z, a-z or any [unicode letter](https://unicode.org/reports/tr18/#General_Category_Property)
* `.char` – any non-space character

```html
<!-- any arrow event -->
<div :onkeydown.arrow="event => navigate(event.key)"></div>

<!-- key combination -->
<input :onkeydown.prevent.ctrl-c="copy(clean(value))">
```

<!--
#### `.persist-<kind?>`  <kbd>props</kbd>

Persist value in local or session storage.

```html
<textarea :value.persist="text" />

<select :onchange="event => theme = event.target.value" :value.persist="theme">
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</select>
```
-->

#### `.<any>`

Any other modifier has no effect, but allows binding multiple handlers.

```html
<span :fx.once="init(x)" :fx.update="() => (update(), () => destroy())">
```


## Store

Sprae uses signals store for reactivity.

```js
import sprae, { store, signal, effect, computed } from 'sprae'

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

state.inc(), state.count++  // update
name.value = 'bar'          // signal update
state._i++                  // no update

state.Math                  // == globalThis.Math
state.navigator             // == undefined
```


## Signals

Default signals can be replaced with _preact-signals_ alternative:

```js
import sprae from 'sprae';
import { signal, computed, effect, batch, untracked } from 'sprae/signal';
import * as signals from '@preact/signals-core';

sprae.use(signals);
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

Default evaluator is fast and compact, but violates "unsafe-eval" CSP.<br/>
To make eval stricter & safer, any alternative can be used, eg. [_justin_](https://github.com/dy/subscript#justin):

```js
import sprae from 'sprae'
import justin from 'subscript/justin'

sprae.use({compile: justin})
```

<!--
a minimal JS subset:

`++ -- ! - + * / % ** && || ??`<br/>
`= < <= > >= == != === !==`<br/>
`<< >> >>> & ^ | ~ ?: . ?. [] ()=>{} in`<br/>
`= += -= *= /= %= **= &&= ||= ??= ... ,`<br/>
`[] {} "" ''`<br/>
`1 2.34 -5e6 0x7a`<br/>
`true false null undefined NaN`
-->


## Autoinit

The `start` or `data-sprae-start` attribute automatically starts sprae on document. It can use a selector to adjust target container.

```html
<div id="counter" :scope="{count: 1}">
  <p :text="`Clicked ${count} times`"></p>
  <button :onclick="count++">Click me</button>
</div>

<script src="./sprae.js" data-sprae-start="#counter"></script>
```

For manual start, remove `start` attribute:

```html
<script src="./sprae.js"></script>
<script>
  // watch & autoinit els
  sprae.start(document.body, { count: 1 });

  // OR init individual el (no watch)
  const state = sprae(document.getElementById('counter'), { count: 0 })
</script>
```

For more control use ESM:

```html
<script type="module">
  import sprae from './sprae.js'

  // init
  const state = sprae(document.getElementById('counter'), { count: 0 })

  // update state
  state.count++
</script>
```


## JSX

Sprae works with JSX via custom prefix (eg. `data-sprae-`).
Useful to offload UI logic from server components in react / nextjs, instead of converting them to client components.

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
    <Script src="https://unpkg.com/sprae" data-sprae-prefix="data-sprae-" data-sprae-start />
  </>
}
```

## Custom build

Sprae build can be tweaked for project needs / size:

```js
// sprae.custom.js
import sprae, { directive, use } from 'sprae/core'
import * as signals from '@preact/signals'
import compile from 'subscript/justin'

import _default from 'sprae/directive/default.js'
import _if from 'sprae/directive/if.js'
import _text from 'sprae/directive/text.js'

use({
  // custom prefix, defaults to ':'
  prefix: 'data-sprae-',

  // use preact signals
  ...signals,

  // use safer compiler
  compile
})

// standard directives
directive.if = _if;
directive.text = _text;
directive.default = _default;

// custom directive :id="expression"
directive.id = (el, state, expr) => {
  // ...init
  return newValue => {
    // ...update
    let nextValue = el.id = newValue
    return nextValue
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

## Hints

* To prevent [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content) add `<style>[\:each],[\:if],[\:else] {visibility: hidden}</style>`.
* Attributes order matters, eg. `<li :each="el in els" :text="el.name"></li>` is not the same as `<li :text="el.name" :each="el in els"></li>`.
* Invalid self-closing tags like `<a :text="item" />` cause error. Valid self-closing tags are: `li`, `p`, `dt`, `dd`, `option`, `tr`, `td`, `th`, `input`, `img`, `br`.
* To destroy state and detach sprae handlers, call `element[Symbol.dispose]()`.
* `this` is not used, to get element reference use `:ref="element => {...}"`.
* `key` is not used, `:each` uses direct list mapping instead of DOM diffing.
* Expressions can be async: `<div :text="await load()"></div>`

<!--
## FAQ

1. Errors handling?
2. Typescript support?
3. Performance tips?
-->

## Justification

Modern frontend is unhealthy, like processed non-organic food.
Frameworks force into JS-land: build pipelines for "Hello World", proprietary conventions, virtual DOM overhead, brittle tooling. 
Pages are not functional without JS. Progressive enhancement is anachronism.

Build tools should be optional, not mandatory. Frameworks should enhance HTML, not replace it.

Native [template-parts](https://github.com/github/template-parts) and [DCE](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md) give hope, but quite distant and stuck with HTML quirks [1](https://github.com/github/template-parts/issues/24), [2](https://github.com/github/template-parts/issues/25), [3](https://shopify.github.io/liquid/tags/template/#raw).

[Alpine](https://github.com/alpinejs/alpine) and [petite-vue](https://github.com/vuejs/petite-vue) offer progressive enhancement, but introduce invalid syntax `@click`, bloated API, opaque reactivity, [self-encapsulation](https://github.com/alpinejs/alpine/discussions/3223), limited extensibility, size / performance afterthoughts.

_Sprae_ holds open, safe, minimalistic philosophy:

* One `:` prefix. Valid HTML. Zero magic.
* Signals reactivity. (preact-signals compatible)
* Plugggable: signals, eval, directives, modifiers.
* Build-free, ecosystem-agnostic: `<script src>`, JSX, anything.
* Small, safe & fast.
* 🫰 developers


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


## Examples

* ToDo MVC: [demo](https://dy.github.io/sprae/examples/todomvc), [code](https://github.com/dy/sprae/blob/main/examples/todomvc.html)
* JS Framework Benchmark: [demo](https://dy.github.io/sprae/examples/js-framework-benchmark), [code](https://github.com/dy/sprae/blob/main/examples/js-framework-benchmark.html)
* Wavearea: [demo](https://dy.github.io/wavearea?src=//cdn.freesound.org/previews/586/586281_2332564-lq.mp3), [code](https://github.com/dy/wavearea)
* Carousel: [demo](https://rwdevelopment.github.io/sprae_js_carousel/), [code](https://github.com/RWDevelopment/sprae_js_carousel)
* Tabs: [demo](https://rwdevelopment.github.io/sprae_js_tabs/), [code](https://github.com/RWDevelopment/sprae_js_tabs?tab=readme-ov-file)
<!-- * Prostogreen [demo](https://web-being.org/prostogreen/), [code](https://github.com/web-being/prostogreen/) -->

<!--
## See Also

* [nadi](https://github.com/dy/nadi) - 101 signals. -->

## Refs

[alpine](https://github.com/alpinejs/alpine), [lucia](https://github.com/aidenybai/lucia), [petite-vue](https://github.com/vuejs/petite-vue), [nuejs](https://github.com/nuejs/nuejs), [hmpl](https://github.com/hmpl-language/hmpl), [unpoly](https://unpoly.com/up.link), [dagger](https://github.com/dagger8224/dagger.js)


<p align="center"><a href="https://github.com/krsnzd/license/">🕉</a></p>
