# ∴ spræ [![tests](https://github.com/dy/sprae/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprae/actions/workflows/node.js.yml) [![size](https://img.shields.io/bundlephobia/minzip/sprae?label=size)](https://bundlephobia.com/result?p=sprae) [![npm](https://img.shields.io/npm/v/sprae?color=orange)](https://npmjs.org/sprae)

> DOM tree microhydration

_Sprae_ is a compact & ergonomic progressive enhancement framework.<br/>
It provides `:`-attributes for inline markup logic with _signals_-based reactivity.<br/>
Perfect for small-scale websites, prototypes, or lightweight UI.<br/>


## Usage

```html
<div id="container" :if="user">
  Hello <span :text="user.name">World</span>.
</div>

<script type="module">
  import sprae, { signal } from 'sprae'

  const name = signal('Kitty')
  sprae(container, { user: { name } }) // init

  name.value = 'Dolly' // update
</script>
```

Sprae evaluates `:`-directives and evaporates them, attaching state to html.


## Directives

<details>
  <summary><strong>:if, :else</strong></summary>

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
</details>

<details>
  <summary><strong>:each</strong></summary>

  #### `:each="item, index in items"`

  Multiply element. Item is identified either by `item.id` or `item.key`.

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

  <!-- prevent FOUC -->
  <style>[:each] {visibility: hidden}</style>
  ```
</details>

<details>
  <summary><strong>:text</strong></summary>

  #### `:text="value"`

  Set text content of an element.

  ```html
  Welcome, <span :text="user.name">Guest</span>.

  <!-- fragment -->
  Welcome, <template :text="user.name" />.
  ```
</details>

<details>
  <summary><strong>:class</strong></summary>

  #### `:class="value"`

  Set class value, extends existing `class`.

  ```html
  <!-- string with interpolation -->
  <div :class="'foo $<bar>'"></div>

  <!-- array/object a-la clsx -->
  <div :class="[foo && 'foo', {bar: bar}]"></div>
  ```
</details>

<details>
  <summary><strong>:style</strong></summary>

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
</details>

<details>
  <summary><strong>:value</strong></summary>

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
</details>

<details>
  <summary><strong>:*</strong></summary>

  #### `:*="value"`, `:="values"`

  Set any attribute(s).

  ```html
  <label :for="name" :text="name" />

  <!-- multiple attributes -->
  <input :id:name="name" />

  <!-- spread attributes -->
  <input :="{ id: name, name, type: 'text', value }" />
  ```
</details>

<details>
  <summary><strong>:scope</strong></summary>

  #### `:scope="data"`

  Define or extend data scope for a subtree.

  ```html
  <x :scope="{ foo: signal('bar') }">
    <!-- extends parent scope -->
    <y :scope="{ baz: 'qux' }" :text="foo + baz"></y>
  </x>
  ```
</details>

<details>
  <summary><strong>:ref</strong></summary>

  #### `:ref="name"`

  Expose element to current scope with `name`.

  ```html
  <textarea :ref="text" placeholder="Enter text..."></textarea>

  <!-- iterable items -->
  <li :each="item in items" :ref="item">
    <input :onfocus..onblur=="e => (item.classList.add('editing'), e => item.classList.remove('editing'))"/>
  </li>
  ```
</details>

<details>
  <summary><strong>:fx</strong></summary>

  #### `:fx="values"`

  Run effect, not changing any attribute.<br/>Optional cleanup is called in-between effect calls or on disposal.

  ```html
  <div :fx="a.value ? foo() : bar()" />

  <!-- cleanup function -->
  <div :fx="id = setInterval(tick, interval), () => clearInterval(tick)" />
  ```
</details>

<details>
  <summary><strong>:on*</strong></summary>

  #### `:on<event>.<mod>="handler"`, `:on<in>..on<out>="handler"`

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

  ##### Modifiers:

  * `.once`, `.passive`, `.capture` – listener [options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options).
  * `.prevent`, `.stop` – prevent default or stop propagation.
  * `.window`, `.document`, `.outside`, `.self` – specify event target.
  * `.throttle-<ms>`, `.debounce-<ms>` – defer function call with one of the methods.
  * `.ctrl`, `.shift`, `.alt`, `.meta`, `.arrow`, `.enter`, `.escape`, `.tab`, `.space`, `.backspace`, `.delete`, `.digit`, `.letter`, `.character` – filter by [`event.key`](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values).
  * `.ctrl-<key>, .alt-<key>, .meta-<key>, .shift-<key>` – key combinations, eg. `.ctrl-alt-delete` or `.meta-x`.
  * `.*` – any other modifier has no effect, but allows binding multiple handlers to same event (like jQuery event classes).

</details>


<details>
  <summary><strong>:html</strong> 🔌</summary>

  #### `:html="element"`

  > Include as `import 'sprae/directive/html'`.

  Set html content of an element or instantiate a template.

  ```html
  Hello, <span :html="userElement">Guest</span>.

  <!-- fragment -->
  Hello, <template :html="user.name">Guest</template>.

  <!-- instantiate template -->
  <template :ref="tpl"><span :text="foo"></span></template>
  <div :html="tpl" :scope="{foo:'bar'}">...inserted here...</div>
  ```
</details>


<details>
  <summary><strong>:data</strong> 🔌</summary>

  #### `:data="values"`

  > Include as `import 'sprae/directive/data'`.

  Set `data-*` attributes. CamelCase is converted to dash-case.

  ```html
  <input :data="{foo: 1, barBaz: true}" />
  <!-- <input data-foo="1" data-bar-baz /> -->
  ```
</details>


<details>
  <summary><strong>:aria</strong> 🔌</summary>

  #### `:aria="values"`

  > Include as `import 'sprae/directive/aria'`.

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
  -->
  ```
