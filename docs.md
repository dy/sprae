<link rel="stylesheet" href="./assets/style.css"/>

<!--
#### [Start](#start)    [Directives](#directives)    [Modifiers](#modifiers)    [Store](#store)    [Signals](#signals)    [Evaluator](#evaluator)    [JSX](#jsx)    [Custom build](#custom-build)    [Hints](#hints)
-->


## Start

The `start` / `data-start` attribute auto-starts sprae on the page root or on a selector you provide.

Example (auto-init on `#counter`):

```html
<div id="counter" :scope="{count: 1}">
  <p :text="`Clicked ${count} times`"></p>
  <button :onclick="count++">Click me</button>
</div>

<script src="./sprae.js" data-start="#counter"></script>
<script>
  window.sprae; // available as global standalone
</script>
```

Manual ESM init:

```html
<script type="module">
  import sprae from './sprae.js'

  // init
  const state = sprae(document.getElementById('counter'), { count: 0 })

  // update state
  state.count++
</script>
```


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

#### `:<attr?>`

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

#### `.debounce-<ms|raf>?`

Delay callback by interval since the last call.
Undefined interval uses `tick`.
<!-- Optional `immediate` indicates leading-edge debounce. -->
See [lodash/debounce](https://lodash.com/docs/#debounce)

```html
<!-- debounce keyboard input by 200ms -->
<input :oninput.debounce-200="event => update(event)" />
```

#### `.throttle-<ms|raf>?`

Limit callback rate to an interval. Undefined interval uses `tick`.
<!-- Optional `immediate` indicates leading-edge response. -->
See [lodash/throttle](https://lodash.com/docs/#throttle).

```html
<!-- throttle text update -->
<div :text.throttle-100="text.length"></div>
```

#### `.delay-<ms|raf>?`

Run callback after an interval.

```html
<!-- set class in the next tick -->
<div :class.delay="{ active }">...</div>
```

<!--
#### `.raf`

Throttle callback by animation frames.

```html
<!-- lock style update to animation frames
<div :onscroll.raf="progress = (scrollTop / scrollHeight) * 100"/>
```
-->

#### `.once`

Call only once.

```html
<!-- run event callback only once -->
<button :onclick.once="loadMoreData()">Start</button>

<!-- run once on sprae init -->
<div :fx.once="console.log('sprae init')">
```

#### `.window`, `.document`, `.body`, `.root`, `.parent`, `.outside`, `.self`

Specify target.

```html
<!-- close dropdown when click outside -->
<div :onclick.outside="closeMenu()" :class="{ open: isOpen }">Dropdown</div>

<!-- interframe communication -->
<div :onmessage.window="e => e.data.type === 'success' && complete()">...</div>

<!-- set css variable on document root element (<html>) -->
<main :style.root="{'--x': x}">...</main>
```

#### `.passive`, `.capture`  <kbd>events only</kbd>

Event listener [options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options).

```html
<div :onscroll.passive="e => pos = e.scrollTop">Scroll me</div>

<body :ontouchstart.capture="logTouch(e)"></body>
```

#### `.prevent`, `.stop-<immediate>?`  <kbd>events only</kbd>

Prevent default or stop (immediate) propagation.

```html
<!-- prevent default -->
<a :onclick.prevent="navigate('/page')" href="/default">Go</a>

<!-- stop immediate propagation -->
<button :onclick.stop.immediate="criticalHandle()">Click</button>
```

#### `.<meta>-<key>` <kbd>events only</kbd>

Filter event by [`event.key`](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values) or combination:

* `.enter`, `.esc`, `.tab`, `.space`, `.delete` – direct key
* `.ctrl`, `.shift`, `.alt`, `.meta`, `.cmd` – meta key
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

_Justin_ is a minimal JS subset:

`++ -- ! - + * / % ** && || ??`<br/>
`= < <= > >= == != === !==`<br/>
`<< >> >>> & ^ | ~ ?: . ?. [] ()=>{} in`<br/>
`= += -= *= /= %= **= &&= ||= ??= ... ,`<br/>
`[] {} "" ''`<br/>
`1 2.34 -5e6 0x7a`<br/>
`true false null undefined NaN`



## JSX

Sprae works with JSX via custom prefix (eg. `s-`).
Useful to offload UI logic from server components in react / nextjs, instead of converting them to client components.

```jsx
// app/page.jsx - server component
export default function Page() {
  return <>
    <nav id="nav">
      <a href="/" s-class="location.pathname === '/' && 'active'">Home</a>
      <a href="/about" s-class="location.pathname === '/about' && 'active'">About</a>
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
    <Script src="https://unpkg.com/sprae" data-prefix="s-" data-start />
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
* `this` refers to current element, but it's recommended to use `:ref="element => {...}"`.
* `key` is not used, `:each` uses direct list mapping instead of DOM diffing.
* Expressions can be async: `<div :text="await load()"></div>`

<!--
## FAQ

1. Errors handling?
2. Typescript support?
3. Performance tips?
-->
