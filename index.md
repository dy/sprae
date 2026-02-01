---
title: ∴ spræ
---

# ∴ spræ

DOM microhydration — reactive sprinkles for HTML/JSX

<div class="example">
```html
<div :scope="{ q: '', items: ['Apple', 'Apricot', 'Banana', 'Cherry', 'Date', 'Elderberry'] }">
  <input :value="q" placeholder="Search fruits..." />
  <ul>
    <li :each="item in items.filter(i => i.includes(q))" :text="item"></li>
  </ul>
</div>
```

<div class="demo bg-graph-paper" data-scope="{ q: '', items: ['Apple', 'Apricot', 'Banana', 'Cherry', 'Date', 'Elderberry'], match(i) { return i.includes(q) } }">
<input data-value="q" placeholder="Search fruits..." />
<ul>
<li data-each="item in items.filter(match)" data-text="item"></li>
</ul>
</div>
</div>

## why

- ~5kb min+gzip
- No build step
- Standard JS expressions
- Signals-based reactivity
- Works with any backend template
- TypeScript support

## usage

```html
<script type="module" src="//unpkg.com/sprae"></script>

<!-- Tabs -->
<nav :scope="{tab: 'a'}">
  <button :class="{active: tab=='a'}" :onclick="tab='a'">A</button>
  <button :class="{active: tab=='b'}" :onclick="tab='b'">B</button>
  <section :if="tab=='a'">Content A</section>
  <section :if="tab=='b'">Content B</section>
</nav>
```

<div class="tabs" data-scope="{tab:'directives'}">
<button data-class="{active: tab=='directives'}" data-onclick="tab='directives'">Directives <span class="badge">11</span></button>
<button data-class="{active: tab=='modifiers'}" data-onclick="tab='modifiers'">Modifiers <span class="badge">6</span></button>
<div data-if="tab=='directives'">

| directive | description |
|-----------|-------------|
| `:text` | Set text content |
| `:class` | Set className |
| `:style` | Set style |
| `:value` | Bind input/textarea/select value |
| `:<prop>` | Set any attribute/property |
| `:if` `:else` | Conditional rendering |
| `:each` | List rendering |
| `:scope` | Define state container |
| `:ref` | Get element reference |
| `:fx` | Run side effect |
| `:on<event>` | Add event listener |

</div>
<div data-if="tab=='modifiers'">

| modifier | description |
|----------|-------------|
| `.once` | Run only once |
| `.prevent` | Prevent default |
| `.stop` | Stop propagation |
| `.window` | Listen on window |
| `.debounce` | Debounce handler |
| `.throttle` | Throttle handler |

</div>
</div>

## FAQ

**vs Alpine?**
Simpler API, 3x lighter, ESM-first, open state, signals support, prop modifiers. See [comparison](./alpine.md).

**vs vanilla JS?**
`createElement` is wrong mantra. [Just use framework](https://justfuckingusereact.com/).

**vs React/Vue?**
Some find react [not worth the time](https://www.keithcirkel.co.uk/i-dont-have-time-to-learn-react/). Sprae augments [JSX](docs#jsx) for server components.

**Why signals?**
[Standard](https://github.com/tc39/proposal-signals) for reactivity. [Preact-signals](https://github.com/preactjs/signals) provide minimal API surface.

**Is it just a toy?**
Fun to play, production-ready too. 12 versions, 1.5k+ commits.

**Complex state?**
As far as you and CPU can handle it.

**CSP / `new Function`?**
If HTML comes from strangers, there's [safe evaluator](docs#evaluator).

**Components?**
[Manage duplication](https://tailwindcss.com/docs/styling-with-utility-classes#managing-duplication) or plop a [web-component](docs#web-components).

**Browser support?**
Any browser with [Proxy](https://caniuse.com/proxy).

<p align='center' style="margin-top:6rem">
<a href="https://krishnized.github.io/license">ॐ</a>
</p>