</details>

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


## Expressions

Expressions use [_justin_](https://github.com/dy/subscript?tab=readme-ov-file#justin), a minimal JS subset. It avoids "unsafe-eval" CSP and provides sandboxing. Also it's _fast_.

###### Operators:

`++ -- ! - + ** * / %  && || ??`<br/>
`= < <= > >= == != === !==`<br/>
`<< >> & ^ | ~ ?: . ?. [] ()=>{} in`

###### Primitives:

`[] {} "" ''`<br/>
`1 2.34 -5e6 0x7a`<br/>
`true false null undefined NaN`


## Signals

Sprae uses minimal signals based on [`ulive`](https://ghub.io/ulive). It can be switched to [`@preact/signals-core`](https://ghub.io/@preact/signals-core), [`@webreflection/signal`](https://ghib.io/@webreflection/signal), [`usignal`](https://ghib.io/usignal), which are better for complex states:

```js
import sprae, { signal, computed, effect, batch, untracked } from 'sprae';
import * as signals from '@preact/signals-core';

sprae.use(signals);

sprae(el, { name: signal('Kitty') });
```


## Customization

Sprae build can be tailored to project needs via `sprae/core` and `sprae/directive/*`:

```js
import sprae, { directive, compile } from 'sprae/core.js'

// include directives
import 'sprae/directive/if.js';
import 'sprae/directive/text.js';

// define custom directive
directive.id = (el, expr, state) => {
  const evaluate = compile(state, 'id') // expression string -> evaluator
  return () => el.id = evaluate(state)  // return update function
}
```

<!--
### DOM diffing

DOM differ uses [swapdom](https://github.com/dy/swapdom), can be reconfigured to [list-difference](https://github.com/paldepind/list-difference/), [udomdiff](https://github.com/WebReflection/udomdiff), [domdiff](https://github.com/WebReflection/domdiff), [etc](https://github.com/luwes/js-diff-benchmark):

```js
import sprae from 'sprae';
import domdiff from 'list-difference';

// swap(parentNode, prevEls, newEls, endNode?)
sprae.use({ swap: domdiff });
```
-->

<!--
### Custom Build

`sprae/core` exports bare-bones engine without directives, which allows tailoring build to project needs:

```js
import sprae, { directive, effect } from 'sprae/core'

// include required directives
import 'sprae/directive/if'
import 'sprae/directive/text'
```
-->


<!-- ## Dispose

To destroy state and detach sprae handlers, call `element[Symbol.dispose]()`. -->


## v9 changes

* No autoinit → use manual init via `import sprae from 'sprae'; sprae(document.body, state)`.
* No default globals (`console`, `setTimeout` etc) - pass to state if required.
* ``:class="`abc ${def}`"`` → `:class="'abc $<def>'"` (_justin_)
* `:with={x:'x'}` -> `:scope={x:'x'}`
* No reactive store → use signals for reactive values.
* `:render="tpl"` → `:html="tpl"`
* `@click="event.target"` → `:onclick="event => event.target"`
* Async props / events are not supported, pass async functions via state.
* Directives order matters, eg. `<a :if :each :scope />` !== `<a :scope :each :if />`
* Only one directive per `<template>`, eg. `<template :each />`, not `<template :if :each/>`


## Justification

[Template-parts](https://github.com/dy/template-parts) / [templize](https://github.com/dy/templize) is progressive, but is stuck with native HTML quirks ([parsing table](https://github.com/github/template-parts/issues/24), [SVG attributes](https://github.com/github/template-parts/issues/25), [liquid syntax](https://shopify.github.io/liquid/tags/template/#raw) conflict etc). [Alpine](https://github.com/alpinejs/alpine) / [petite-vue](https://github.com/vuejs/petite-vue) / [lucia](https://github.com/aidenyabi/lucia) escape native HTML quirks, but have excessive API (`:`, `x-`, `{}`, `@`, `$`) and tend to [self-encapsulate](https://github.com/alpinejs/alpine/discussions/3223) (no access to data, own reactivity, own expressions, own domdiffer).

_Sprae_ holds to open & minimalistic philosophy, combining _`:`-directives_ with _signals_.

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


## Examples

* ToDo MVC: [demo](https://dy.github.io/sprae/examples/todomvc), [code](https://github.com/dy/sprae/blob/main/examples/todomvc.html)
* JS Framework Benchmark: [demo](https://dy.github.io/sprae/examples/js-framework-benchmark), [code](https://github.com/dy/sprae/blob/main/examples/js-framework-benchmark.html)
* Wavearea: [demo](https://dy.github.io/wavearea?src=//cdn.freesound.org/previews/586/586281_2332564-lq.mp3), [code](https://github.com/dy/wavearea)
* Prostogreen [demo](http://web-being.org/prostogreen/), [code](https://github.com/web-being/prostogreen/)

<!--
## See Also

* [nadi](https://github.com/dy/nadi) - 101 signals. -->


<p align="center"><a href="https://github.com/krsnzd/license/">🕉</a></p>
