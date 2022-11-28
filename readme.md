# ∴ sprea [![tests](https://github.com/dy/sprea/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprea/actions/workflows/node.js.yml) [![size](https://img.shields.io/bundlephobia/minzip/sprea?label=size)](https://bundlephobia.com/result?p=sprea) [![npm](https://img.shields.io/npm/v/sprea?color=orange)](https://npmjs.org/sprea)

> DOM microhydration with `:` attributes

A lightweight essential alternative to [alpine](https://github.com/alpinejs/alpine), [petite-vue](https://github.com/vuejs/petite-vue), [templize](https://github.com/dy/templize) or JSX with better ergonomics[*](#justification).


## Usage

Sprea defines attributes starting with `:` as directives:

```html
<div id="container" :if="user">
  Logged in as <span :text="user.displayName">Guest.</span>
</div>

<script type="module">
  import sprea from 'sprea';

  const state = sprea(container, { user: { displayName: 'Dmitry Ivanov' } });
  state.user.displayName = 'dy'; // automatically updates DOM
</script>
```

* `sprea` initializes subtree with data and immediately evaporates `:` attrs.
* `state` is object reflecting current values, changing any of its props rerenders subtree.

<!--
<details>
<summary><strong>Autoinit</strong></summary>

sprea can be used without build step or JS, autoinitializing document:

```html
<script src="./sprea.js" defer init="{ count: 0 }"></script>

<span :text="count">
<button :on="{ click: e => count++ }">inc</button>
```

* `:with` defines data for regions of the tree to autoinit sprea on.
* `init` attribute tells sprea to automatically initialize document.

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

Multiply element. `index` value starts from 1.

```html
<ul :with="{items: ['a','b','c']}">
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

Set class value from either string, array or object.

```html
<div :class="`foo ${bar}`"></div>
<div :class="['foo', 'bar']"></div>
<div :class="{foo: true, bar: false}"></div>
```

#### `:style="value"`

Set style value from object or a string.

```html
<div :style="foo: bar"></div>
<div :style="{foo: 'bar'}"></div>
```

<!--
#### `:value="value"`

Bind (2-way) value to input, textarea or select.

```html
<input :with="{text: ''}" :value="text" />
<textarea :with="{text: ''}" :value="text" />

<select :with="{selected: 0}" :value="selected">
  <option :each="i in 5" :value="i" :text="i"></option>
</select>
```
-->

#### `:<prop>="value"`, `:="props"`

Set any other prop or props value.

```html
<label :for="name" :text="name" />
<input :="{ id: name, name, type, value }" :onchange="e => value=e.target.value" />
```

#### `:on="events"`

Add event listeners.

```html
<button :on="{ click: handler, touch: handler }">Submit</button>
```

#### `:data="values"`

Set [data-*](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*) attributes. CamelCase is converted to dash-case.

```html
<input :data="{foo: 1, barBaz: true}" />
```

#### `:aria="values"`

Set [aria-role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) attributes. Boolean values are stringified.

```html
<input type="text" id="jokes" role="combobox" :aria="{
  controls: 'joketypes',
  autocomplete: 'list',
  expanded: false,
  activeOption: 'item1',
  activedescendant: ''
}" />
```

#### `:with="data"`

Set data for a subtree fragment scope.

```html
<x :with="{ foo: 'bar' }">
  <y :with="{ baz: 'qux' }" :text="foo + baz"></y>
</x>
```

#### `:ref="id"`

Expose element to a subtree fragment with the `id`.

```html
<li :ref="item">
  <input
    :onfocus="e=> item.classList.add('editing')"
    :onblur="e => item.classList.remove('editing')"
  />
</li>
```

<!--

### Reactivity

_Sprea_ is built on top of [_@preact/signals_](https://ghub.io/@preact/signals). That gives:

* Expressions don't require explicit access to `.value` (see [signal-struct](https://github.com/dy/signal-struct))
* Expressions support any reactive values in data (see [sube](https://github.com/dy/sube))
* Updates happen minimally only when used values update
* Subscription is weak and get disposed when element is disposed.
-->
<!--
Directive expressions are natively reactive, ie. data may contain any async/reactive values, such as:

* _Promise_ / _Thenable_
* _Observable_ / _Subject_ / _Subscribable_
* _AsyncIterable_
* _observ-*_
* etc., see [sube](https://github.com/dy/sube/blob/main/README.md) for the full list.

This way, for example, _@preact/signals_ or _rxjs_ can be connected directly bypassing subscription or reading value.

Update happens when any value changes:
-->
<!--
```html
<div id="done" :text="loading ? 'loading' : result">...</div>

<script>
  import sprea from 'sprea';
  import { signals } from '@preact/signals';

  // <div id="done">...</div>

  const loading = signal(true), result = signal(false);

  sprea(done, { loading, result })

  // <div id="done">loading</div>

  setTimeout(() => (loading.value = true, result.value = 'done'), 1000)

  // ... 1s after
  // <div id="done">done</div>
</script>
```
-->

## Justification

* [Template-parts](https://github.com/dy/template-parts) / [templize](https://github.com/dy/templize) is progressive, but is stuck with native HTML quirks ([parsing table](https://github.com/github/template-parts/issues/24), [svg attributes](https://github.com/github/template-parts/issues/25), [liquid syntax](https://shopify.github.io/liquid/tags/template/#raw) conflict etc). Also ergonomics of `attr="{{}}"` is inferior to `:attr=""` since it creates flash of uninitialized values.
* [Alpine](https://github.com/alpinejs/alpine) / [vue](https://github.com/vuejs/petite-vue) / [lit](https://github.com/lit/lit/tree/main/packages/lit-html) escapes native HTML quirks, but the syntax is a bit scattered: `:attr`, `v-*`,`x-*`, `@evt`, `{{}}` can be expressed with single convention. Besides, functionality is too broad and can be reduced to essence. Also they tend to [self-encapsulate](https://github.com/alpinejs/alpine/discussions/3223), making interop hard.
* [preact](https://ghub.io/preact) with HTML as JSX is a nice way to wire JS to templates, but it doesn't really support reactive fields (needs render call). Also migrating all HTML to JS is an extreme: SPAs are not organic for HTML.

_Sprea_ takes short syntax convention of _alpine_/_vue_ and method of _templize_ with [@preact/signals](https://ghub.io/@preact/signals) to hydrate static HTML.

* It doesn't break static html markup.
* It falls back to element content if uninitialized.
* It doesn't enforce SPA nor JSX.
* It enables island hydration.
* It introduces minimal syntax space as `:` convention.
* Expressions are naturally reactive and incur minimal updates.
* Input data may contain [signals](https://ghub.io/@preact/signals) or [reactive values](https://ghub.io/sube).

<p align="center"><a href="https://github.com/krsnzd/license/">🕉</a></p>
