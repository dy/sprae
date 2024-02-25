# ∴ spræ [![tests](https://github.com/dy/sprae/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprae/actions/workflows/node.js.yml) [![size](https://img.shields.io/bundlephobia/minzip/sprae?label=size)](https://bundlephobia.com/result?p=sprae) [![npm](https://img.shields.io/npm/v/sprae?color=orange)](https://npmjs.org/sprae)

> DOM tree microhydration

_Sprae_ is compact & ergonomic progressive enhancement framework.<br/>
It provides `:`-attributes for inline markup logic without complex scripts.<br/>
Perfect for small-scale websites, prototypes, or UI.<br/>

## Usage

```html
<div id="container" :if="user">
  Logged in as <span :text="user.name">Guest.</span>
</div>

<script type="module">
  // import sprae from 'https://cdn.jsdelivr.net/npm/sprae/dist/sprae.js';
  import sprae, { signal } from './path/to/sprae.js';

  // init
  const state = { user: { name: signal('Rama') } }
  sprae(container, state);

  // update
  state.user.name.value = 'Krishna';
</script>
```

Sprae evaluates `:`-directives and evaporates them.


## Directives

#### `:if="condition"`, `:else`

Control flow of elements.

```html
<span :if="foo">foo</span>
<span :else :if="bar">bar</span>
<span :else>baz</span>

<!-- fragment -->
<template :if="foo">
  foo <span>bar</span> baz
</template>
```

#### `:each="item, index in items"`

Multiply element.

```html
<ul><li :each="item in items" :text="item"/></ul>

<!-- cases -->
<li :each="item, idx in list" />
<li :each="val, key in obj" />
<li :each="idx in number" />

<!-- by condition -->
<li :if="items" :each="item in items" :text="item" />
<li :else>Empty list</li>

<!-- fragment -->
<template :each="item in items">
  <dt :text="item.term"/>
  <dd :text="item.definition"/>
</template>

<!-- to prevent FOUC, add to head -->
<style>[:each] {visibility: hidden}</style>
```

#### `:text="value"`

Set text content of an element.

```html
Welcome, <span :text="user.name">Guest</span>.

<!-- fragment -->
Welcome, <template :text="user.name">Guest</template>.
```

#### `:html="element"`

Set html content of an element or instantiate template.

```html
Hello, <span :html="userElement">Guest</span>.

<!-- fragment -->
Hello, <template :html="user.name">Guest</template>.

<!-- instantiate template -->
<template :ref="tpl"><span :text="foo"></span></template>
<div :html="tpl" :scope="{foo:'bar'}">...inserted here...</div>
```

#### `:class="value"`

Set class value, extends existing `class`.

```html
<!-- string with interpolation -->
<div :class="'foo $<bar>'"></div>

<!-- array a-la clsx -->
<div :class="['foo', bar]"></div>
```

#### `:style="value"`

Set style value, extends existing `style`.

```html
<!-- string with interpolation -->
<div :style="'foo: $<bar>'"></div>

<!-- object -->
<div :style="{foo: 'bar'}"></div>

<!-- CSS variable -->
<div :style="{'--baz': qux}"></div>
```

#### `:value="value"`

Set value of an input, textarea or select. Takes handle of `checked` and `selected` attributes.

```html
<input :value="value" />
<textarea :value="value" />

<!-- selects right option -->
<select :value="selected">
  <option :each="i in 5" :value="i" :text="i"></option>
</select>
```

#### `:<prop>="value"`

Set any other attribute.

```html
<label :for="name" :text="name" />

<!-- multiple attributes -->
<input :id:name="name" />
```

#### `:="props"`

Set (spread) multiple attributes.

```html
<input :="{ id: name, name, type: 'text', value }" />
```

#### `:scope="data"`

Define or extend data scope for a subtree. Extended values are reactive.

```html
<x :scope="{ foo: 'bar' }">
  <!-- extends parent scope -->
  <y :scope="{ baz: 'qux' }" :text="foo + baz"></y>
</x>
```

#### `:ref="name"`

Expose element to current scope with `name`.

```html
<textarea :ref="text" placeholder="Enter text..."></textarea>

<!-- iterable items -->
<li :each="item in items" :ref="item">
  <input :onfocus..onblur=="e => (item.classList.add('editing'), e => item.classList.remove('editing'))"/>
</li>
```

#### `:fx="<effect>"`

