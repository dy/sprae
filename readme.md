# ∴ spræ [![size](https://img.shields.io/bundlephobia/minzip/sprae?label=size)](https://bundlephobia.com/result?p=sprae)

> Soft DOM hydration with reactive attributes

A lightweight essential alternative to [alpine](https://github.com/alpinejs/alpine), [petite-vue](https://github.com/vuejs/petite-vue), [templize](https://github.com/dy/templize) or JSX with better ergonomics[*](#justification).


## Usage

Spraydrops (directives) are attributes starting with `:`. Once initialized, they immediately evaporate.

```html
<div id="container" :if="user">
  Logged in as <span :text="user.displayName">Guest.</span>
</div>

<script type="module">
  import sprae from 'sprae';

  const [state, update] = sprae(container, { user: { displayName: 'Dmitry Ivanov' } });
  state.user.displayName = 'dy'; // automatically updates DOM
</script>
```

* `sprae` initializes directives within subtree with data (can include [signals](https://github.com/preactjs/signals) or [reactive values](https://github.com/dy/sube)).
* `state` is object reflecting directives values, changing any of its props updates corresponding directives.

<!--
<details>
<summary><strong>Autoinit</strong></summary>

Sprae can be used without build step or JS, autoinitializing document:

```html
<script src="./sprae.js" defer init="{ count: 0 }"></script>

<span :text="count">
<button :on="{ click: e => count++ }">inc</button>
```

* `:with` defines data for regions of the tree to autoinit sprae on.
* `init` attribute tells sprae to automatically initialize document.

</details>
-->

## Directives

* `:if="condition"`, `:else` - controls flow of elements.
* `:each="item, i? in list|number"` - create multiple instances of element from list or 1..number range.
* `:text="value"` - set text content of an element.
* `:value="value"` – bind value to input or textarea (reflected in model).
* `:id`, `:name`, `:for`, `:type`, `:hidden`, `:disabled`, `:href`, `:src` – common attributes setters.
* `:class="[ foo, 'bar' ]"` – set element class from an array, object or a string.
* `:style="{ top:1, position:'absolute' }"` – set element style from a string or an object.
* `:prop="{ alt:'foo', title:'bar' }"` – set any other attribute / property.
* `:on="{ click:e=>{}, touch:e=>{} }"` – add event listeners.
* `:data="{ foo:1, bar:2 }"` – set [data-*](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*) attributes.
* `:aria="{ role:'progressbar' }"` – set [aria-role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) attributes.
* `:with="data"` – data scope for a subtree fragment.

### Combining directives

Directives can be combined as:

```html
<!-- chain of conditions -->
<span :if="foo">foo</span>
<span :else :if="bar">bar</span>
<span :else>baz</span>

<!-- Loop by condition -->
<span :if="items" :each="item in items">...</span>
<span :else>Empty list</span>
```

<!--
### Reactive values

Directive expressions are natively reactive, ie. data may contain any async/reactive values, such as:

* _Promise_ / _Thenable_
* _Observable_ / _Subject_ / _Subscribable_
* _AsyncIterable_
* _observ-*_
* etc., see [sube](https://github.com/dy/sube/blob/main/README.md) for the full list.

This way, for example, _@preact/signals_ or _rxjs_ can be connected directly bypassing subscription or reading value.

Update happens when any value changes:

```html
<div id="done" :text="loading ? 'loading' : result">...</div>

<script>
  import sprae from 'sprae';
  import { signals } from '@preact/signals';

  // <div id="done">...</div>

  const loading = signal(true), result = signal(false);

  sprae(done, { loading, result })

  // <div id="done">loading</div>

  setTimeout(() => (loading.value = true, result.value = 'done'), 1000)

  // ... 1s after
  // <div id="done">done</div>
</script>
```

Internally directives trigger updates only for used properties change. They subscribe in weak fashion and get disposed when element is disposed.
-->


## Justification

* [Template-parts](https://github.com/dy/template-parts) / [templize](https://github.com/dy/templize) is progressive, but is stuck with native HTML quirks ([parsing table](https://github.com/github/template-parts/issues/24), [svg attributes](https://github.com/github/template-parts/issues/25), [liquid syntax](https://shopify.github.io/liquid/tags/template/#raw) conflict etc). Also ergonomics of `attr="{{}}"` is inferior to `:attr=""` since it creates flash of uninitialized values.
* [Alpine](https://github.com/alpinejs/alpine) / [vue](https://github.com/vuejs/petite-vue) / [lit](https://github.com/lit/lit/tree/main/packages/lit-html) escapes native HTML quirks, but the syntax is a bit scattered: `:attr`, `v-*`,`x-*`, `@evt`, `{{}}` can be expressed with single convention. Besides, functionality is too broad and can be reduced to essence. Also they tend to [self-encapsulate](https://github.com/alpinejs/alpine/discussions/3223), making interop hard.
* [preact](https://ghub.io/preact) with HTML as JSX is a nice way to wire JS to templates, but it doesn't really support reactive fields (needs render call). Also migrating HTML to JS is an extreme with unwanted side-effects.

_Sprae_ takes elegant syntax convention of _alpine_ and method of _templize_ to connect any reactive values (like [@preact/signals](https://ghub.io/@preact/signals) or observables) to static HTML.

* It doesn't break static html markup.
* It doesn't intrude native syntax space.
* It falls back to element content if uninitialized.
* It provides means for island hydration.
* It doesn'y introduce syntax scatter.
* It supports simple expressions with exposed reactive data types.

<!--

## Plugins

* @sprae/tailwind: `<x :tw="mt-1 mx-2"></x>` - separate tailwind utility classes from main ones; allow conditional setters.
* @sprae/item: `<x :item="{type:a, scope:b}"` – provide microdata
* @sprae/hcodes: `<x :h=""` – provide microformats

-->

<p align="center"><a href="https://github.com/krsnzd/license/">🕉</a></p>
