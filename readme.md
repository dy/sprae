# ∴ spræ

> Reactive directives for DOM microtemplating: moisturize tree without trasplanting to JSX.

A lightweight essential alternative to [alpine](https://github.com/alpinejs/alpine), [petite-vue](https://github.com/vuejs/petite-vue) and [templize](https://github.com/dy/templize) with better ergonomics[*](#justification).


## Usage

```html
<div id="element" :if="user">
  Logged in as <span :text="user.displayName">Guest.</span>
</div>

<script type="module">
  import init from 'sprae';

  const data = { user: { displayName: 'Dmitry Ivanov' } }
  const [state, update] = init(user, data);

  state.user.displayName = 'dy'       // update value
  update({user: {displayName: 'dy'}}) // alternatively
</script>
```

* `init` initializes directives within an `element` subtree with passed `data`.
* `state` is proxy reflecting used values, changing any of its props updates directives.
* `update` can be used for bulk-updating multiple props.
* `data` is the initial state to render the template. It can include reactive values, see [reactivity](#reactivity).

## Autoinit

Sprae can be used without build step or JS, autoinitializing HTML:

```html
<script src="./sprae.js" defer init></script>

<div :scope="{ count: 0 }">
  <span :text="count">
  <button :on="{ click: e => count++ }">inc</button>
</div>
```

* `:scope` marks regions on the tree that should be controlled by sprae.
* `init` attribute tells sprae to automatically initialize all elements that have `:scope`.
* any attribute starting with `:` is considered a sprae directive.


## Directives

<details><summary><code>:if="condition"</code>, <code>:else-if="condition"</code>, <code>:else</code> - controls flow of elements.</summary>

Example:

```html
<span :if="status == 0">Inactive</span>
<span :else-if="status == 1">Active</span>
<span :else>Finished</span>
```

Note for text conditions can be used ternary operator:

```html
Status: <span :text="status === 0 ? 'Inactive' : 'Active'">Initializing</span>
```

</details>

<details><summary><code>:each="item, idx? in list"</code> - create multiple instances of element by mapping list.</summary>

Iterating over set of items can be done with `:each` directive:

```html
<ul>
  <li :each="item, index in items" :id="`item-${item.id}`" :data="{ value: item.value }" :text="item.label"></li>
</ul>
```

Cases:

```html
<li :each="item, index in array">
<li :each="value, key in object">
```

</details>

<details><summary><code>:text="value"</code> - set text content of an element.</summary>

</details>

<details><summary><code>:value="value"</code> – bind value to input or textarea.</summary>

</details>

<details><summary><code>:id</code>, <code>:name</code>, <code>:for</code>, <code>:type</code>, <code>:hidden</code>, <code>:disabled</code>, <code>:href</code>, <code>:src</code> – common attributes setters.</summary>

</details>

<details><summary><code>:class="[ foo, 'bar' ]"</code> – set element class from an array, object or a string.</summary>

</details>

<details><summary><code>:style="{ top:1, position:'absolute' }"</code> – set element style from a string or an object.</summary>

</details>

<details><summary><code>:prop="{ alt:'foo', title:'bar' }"</code> – set any attribute / property.</summary>

</details>

<details><summary><code>:on="{ click:e=>{}, touch:e=>{} }"</code> – add event listeners.</summary>

</details>

<details><summary><code>:data="{ foo:1, bar:2 }"</code> – set <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*">data-*</a> attributes.</summary>

</details>

<details><summary><code>:aria="{ role:'progressbar' }"</code> – set <a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA">aria-role</a> attributes.</summary>

</details>

<details><summary><code>:item="{ id: 1 }"</code> – set <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Microdata">item*</a> microdata attributes.</summary>

</details>

<details><summary><code>:scope="data"</code> – autoinit subtree.</summary></details>

<details>
<summary><h3>Adding directives</h3></summary>

Directives can be added by registering them via `directive(name, initializer)`:

```js
import init, { directive } from 'sprae'

directive(':html', (el, expr) => {
  // ...initialize here
  const evaluate = parseExpression(expr)
  return (state) => {
    // ...update here
    el.innerHTML = evaluate(state)
  }
})
```

</details>


## Reactivity

Directive expressions are naturally reactive, ie. data may contain any async/reactive values, such as:

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
  import spores from 'sprae';
  import { signals } from '@preact/signals';

  // <div id="done">...</div>

  const loading = signal(true),
        result = signal(false);
  spores(done, { loading, result })

  // <div id="done">loading</div>

  setTimeout(() => (loading.value = true, result.value = 'done'), 1000)

  // ... 1s after
  // <div id="done">done</div>
</script>
```

Note: observers don't require disposal, since they're connected in weak fashion. Once element is disposed, observables are disconnected.



## Justification

* [Template-parts](https://github.com/dy/template-parts) / [templize](https://github.com/dy/templize) is progressive, but is stuck with native HTML quirks (parsing table case, svg attributes, conflict with liquid syntax etc). Besides ergonomics of `attr="{{}}"` is inferior to `:attr=""` since it creates flash of uninitialized values.
* [Alpine](https://github.com/alpinejs/alpine) / [vue](https://github.com/vuejs/petite-vue) / [lit](https://github.com/lit/lit/tree/main/packages/lit-html) escapes native HTML quirks, but the syntax is a bit scattered: `:attr`, `v-*`,`x-*`, `@evt`, `{{}}` can be expressed with single convention. Besides, functionality is too broad and can be reduced to essence.
* [preact](https://ghub.io/preact) with HTML as JSX is a nice way to wire JS to templates, but it doesn't really support reactive fields (needs render call). Also migrating HTML to JS is an extreme with unwanted side-effects.

_Sprae_ takes elegant syntax convention of _alpine_ and method of _templize_ to connect any reactive values (like [@preact/signals](https://ghub.io/@preact/signals) or observables) to static HTML.

* It doesn't break static html markup.
* It doesn't intrude native syntax space.
* It falls back to element content if uninitialized.
* It provides means for island hydration.
* It doesn'y introduce syntax scatter.
* It supports simple expressions with exposed reactive data types.

<p align="center"><a href="https://github.com/krsnzd/license/">🕉</a></p>