Run effect(s).

```html
<!-- multiple effects -->
<div :fx="bar()" :fx="baz()"></div>
```

#### `:on<event>.<modifier>="handler"`, `:on<in>..on<out>="handler"`

Attach event(s) listener with possible modifiers.

```html
<input type="checkbox" :onchange="e => isChecked = e.target.value">

<!-- multiple events -->
<input :value="text" :oninput:onchange="e => text = e.target.value">

<!-- events sequence -->
<button :onfocus..onblur="e => ( handleFocus(), e => handleBlur())">

<!-- event modifiers -->
<button :onclick.throttle-500="handler">Not too often</button>
```

##### Modifiers

* `.once`, `.passive`, `.capture` – listener [options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options).
* `.prevent`, `.stop` – prevent default or stop propagation.
* `.window`, `.document`, `.outside`, `.self` – specify event target.
* `.throttle-<ms>`, `.debounce-<ms>` – defer function call with one of the methods.
* `.ctrl`, `.shift`, `.alt`, `.meta`, `.arrow`, `.enter`, `.escape`, `.tab`, `.space`, `.backspace`, `.delete`, `.digit`, `.letter`, `.character` – filter by [`event.key`](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values).
* `.ctrl-<key>, .alt-<key>, .meta-<key>, .shift-<key>` – key combinations, eg. `.ctrl-alt-delete` or `.meta-x`.
* `.*` – any other modifier has no effect, but allows binding multiple handlers to same event (like jQuery event classes).


## Expressions

