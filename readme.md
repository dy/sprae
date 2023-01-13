# ∴ spræ [![tests](https://github.com/dy/sprae/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprae/actions/workflows/node.js.yml) [![size](https://img.shields.io/bundlephobia/minzip/sprae?label=size)](https://bundlephobia.com/result?p=sprae) [![npm](https://img.shields.io/npm/v/sprae?color=orange)](https://npmjs.org/sprae)

> DOM microhydration with `:` attributes

A lightweight essential alternative to [alpine](https://github.com/alpinejs/alpine), [petite-vue](https://github.com/vuejs/petite-vue), [templize](https://github.com/dy/templize) or JSX with better ergonomics[*](#justification).<br>
It is reminiscent of [XSLT](https://www.w3schools.com/xml/xsl_intro.asp), considered a [buried treasure](https://github.com/bahrus/be-restated) by web-connoisseurs.


## Usage

Sprae defines attributes starting with `:` as directives:

```html
<div id="container" :if="user">
  Logged in as <span :text="user.displayName">Guest.</span>
</div>

<script type="module">
  import sprae from 'sprae';

  const state = sprae(container, { user: { displayName: 'Dmitry Ivanov' } });
  state.user.displayName = 'dy'; // automatically updates DOM
</script>
```

* `sprae` initializes subtree with data and immediately evaporates `:` attrs.
* `state` is object reflecting current values, changing any of its props rerenders subtree.

<!--
<details>
<summary><strong>Autoinit</strong></summary>

sprae can be used without build step or JS, autoinitializing document:

```html
<script src="./sprae.js" defer init="{ count: 0 }"></script>

<span :text="count">
<button :on="{ click: e => count++ }">inc</button>
```

* `:with` defines data for regions of the tree to autoinit sprae on.
* `init` attribute tells sprae to automatically initialize document.

</details>
-->

## Attributes

#### `:if="condition"`, `:else`

Control flow of elements.

```html
<span :if="foo">foo</span>
<span :else :if="bar">bar</span>
<span :else>baz</span>
```

#### `:each="item, index in items"`

Multiply element. `index` value starts from 1. Use `:key` as caching key to avoid rerendering.

```html
<ul>
  <li :each="item in items" :text="item">Untitled</li>
</ul>

<!-- Cases -->
<li :each="item, idx in list" />
<li :each="val, key in obj" />
<li :each="idx, idx0 in number" />

<!-- Loop by condition -->
<li :if="items" :each="item in items" :text="item" />
<li :else>Empty list</li>

<!-- To avoid FOUC -->
<style>[:each]{visibility: hidden}</style>
```

#### `:text="value"`

Set text content of an element. Default text can be used as fallback:

```html
Welcome, <span :text="user.name">Guest</span>.
```

#### `:class="value"`

Set class value from either string, array or object. Extends direct class, rather than replaces.

```html
<div :class="`foo ${bar}`"></div>
<div :class="['foo', 'bar']"></div>
<div :class="{foo: true, bar: false}"></div>

<div class="a" :class="['b', 'c']"></div>
<!--
<div class="a b c"></div>
-->
```

#### `:style="value"`

Set style value from object or a string. Extends style.

```html
<div :style="foo: bar"></div>
<div :style="{foo: 'bar'}"></div>
```

#### `:value="value"`

Set value of an input, textarea or select. Takes handle of `checked` and `selected` attributes.

```html
<input :value="text" />
<textarea :value="text" />

<select :value="selected">
  <option :each="i in 5" :value="i" :text="i"></option>
</select>
```

#### `:<prop>="value?"`, `:="props?"`

Set any attribute value or run effect.

```html
<!-- Single property -->
<label :for="name" :text="name" />

<!-- Multiple properties -->
<input :id:name="name" />

<!-- Bulk properties -->
<input :="{ id: name, name, type:'text', value }" />

<!-- Effect (triggers any time foo or bar changes) -->
<div :="if (foo) bar()" :fx="void bar()" ></div>
```

#### `:on<event>="handler"`, `:on="events"`, `:<in>..<out>="handler"`

Add event listeners.

```html
<!-- Single event -->
<input type="checkbox" :onchange="e => isChecked=e.target.value">

<!-- Multiple events -->
<input :value="text" :oninput:onchange="e => text=e.target.value">

<!-- Sequence of events -->
<button :onfocus..onblur="e => {
  // onfocus
  let id = setInterval(track,200)
  return e => {
    // onblur
    clearInterval(id)
  }
}">

<!-- Event modifiers -->
<button :onclick.throttle-500="handler">Not too often</button>

<!-- Bulk/custom events -->
<button :on="{ click: handler, touch: handler, special: handler }">Submit</button>
```

##### Event modifiers

Events support following modifiers:

* `.once`, `.passive`, `.capture` – listener [options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options).
* `.prevent`, `.stop` – prevent default or stop propagation.
* `.window`, `.document`, `.outside`, `.self` – specify event target.
* `.throttle-108`, `.debounce-108` – define throttling or postponing callback with (optional) timeout in ms.
* `.ctrl`, `.shift`, `.alt`, `.meta`, `.cmd`, `.down`, `.up`, `.left`, `.right`, `.arrowdown`, `.arrowup`, `.arrowleft`, `.arrowright`, `.end`, `.home`, `.pagedown`, `.pageup`, `.enter`, `.plus`, `.minus`, `.star`, `.slash`, `.period`, `.equal`, `.underscore`, `.esc`, `.escape`, `.tab`, `.space`, `.backspace`, `.delete` – filter by [`event.key`](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values).
* `.*` – any other modifier has no effect, but allows binding multiple handlers to same event (like jQuery event classes).

#### `:data="values"`

Set [data-*](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*) attributes. CamelCase is converted to dash-case.

```html
<input :data="{foo: 1, barBaz: true}" />
<!--
<input data-foo="1" data-bar-baz="true" />
-->
```

#### `:aria="values"`

Set [aria-role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) attributes. Boolean values are stringified.

```html
<input role="combobox" :aria="{
  controls: 'joketypes',
  autocomplete: 'list',
  expanded: false,
  activeOption: 'item1',
  activedescendant: ''
}" />
<!--
<input role="combobox" aria-controls="joketypes" aria-autocomplete="list" aria-expanded="false" aria-active-option="item1" aria-activedescendant="">
-->
```

#### `:with="data"`

Define variables for a subtree fragment scope.

```html
<!-- Inline data -->
<x :with="{ foo: 'bar' }" :text="foo"></x>

<!-- External data -->
<y :with="data"></y>

<!-- Transparency -->
<x :with="{ foo: 'bar' }">
  <y :with="{ baz: 'qux' }" :text="foo + baz"></y>
</x>
```

#### `:ref="id"`

Expose element to data scope with the `id`:

```html
<!-- single item -->
<textarea :ref="text" placeholder="Enter text..."></textarea>

<!-- iterable items -->
<ul>
  <li :each="item in items" :ref="item">
    <input :onfocus..onblur="e => (item.classList.add('editing'), e => item.classList.remove('editing'))"/>
  </li>
</ul>

<script type="module">
  import sprae from 'sprae';
  let state = sprae(document, {items: ['a','b','c']})

  // element is in the state
  state.text // <textarea></textarea>
</script>
```


<!--

### Reactivity

_sprae_ is built on top of [_@preact/signals_](https://ghub.io/@preact/signals). That gives:

* Expressions don't require explicit access to `.value` (see [signal-struct](https://github.com/dy/signal-struct))
* Expressions support any reactive values in data (see [sube](https://github.com/dy/sube))
* Updates happen minimally only when used values update
* Subscription is weak and get disposed when element is disposed.

Directive expressions are natively reactive, ie. data may contain any async/reactive values, such as:

* _Promise_ / _Thenable_
* _Observable_ / _Subject_ / _Subscribable_
* _AsyncIterable_
* _observ-*_
* etc., see [sube](https://github.com/dy/sube/blob/main/README.md) for the full list.

This way, for example, _@preact/signals_ or _rxjs_ can be connected directly bypassing subscription or reading value.
-->

## Hints

**1.** To batch-update state (avoid multiple DOM changes), rerun sprae with new state:

```html
<li :each="item, id in items" :key="id" :text="item"></li>

<script type="module">
  sprae(el, {items: ['foo', 'bar', 'baz']})
  // <li>foo</li><li>bar</li><li>baz</li>

  sprae(el, {items: ['foo', 'qux']})
  // <li>foo</li><li>qux</li>
</script>
```

**2.** Data supports signal values, which can be an alternative way to control template state:

```html
<div id="done" :text="loading ? 'loading' : result">...</div>

<script type="module">
  import sprae from 'sprae';
  import { signals } from '@preact/signals';

  // <div id="done">...</div>

  const loading = signal(true), result = signal(false);
  sprae(done, { loading, result })
  setTimeout(() => (loading.value = true, result.value = 'done'), 1000)

  // <div id="done">loading</div>

  // ... 1s after
  // <div id="done">done</div>
</script>
```

**3.** Data recognizes reactive values as inputs as well: _Promise_ / _Thenable_, _Observable_ / _Subscribable_, _AsyncIterable_ (etc., see [sube](https://github.com/dy/sube/blob/main/README.md)). This way, for example, _rxjs_ can be connected to template directly.

```html
<div :text="clicks">#</div> clicks

<script type="module">
  import sprae from 'sprae';
  import { fromEvent, scan } from 'rxjs';
  sprae(document, {
    clicks: fromEvent(document, 'click').pipe(scan((count) => count + 1, 0))
  });
</script>
```

**4.** Getters turn into computed values automatically (setters remain as is):

```html
<div id="x-plus-y">
  <span :text="x">x</span> + <span :text="y">y</span> = <span :text="z">z</span>
</div>

<script type="module">
  import sprae from 'sprae';
  let state = sprae(document, { x:1, y:1, get z() { return this.x + this.y } })

  state.x = 2, state.y = 2
  state.z // 4
</script>
```

## Examples

* TODO MVC: [demo](https://dy.github.io/sprae/examples/todomvc), [code](https://github.com/dy/sprae/blob/main/examples/todomvc.html)
* Waveplay: [demo](https://dy.github.io/waveplay), [code](https://github.com/dy/waveedit)

## Justification

* [Template-parts](https://github.com/dy/template-parts) / [templize](https://github.com/dy/templize) is progressive, but is stuck with native HTML quirks ([parsing table](https://github.com/github/template-parts/issues/24), [svg attributes](https://github.com/github/template-parts/issues/25), [liquid syntax](https://shopify.github.io/liquid/tags/template/#raw) conflict etc). Also ergonomics of `attr="{{}}"` is inferior to `:attr=""` since it creates flash of uninitialized values.
* [Alpine](https://github.com/alpinejs/alpine) / [vue](https://github.com/vuejs/petite-vue) / [lit](https://github.com/lit/lit/tree/main/packages/lit-html) escapes native HTML quirks, but the syntax is a bit scattered: `:attr`, `v-*`,`x-*`, `@evt`, `{{}}` can be expressed with single convention. Besides, functionality is too broad and can be reduced to essence: perfection is when there's nothing to take away, not add. Also they tend to [self-encapsulate](https://github.com/alpinejs/alpine/discussions/3223), making interop hard.
* React/[preact](https://ghub.io/preact) does the job wiring up JS to HTML, but with an extreme of migrating HTML to JSX and enforcing SPA, which is not organic for HTML. Also it doesn't support reactive fields (needs render call).

_sprae_ takes convention of _templize directives_ (_alpine_/_vue_ attrs) and builds upon [_@preact/signals_](https://ghub.io/@preact/signals).

* It doesn't break static html markup.
* It falls back to element content if uninitialized.
* It doesn't enforce SPA nor JSX.
* It enables island hydration.
* It reserves minimal syntax space as `:` convention (keeping tree neatly decorated, not scattered).
* Expressions are naturally reactive and incur minimal updates.
* Input data may contain [signals](https://ghub.io/@preact/signals) or [reactive values](https://ghub.io/sube).
* Elements / data API is open and enable easy interop.

<p align="center"><a href="https://github.com/krsnzd/license/">🕉</a></p>
