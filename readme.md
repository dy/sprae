# ∴ spræ [![tests](https://github.com/dy/sprae/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprae/actions/workflows/node.js.yml) [![size](https://img.shields.io/bundlephobia/minzip/sprae?label=size)](https://bundlephobia.com/result?p=sprae) [![npm](https://img.shields.io/npm/v/sprae?color=orange)](https://npmjs.org/sprae)

> DOM microhydration with `:` attributes.

_Sprae_ is tiny progressive enhancement lib, a minimal essential alternative to [alpine](https://github.com/alpinejs/alpine), [petite-vue](https://github.com/vuejs/petite-vue) or [template-parts](https://github.com/github/template-parts) with improved ergonomics. It enables simple markup logic without external scripts. Perfect for small websites or prototypes.

## Install

To autoinit on document, include [`sprae.auto.js`](./sprae.auto.js):

```html
<!-- <script src="https://cdn.jsdelivr.net/npm/sprae/sprae.auto.js" defer></script> -->
<script src="./path/to/sprae.auto.js" defer></script>

<a :each="id in ['a','b','c']" :href="`#${id}`"></a>
```

To use as module, import [`sprae.js`](./sprae.js):

```html
<script type="module">
  // import sprae from 'https://cdn.jsdelivr.net/npm/sprae/sprae.js';
  import sprae from './path/to/sprae.js';
  sprae(el, {foo: 'bar'});
</script>
```

## Use

Sprae evaluates attributes starting with `:`:

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

* `sprae` initializes container's subtree with data and immediately evaporates `:` attrs.
* `state` object reflects current values, changing any props rerenders subtree next tick.


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

<!-- Key items to reuse elements -->
<li :each="item in items" :key="item.id" :text="item.value" />

<!-- To avoid FOUC -->
<style>[:each]{visibility: hidden}</style>
```

#### `:text="value"`

Set text content of an element. Default text can be used as fallback:

```html
Welcome, <span :text="user.name">Guest</span>.
```

#### `:class="value"`

Set class value from either string, array or object. Extends existing `class` attribute, if any.

```html
<div :class="`foo ${bar}`"></div>

<!-- extend existing class -->
<div class="foo" :class="`bar`"></div>
<!-- <div class="foo bar"></div> -->

<!-- object with values -->
<div :class="{foo:true, bar: false}"></div>
```

#### `:style="value"`

Set style value from object or a string. Extends existing `style` attribute, if any.

```html
<div :style="foo: bar"></div>
<div :style="{foo: 'bar'}"></div>
<div :style="{'--baz': qux}"></div>
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

#### `:<prop>="value?"`

Set any attribute value or run effect.

```html
<!-- Single property -->
<label :for="name" :text="name" />

<!-- Multiple properties -->
<input :id:name="name" />

<!-- Effect (triggers any time bar changes) -->
<div :fx="void bar()" ></div>
```

#### `:="props?"`

Spread multiple attibures.

```html
<input :="{ id: name, name, type:'text', value }" />
```

#### `:on<event>="handler"`, `:on<in>..on<out>="handler"`

Add event listener or events chain.

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
```

##### Event modifiers

* `.once`, `.passive`, `.capture` – listener [options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options).
* `.prevent`, `.stop` – prevent default or stop propagation.
* `.window`, `.document`, `.outside`, `.self` – specify event target.
* `.throttle-<ms>`, `.debounce-<ms>` – defer function call with one of the methods.
* `.toggle` – run function and its result in turn.
* `.ctrl`, `.shift`, `.alt`, `.meta`, `.arrow`, `.enter`, `.escape`, `.tab`, `.space`, `.backspace`, `.delete`, `.digit`, `.letter`, `.character` – filter by [`event.key`](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values).
* `.ctrl-<key>, .alt-<key>, .meta-<key>, .shift-<key>` – key combinations, eg. `.ctrl-alt-delete` or `.meta-x`.
* `.*` – any other modifier has no effect, but allows binding multiple handlers to same event (like jQuery event classes).

#### `:with="data"`

Define or extend data scope for a subtree.

```html
<!-- Inline data -->
<x :with="{ foo: 'bar' }" :text="foo"></x>

<!-- External data -->
<y :with="data"></y>

<!-- Extend scope -->
<x :with="{ foo: 'bar' }">
  <y :with="{ baz: 'qux' }" :text="foo + baz"></y>
</x>
```

#### `:render="ref"`

Include template as element content.

```html
<template :ref="foo"><span :text="foo"></span></template>

<div :render="foo" :with="{foo:'bar'}">unknown</div>
<div :render="foo" :with="{foo:'baz'}">unknown</div>
```

#### `:ref="id"`

Expose element to current data scope with the `id`:

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

## Sandbox

Expressions are sandboxed, ie. have no access to global or window (since sprae can be run in server environment).

```html
<div :x="window.x"></div>
<!-- window is undefined -->
```

Default sandbox provides: _Array_, _Object_, _Number_, _String_, _Boolean_, _Date_, _console_.<br/>
Sandbox can be extended as `Object.assign(sprae.globals, { BigInt, window, document })`.

## Examples

* TODO MVC: [demo](https://dy.github.io/sprae/examples/todomvc), [code](https://github.com/dy/sprae/blob/main/examples/todomvc.html)
* Wavearea: [demo](https://dy.github.io/wavearea?src=//cdn.freesound.org/previews/586/586281_2332564-lq.mp3), [code](https://github.com/dy/wavearea)

## Justification

* [Template-parts](https://github.com/dy/template-parts) / [templize](https://github.com/dy/templize) is progressive, but is stuck with native HTML quirks ([parsing table](https://github.com/github/template-parts/issues/24), [svg attributes](https://github.com/github/template-parts/issues/25), [liquid syntax](https://shopify.github.io/liquid/tags/template/#raw) conflict etc). Also ergonomics of `attr="{{}}"` is inferior to `:attr=""` since it creates flash of uninitialized values.
* [Alpine](https://github.com/alpinejs/alpine) / [vue](https://github.com/vuejs/petite-vue) / [lit](https://github.com/lit/lit/tree/main/packages/lit-html) escapes native HTML quirks, but the syntax is a bit scattered: `:attr`, `v-*`,`x-*`, `@evt`, `{{}}` can be expressed with single convention. Besides, functionality is too broad and can be reduced to essence: perfection is when there's nothing to take away, not add. Also they tend to [self-encapsulate](https://github.com/alpinejs/alpine/discussions/3223), making interop hard.
* React/[preact](https://ghub.io/preact) does the job wiring up JS to HTML, but with an extreme of migrating HTML to JSX and enforcing SPA, which is not organic for HTML. Also it doesn't support reactive fields (needs render call).

_Sprae_ takes convention of _templize directives_ (_alpine_/_vue_ attrs) and builds upon <del>[_@preact/signals_](https://ghub.io/@preact/signals)</del> simple reacti.

* It doesn't break or modify initial static html markup.
* It falls back to element content if uninitialized.
* It doesn't enforce SPA nor JSX.
* It enables island hydration.
* It reserves minimal syntax space as `:` convention (keeping tree neatly decorated, not scattered).
* Expressions are naturally reactive and incur minimal updates.
* Input data may contain [signals](https://ghub.io/@preact/signals) or [reactive values](https://ghub.io/sube).
* Elements / data API is open and enable easy interop.

It is reminiscent of [XSLT](https://www.w3schools.com/xml/xsl_intro.asp), considered a [buried treasure](https://github.com/bahrus/be-restated) by web-connoisseurs.


<p align="center"><a href="https://github.com/krsnzd/license/">🕉</a></p>