_Sprae_ uses [minimal subset of JS](https://github.com/dy/subscript?tab=readme-ov-file#justin) for expressions syntax:

##### Operators:

```
++ -- ! - + ** * / %  && || ??
= < <= > >= == != === !==
<< >> & ^ | ~ ?: . ?. []
() => {}
in
```

##### Primitives:

```
[] {} "" ''
1 2.34 -5e6 0x7a
true false null undefined NaN
```

Expressions are sandboxed and have no access to globals (like _console_, _setTimeout_, _window_ etc.)<br/>


## Reactivity

_Sprae_ uses signals for reactivity. Signals provider can be configured as:

```js
import * as preact from '@preact/signals-core';
import sprae, { signal, computed, effect, batch } from 'sprae';

Object.assign(sprae, preact);

sprae(el, { name: signal('Krishna') })
```

##### Signal providers:

* `@preact/signals` – +2Kb, best performance, good for complex states (10+ deps).
* `@webreflection/signal` – +1Kb, good performance/size, good for average states (<10 deps).
* `ulive` (default) - smallest size, ok for simple purposes (direct deps).

<!-- ## Dispose

To destroy state and detach sprae handlers, call `element[Symbol.dispose]()`. -->


<!-- ## Plugins

_Sprae_ directives can be extended as `sprae.directive.name = (el, expr, state) => {}`.

Also see [nadi](https://github.com/dy/nadi) - collection of various DOM/etc interfaces with signals API. -->

<!-- Official plugins are:

* @sprae/aria – `:aria="props"` aria-roles
* @sprae/data - `:data="props"` for dataseet
* @sprae/item: `<x :item="{type:a, scope:b}"` – data schema
* @sprae/visible - `:onvisible..oninvisible="e => e => {}"`
* @sprae/intersect - `:onin..onout="e => e => {}"`
* @sprae/mount - `:onmount..onunmount="e => e => {}"`

-->


## Examples

* TODO MVC: [demo](https://dy.github.io/sprae/examples/todomvc), [code](https://github.com/dy/sprae/blob/main/examples/todomvc.html)
* JS Framework Benchmark: [demo](https://dy.github.io/sprae/examples/js-framework-benchmark), [code](https://github.com/dy/sprae/blob/main/examples/js-framework-benchmark.html)
* Wavearea: [demo](https://dy.github.io/wavearea?src=//cdn.freesound.org/previews/586/586281_2332564-lq.mp3), [code](https://github.com/dy/wavearea)
* Prostogreen [demo](http://web-being.org/prostogreen/), [code](https://github.com/web-being/prostogreen/)


## Justification

[Template-parts](https://github.com/dy/template-parts) / [templize](https://github.com/dy/templize) is progressive, but is stuck with native HTML quirks ([parsing table](https://github.com/github/template-parts/issues/24), [SVG attributes](https://github.com/github/template-parts/issues/25), [liquid syntax](https://shopify.github.io/liquid/tags/template/#raw) conflict etc). [Alpine](https://github.com/alpinejs/alpine) / [petite-vue](https://github.com/vuejs/petite-vue) / [lucia](https://github.com/aidenyabi/lucia) escape native HTML quirks, but the API is excessive and [self-encapsulated](https://github.com/alpinejs/alpine/discussions/3223).

_Sprae_ mixes _templize_ / _alpine_ / _vue_ directives with _signals_ reactivity & _no-keywords_ evaluation.

* It shows static html markup when uninitialized (SSR).
* It doesn't enforce SPA nor JSX (unlike reacts), which enables island hydration.
* It reserves minimal syntax/API space.
* It enables CSP.

#### Features

|                       | [AlpineJS](https://github.com/alpinejs/alpine)          | [Petite-Vue](https://github.com/vuejs/petite-vue)        | Sprae            |
|-----------------------|-------------------|-------------------|------------------|
| _Size_              | ~10KB             | ~6KB              | ~5KB             |
| _Memory_            | 5.05             | 3.16              | 2.78             |
| _Performance_       | 2.64             | 2.43              | 1.76             |
| _CSP_               | No                | No                | Yes              |
| _Evaluation_        | [`new AsyncFunction`](https://github.com/alpinejs/alpine/blob/main/packages/alpinejs/src/evaluator.js#L81) | [`new Function`](https://github.com/vuejs/petite-vue/blob/main/src/eval.ts#L20) | [justin](https://github.com/dy/subscript)           |
| _Reactivity_        | `Alpine.store`    | _@vue/reactivity_   | any signals |
| _Sandboxing_        | No                | No                | Yes              |
| _Magic_               | Yes | Yes   | No |
| _Plugins_ | Yes | No | Yes |
| _Modifiers_ | Yes | No | Yes |
| _Directives_ | `:`, `x-`, `{}` | `:`, `v-`, `@`, `{}` | `:` |
| _Fragments_ | Yes | No | Yes |


<details>
<summary><strong>Benchmark</strong></summary>

See [js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/current.html#eyJmcmFtZXdvcmtzIjpbIm5vbi1rZXllZC9wZXRpdGUtdnVlIiwibm9uLWtleWVkL3NwcmFlIl0sImJlbmNobWFya3MiOlsiMDFfcnVuMWsiLCIwMl9yZXBsYWNlMWsiLCIwM191cGRhdGUxMHRoMWtfeDE2IiwiMDRfc2VsZWN0MWsiLCIwNV9zd2FwMWsiLCIwNl9yZW1vdmUtb25lLTFrIiwiMDdfY3JlYXRlMTBrIiwiMDhfY3JlYXRlMWstYWZ0ZXIxa194MiIsIjA5X2NsZWFyMWtfeDgiLCIyMV9yZWFkeS1tZW1vcnkiLCIyMl9ydW4tbWVtb3J5IiwiMjNfdXBkYXRlNS1tZW1vcnkiLCIyNV9ydW4tY2xlYXItbWVtb3J5IiwiMjZfcnVuLTEway1tZW1vcnkiLCIzMV9zdGFydHVwLWNpIiwiMzRfc3RhcnR1cC10b3RhbGJ5dGVzIiwiNDFfc2l6ZS11bmNvbXByZXNzZWQiLCI0Ml9zaXplLWNvbXByZXNzZWQiXSwiZGlzcGxheU1vZGUiOjF9).

![Benchmark](./bench.png)
</details>

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
cd ../../..
cd webdriver-ts
npm ci
npm run compile
npm run bench keyed/sprae

# show results
cd ..
cd webdriver-ts-results
npm ci
cd ..
cd webdriver-ts
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
 -->

## Migration to v9

* Pass necessary globals manually to state (`console`, `setTimeout` etc).
* Templates use _justin_ syntax (no keywords JS).
* Tagged literals -> `:class="'abc $<def>'"`
* `:with={x:foo}` -> `:scope={x:foo}`
* `:render="tpl"` -> `:html="tpl"`
* No autoinit -> use manual init.
* No reactive store -> use signals for reactive values.
* `@click="event.target"` -> `:onclick="event => event.target"`
* Async props / events are prohibited, pass async functions via state.

<p align="center"><a href="https://github.com/krsnzd/license/">🕉</a></p>
