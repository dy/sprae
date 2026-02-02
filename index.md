<div class="no-toc">

# <span class="logo">∴</span> spræ

## DOM microhydration
### Reactive sprinkles for HTML/JSX

</div>

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

<div id="principles-content">

## Principles

**Minimal**
: 5kb gzipped.<br>Standard JS expressions.<br> No new syntax.

**Open**
: State as plain objects.<br>Preact-signals core.<br>Configurable parts.

**Practical**
: No build step, no deps.<br>HTML, JSX, any template.<br>TypeScript support.

</div>

## Usage

```html
<!-- CDN -->
<script src="//unpkg.com/sprae" data-start></script>

<!-- ESM -->
<script type="module">import sprae from 'sprae'</script>
```

[Docs →](docs#faq)

## Reference

<div class="tabs" data-scope="{tab:'directives'}">
<button data-class="{active: tab=='directives'}" data-onclick="tab='directives'">Directives</button>
<button data-class="{active: tab=='modifiers'}" data-onclick="tab='modifiers'">Modifiers</button>
<div data-if="tab=='directives'">

| directive | description | example |
|-----------|-------------|---------|
| `:text` | Set text content | `<span :text="name">` |
| `:html` | Set innerHTML | `<div :html="content">` |
| `:class` | Set classes | `<div :class="{active: isOn}">` |
| `:style` | Set styles | `<div :style="{color}">` |
| `:value` | Bind input value | `<input :value="text">` |
| `:<prop>` | Set any attribute | `<a :href="url">` |
| `:hidden` | Toggle visibility | `<div :hidden="!show">` |
| `:if` `:else` | Conditional render | `<div :if="cond">` |
| `:each` | List render | `<li :each="item in list">` |
| `:scope` | Define state | `<div :scope="{x:1}">` |
| `:ref` | Get element ref | `<input :ref="el">` |
| `:fx` | Run effect | `<div :fx="log(x)">` |
| `:on<event>` | Event listener | `<button :onclick="fn()">` |

</div>
<div data-if="tab=='modifiers'">

| modifier | description | example |
|----------|-------------|---------|
| `.once` | Run once | `:onclick.once` |
| `.prevent` | Prevent default | `:onclick.prevent` |
| `.stop` | Stop propagation | `:onclick.stop` |
| `.window` `.document` `.self` | Change target | `:onkeydown.window` |
| `.away` | Click outside | `:onclick.away` |
| `.debounce` `.throttle` `.delay` | Timing control | `:oninput.debounce-300` |
| `.passive` `.capture` | Listener options | `:onscroll.passive` |
| `.enter` `.esc` `.ctrl` ... | Key filters | `:onkeydown.enter` |

</div>
</div>

[API →](docs#faq)

## FAQ

**Yet another framework?**
: Not a framework. A 5kb enhancer for existing HTML. No build, no ecosystem lock-in.

**What's special?**
: Open state (inspect/modify from console), signals reactivity, modular directives, works with any backend.

**Why not Alpine?**
: 3× lighter, ESM-first, signals, prop modifiers. See [comparison](./alpine.md).

**Why not React/Vue?**
: No build step, no virtual DOM, augments [JSX](docs#jsx--react--nextjs) for server components.

**Is it slow?**
: [Benchmark](https://krausest.github.io/js-framework-benchmark/2024/table_chrome_130.0.6723.58.html). Faster than Alpine, comparable to Vue.

**Components?**
: [Manage duplication](https://tailwindcss.com/docs/styling-with-utility-classes#managing-duplication) or use [web components](docs#web-components).

**Is it maintained?**
: Yes. <span data-scope="{ years: 3, versions: 12 }" data-fx.once="fetch('https://api.github.com/repos/dy/sprae').then(function(r){ return r.ok ? r.json() : null }).then(function(d){ if(d) years = Math.floor((Date.now() - new Date(d.created_at)) / 31536000000) }); fetch('https://api.github.com/repos/dy/sprae/releases').then(function(r){ return r.ok ? r.json() : null }).then(function(d){ if(d) versions = new Set(d.map(function(r){ return r.tag_name.split('.')[0] })).size })"><span data-text="years">3</span>+ years, <span data-text="versions">12</span> major versions</span>. [Roadmap](https://github.com/dy/sprae/issues).

[FAQ →](docs#faq)
