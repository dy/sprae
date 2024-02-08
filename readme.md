# ∴ spræ [![tests](https://github.com/dy/sprae/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprae/actions/workflows/node.js.yml) [![size](https://img.shields.io/bundlephobia/minzip/sprae?label=size)](https://bundlephobia.com/result?p=sprae) [![npm](https://img.shields.io/npm/v/sprae?color=orange)](https://npmjs.org/sprae)

_Sprae_ is compact & ergonomic progressive enhancement framework.<br/>
It provides reactive `:`-attributes for simple markup logic without complex scripts.<br/>
Perfect for small websites, prototypes or UI logic as tiny, performant, safe and open alternative to [alpine](https://github.com/alpinejs/alpine), [petite-vue](https://github.com/vuejs/petite-vue) or [template-parts](https://github.com/github/template-parts).

## Usage

```html
<div id="container" :if="user">
  Logged in as <span :text="user.name">Guest.</span>
</div>

<script type="module">
  // import sprae from 'https://cdn.jsdelivr.net/npm/sprae/dist/sprae.js';
  import sprae, { signal } from './path/to/sprae.js';

  // init
  const state = { user: { name: signal('Dmitry Iv.') } }
  sprae(container, state);

  // update
  state.user.name.value = 'dy';
</script>
```

Sprae evaluates `:`/`@`-directives and evaporates them.<br/>
Directives support [justin syntax](#expressions) and may take [signals values](#reactivity).


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

<!-- loop by condition -->
<li :if="items" :each="item in items" :text="item" />
<li :else>Empty list</li>

<!-- loop fragment -->
<template :each="item in items">
  <dt :text="item.term"/>
  <dd :text="item.definition"/>
</template>

<!-- to prevent FOUC, add to head -->
<style>[:each] {visibility: hidden}</style>
```

#### `:text="value"`, `:html="value"`

Set text or html content of an element. Default text can be used as fallback:

```html
Welcome, <span :text="user.name">Guest</span>.

<!-- fragment -->
<template :text="user.name">Guest</template>
```

#### `:class="value"`

Set class value from either a string, array or object.

```html
<!-- set from string (insert fields as $<bar>) -->
<div :class="'foo $<bar>'"></div>

<!-- extends existing class as "foo bar" -->
<div class="foo" :class="'bar'"></div>

<!-- clsx: list -->
<div :class="['foo', bar]"></div>
```

#### `:style="value"`

Set style value from an object or a string. Extends existing `style` attribute, if any.

```html
<!-- from string -->
<div :style="'foo: $<bar>'"></div>

<!-- from object -->
<div :style="{foo: 'bar'}"></div>

<!-- set CSS variable -->
<div :style="{'--baz': qux}"></div>
```

#### `:value="value"`

Set value of an input, textarea or select. Takes handle of `checked` and `selected` attributes.

```html
<!-- set from value -->
<input :value="value" />
<textarea :value="value" />

<!-- selects right option -->
<select :value="selected">
  <option :each="i in 5" :value="i" :text="i"></option>
</select>
```

#### `:<prop>="value"`

Set any attribute value.

```html
<!-- Single attr -->
<label :for="name" :text="name" />

<!-- Multiple attribs -->
<input :id:name="name" />

<!-- Raw event listener (see events) -->
<div :onclick="e => ()"></div>
```

#### `:="expr"`

Run effect.

```html
<!-- multiple effects -->
<div :="bar()" :="baz()"></div>

<!-- declare var -->
<div :="x=123">
  <div :text="x"/>
</div>

<!-- ref -->
<textarea :="text=this" placeholder="Enter text..."></textarea>
```


## Events

#### `@<event>="handle"`, `@<foo>@<bar>.<baz>="handle"`

Attach event(s) listener with possible modifiers. `event` variable holds current event.

```html
<!-- Single event -->
<input type="checkbox" @change="isChecked = event.target.value">

<!-- Multiple events -->
<input :value="text" @input@change="text = event.target.value">

<!-- Event modifiers -->
<button @click.throttle-500="handler(event)">Not too often</button>
```

##### Event modifiers

* `.once`, `.passive`, `.capture` – listener [options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options).
* `.prevent`, `.stop` – prevent default or stop propagation.
* `.window`, `.document`, `.outside`, `.self` – specify event target.
* `.throttle-<ms>`, `.debounce-<ms>` – defer function call with one of the methods.
* `.ctrl`, `.shift`, `.alt`, `.meta`, `.arrow`, `.enter`, `.escape`, `.tab`, `.space`, `.backspace`, `.delete`, `.digit`, `.letter`, `.character` – filter by [`event.key`](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values).
* `.ctrl-<key>, .alt-<key>, .meta-<key>, .shift-<key>` – key combinations, eg. `.ctrl-alt-delete` or `.meta-x`.
* `.*` – any other modifier has no effect, but allows binding multiple handlers to same event (like jQuery event classes).


## Expressions

Expressions use [justin](https://github.com/dy/subscript?tab=readme-ov-file#justin) syntax, a minimal subset of JS:<br/>

```js
a.b, a[b];                          // prop access
a++, a--, !a, -a, +a, --a, ++a;     // unaries
a ** b, a * b, a / b, a % b;        // mult / div
a + b, a - b;                       // arithmetics
a < b, a <= b, a > b, a >= b;       // comparisons
a == b, a != b, a === b, a !== b;   // equality
a && b, a || b;                     // logic
a << b, a >> b, a >>> b;            // shifts
a & b, a ^ b, a | b, ~a;            // binary ops
a = b, a ? b : c, a?.b, a ?? b;     // assignment, conditions
(foo) => (bar, baz);                // arrow functions
[a, b]; { a: b };                   // objects, arrays
"abc", 'abc $<def>';                // strings (with interpolation)
1, 0xabcd, .01, -1.2e+.5;           // numbers
true, false, null, undefined, NaN;  // keywords
```

Expressions are async and await for each statement.

Expressions are sandboxed and have no access to globals, only to provided variables.<br/>
You may pass required objects eg. _console_, _window_, _setTimeout_, _fetch_ etc. (Caution: _setTimeout_ may act as eval).<br/>

## Reactivity

Sprae uses _@preact/signals-core_ for reactivity, but it can be switched to any other provider:

* `@preact/signals-core` (default)
* `@preact/signals`
* `@preact/signals-react`
* `usignal`
* `@webreflection/signal`
* `value-ref`

To switch your signals provider, just do:

```js
import * as preact from '@preact/signals';
import sprae, { signal, computed, effect, batch } from 'sprae';
Object.assign(sprae, preact); // use @preact/signals
```

<!-- ## Dispose

To destroy state and detach sprae handlers, call `element[Symbol.dispose]()`. -->

## Plugins

Sprae directives can be simply extended as `sprae.directive.name = (el, expr, state) => {}`.

<!-- Official plugins are:

* @sprae/aria – `:aria="props"` aria-roles
* @sprae/data - `:data="props"` for dataseet
* @sprae/item: `<x :item="{type:a, scope:b}"` – data schema -->
<!-- * @sprae/hcodes: `<x :hcode=""` – provide microformats
* @sprae/visible? - can be solved externally
* @sprae/intersect
* @sprae/persists - mb for signals?
* @sprae/mount
* @sprae/use?
* @sprae/input - for input values
* @sprae/ -->

## Examples

* TODO MVC: [demo](https://dy.github.io/sprae/examples/todomvc), [code](https://github.com/dy/sprae/blob/main/examples/todomvc.html)
* JS Framework Benchmark: [demo](https://dy.github.io/sprae/examples/js-framework-benchmark), [code](https://github.com/dy/sprae/blob/main/examples/js-framework-benchmark.html)
* Wavearea: [demo](https://dy.github.io/wavearea?src=//cdn.freesound.org/previews/586/586281_2332564-lq.mp3), [code](https://github.com/dy/wavearea)
* Prostogreen [demo](http://web-being.org/prostogreen/), [code](https://github.com/web-being/prostogreen/)

## Benchmark

See [js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/current.html#eyJmcmFtZXdvcmtzIjpbIm5vbi1rZXllZC9wZXRpdGUtdnVlIiwibm9uLWtleWVkL3NwcmFlIl0sImJlbmNobWFya3MiOlsiMDFfcnVuMWsiLCIwMl9yZXBsYWNlMWsiLCIwM191cGRhdGUxMHRoMWtfeDE2IiwiMDRfc2VsZWN0MWsiLCIwNV9zd2FwMWsiLCIwNl9yZW1vdmUtb25lLTFrIiwiMDdfY3JlYXRlMTBrIiwiMDhfY3JlYXRlMWstYWZ0ZXIxa194MiIsIjA5X2NsZWFyMWtfeDgiLCIyMV9yZWFkeS1tZW1vcnkiLCIyMl9ydW4tbWVtb3J5IiwiMjNfdXBkYXRlNS1tZW1vcnkiLCIyNV9ydW4tY2xlYXItbWVtb3J5IiwiMjZfcnVuLTEway1tZW1vcnkiLCIzMV9zdGFydHVwLWNpIiwiMzRfc3RhcnR1cC10b3RhbGJ5dGVzIiwiNDFfc2l6ZS11bmNvbXByZXNzZWQiLCI0Ml9zaXplLWNvbXByZXNzZWQiXSwiZGlzcGxheU1vZGUiOjF9).

<details>
<summary>Results table</summary>

![Benchmark](./bench.png)
</details>

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

## Justification

* [Template-parts](https://github.com/dy/template-parts) / [templize](https://github.com/dy/templize) is progressive, but is stuck with native HTML quirks ([parsing table](https://github.com/github/template-parts/issues/24), [SVG attributes](https://github.com/github/template-parts/issues/25), [liquid syntax](https://shopify.github.io/liquid/tags/template/#raw) conflict etc).
* [Alpine](https://github.com/alpinejs/alpine) / [petite-vue](https://github.com/vuejs/petite-vue) / [lucia](https://github.com/aidenyabi/lucia) escape native HTML quirks, but the API is not so elegant and [self-encapsulated](https://github.com/alpinejs/alpine/discussions/3223).

_Sprae_ takes idea of _templize_ / _alpine_ / _vue_ directives with [_signals_](https://ghub.io/@preact/signals) reactivity & [_subscript_](https://github.com/dy/subscript) safe eval.

* It shows static html markup when uninitialized (SSR).
* It doesn't enforce SPA nor JSX (unlike reacts), which enables island hydration.
* It reserves minimal syntax/API space.
* It enables CSP via Justin syntax.

|                       | [AlpineJS](https://github.com/alpinejs/alpine)          | [Petite-Vue](https://github.com/vuejs/petite-vue)        | Sprae            |
|-----------------------|-------------------|-------------------|------------------|
| _Performance_       | Good              | Very Good         | Best             |
| _Memory_            | Low               | Low               | Lowest           |
| _Size_              | ~10KB             | ~6KB              | ~5KB             |
| _CSP_               | No                | No                | Yes              |
| _Evaluation_        | [`new AsyncFunction`](https://github.com/alpinejs/alpine/blob/main/packages/alpinejs/src/evaluator.js#L81) | [`new Function`](https://github.com/vuejs/petite-vue/blob/main/src/eval.ts#L20) | [justin](https://github.com/dy/subscript)           |
| _Reactivity_        | `Alpine.store`    | _@vue/reactivity_   | _@preact/signals_ or any signals |
| _Sandboxing_        | No                | No                | Yes              |
| _API_               | `x-`, `:`, `@`, `$magic`, `Alpine.*` | `v-`, `@`, `{{}}`   | `:`, `@`, `sprae` |

<!--
## Alternatives

* [Alpine](https://github.com/alpinejs/alpine)
* ~~[Lucia](https://github.com/aidenybai/lucia)~~ deprecated
* [Petite-vue](https://github.com/vuejs/petite-vue)
* [nuejs](https://github.com/nuejs/nuejs)
-->

<p align="center"><a href="https://github.com/krsnzd/license/">🕉 Om Tat Sat</a></p>
