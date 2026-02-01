---
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

**Yet another framework?** — Not a framework. A 5kb enhancer for existing HTML. No build, no ecosystem lock-in.

**What's special?** — Open state (inspect/modify from console), signals reactivity, modular directives, works with any backend.

**Why not Alpine?** — 3× lighter, ESM-first, signals, prop modifiers. See [comparison](./alpine.md).

**Why not React/Vue?** — No build step, no virtual DOM, augments [JSX](docs#jsx--react--nextjs) for server components.

**Is it slow?** — [Benchmark](https://krausest.github.io/js-framework-benchmark/2024/table_chrome_130.0.6723.58.html). Faster than Alpine, comparable to Vue.

**Components?** — [Manage duplication](https://tailwindcss.com/docs/styling-with-utility-classes#managing-duplication) or use [web components](docs#web-components).

**Is it maintained?** — Yes. <span data-scope="{ years: 3, versions: 12 }" data-fx.once="fetch('https://api.github.com/repos/dy/sprae').then(function(r){ return r.json() }).then(function(d){ years = Math.floor((Date.now() - new Date(d.created_at)) / 31536000000) }); fetch('https://api.github.com/repos/dy/sprae/releases').then(function(r){ return r.json() }).then(function(d){ versions = new Set(d.map(function(r){ return r.tag_name.split('.')[0] })).size })"><span data-text="years">3</span>+ years, <span data-text="versions">12</span> major versions</span>. [Roadmap](https://github.com/dy/sprae/issues).

[More FAQ →](docs#faq)
