# ∴ sporae

Reactive directives with expressions for DOM microtemplating.<br/>
A lightweight alternative to [alpine](https://github.com/alpinejs/alpine), [petite-vue](https://github.com/vuejs/petite-vue) and [templize](https://github.com/dy/templize) with better ergonomics[*](#justification).


## Usage

```html
<script src="./sporae.js" defer init></script>

<div :scope="{ count: 0 }">
  <span :text="count">
  <button :on="{ click: e => count++ }">inc</button>
</div>
```

* `:scope` marks regions on the tree that should be controlled by sporae.
* `init` attribute tells sporae to automatically initialize all elements that have `:scope`.

## Manual init

The more direct case is initializing sporae via JS.

```html
<div id="element" :if="user">
  Logged in as <span :text="user.displayName">Guest.</span>
</div>

<script type="module">
  import init from 'sporae';

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


## Directives

* `:scope="data"` – sporae subtree data for autoinit.
* `:if="condition"`, `:else-if="condition"`, `:else` - controls flow of elements.
* `:each="item, idx? in list"` - map list to instances of an element.
* `:text="value"` - set text content of an element.
* `:value="value"` – bind value to input or textarea.
* `:id`, `:name`, `:for`, `:type`, `:hidden`, `:disabled`, `:href`, `:src` – common attributes setters.
* `:class="[ foo, 'bar' ]"` – set element class from an array, object or a string.
* `:style="{ top:1, position:'absolute' }"` – set element style from a string or an object.
* `:prop="{ alt:'foo', title:'bar' }"` – set any attribute / property.
* `:on="{ click:e=>{}, touch:e=>{} }"` – add event listeners.
* `:data="{ foo:1, bar:2 }"` – set [data-*](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*) attributes.
* `:aria="{ role:'progressbar' }"` – set [aria-role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) attributes.
* `:item="{ id: 1 }"` – set [item*](https://developer.mozilla.org/en-US/docs/Web/HTML/Microdata) microdata attribute.

<!--
### Loops

Iterating over set of items can be done with `:each` directive:

```html
<ul>
  <li :each="item, index in items" :id="'item-' + item.id" :data="{value:item.value}" :text="item.label"></li>
</ul>

<li :each="{{ item, index in array }}">
<li :each="{{ key, value, index in object }}">
<li :each="{{ value in object }}">
```

### Conditions

To optionally display an element, there are `if`, `else-if`, `else` directives.

```html
<span :if="status == 0">Inactive</span>
<span :else-if="status == 1">Active</span>
<span :else>Finished</span>
```
-->

### Adding directives

Directives can be added by registering them via `directive(name, onCreate, onUpdate)`:

```js
import init, { directive } from 'sporae'

directive(':html',
  (el, expr, state) => {
    el._eval = parseExpression(expr)
  },
  (el, expr, state) => {
    el.innerHTML = el._eval(state)
  }
)
```


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
  import spores from 'sporae';
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

_Sporae_ takes elegant syntax convention of _alpine_ and method of _templize_ to connect any reactive values (like [@preact/signals](https://ghub.io/@preact/signals) or observables) to static HTML.

* It doesn't break nor introduce template values to static html markup.
* It provides falls back to element content if uninitialized.
* It provides means for island hydration.
* It doesn't introduce syntax noise.
* It supports simple expressions with exposed reactive data types.

<p align="center"><a href="https://github.com/krsnzd/license/">🕉</a></p>
