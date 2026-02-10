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

**HTML-native**
: Add `:` attribs to existing HTML.<br>Standard JS expressions.<br>No build step, no config.

**Open state**
: Controllable. ESM-first.<br>[Preact signals](https://github.com/preactjs/signals) enabled.<br>Sandboxed. Safe eval.

**5kb, 0 deps**
: CDN `<script>` or `npm i`.<br>Any backend, any template, +JSX.<br>No ecosystem lock-in.

</div>

## Usage [Docs →](docs#faq)

```html
<!-- CDN -->
<script src="//unpkg.com/sprae" data-start></script>

<!-- ESM -->
<script type="module">import sprae from 'sprae'</script>
```

## Reference [API →](docs#faq)

<div class="tabs" data-scope="{tab:'directives'}">
<button data-class="{active: tab=='directives'}" data-onclick="tab='directives'">Directives</button>
<button data-class="{active: tab=='modifiers'}" data-onclick="tab='modifiers'">Modifiers</button>
<div data-if="tab=='directives'">

| directive | description | example |
|-----------|-------------|---------|
| [`:text`](docs#text) | Set text content | `<span :text="name">` |
| [`:html`](docs#html) | Set innerHTML | `<div :html="content">` |
| [`:class`](docs#class) | Set classes | `<div :class="{active: isOn}">` |
| [`:style`](docs#style) | Set styles | `<div :style="{color}">` |
| [`:value`](docs#value) | Bind input value | `<input :value="text">` |
| [`:<prop>`](docs#attr--or---attrs-) | Set any attribute | `<a :href="url">` |
| [`:hidden`](docs#hidden) | Toggle visibility | `<div :hidden="!show">` |
| [`:if` `:else`](docs#if--else) | Conditional render | `<div :if="cond">` |
| [`:each`](docs#each) | List render | `<li :each="item in list">` |
| [`:scope`](docs#scope) | Define state | `<div :scope="{x:1}">` |
| [`:ref`](docs#ref) | Get element ref | `<input :ref="el">` |
| [`:fx`](docs#fx) | Run effect | `<div :fx="log(x)">` |
| [`:on<event>`](docs#onevent) | Event listener | `<button :onclick="fn()">` |

</div>
<div data-if="tab=='modifiers'">

| modifier | description | example |
|----------|-------------|---------|
| [`.once`](docs#once) | Run once | `:onclick.once` |
| [`.prevent`](docs#prevent-stop-stop-immediate) | Prevent default | `:onclick.prevent` |
| [`.stop`](docs#prevent-stop-stop-immediate) | Stop propagation | `:onclick.stop` |
| [`.window` `.document` `.self`](docs#window-document-body-parent-self) | Change target | `:onkeydown.window` |
| [`.away`](docs#away) | Click outside | `:onclick.away` |
| [`.debounce` `.throttle` `.delay`](docs#debounce) | Timing control | `:oninput.debounce-300` |
| [`.passive` `.capture`](docs#passive-capture) | Listener options | `:onscroll.passive` |
| [`.enter` `.esc` `.ctrl` ...](docs#key-filters) | Key filters | `:onkeydown.enter` |

</div>
</div>


## FAQ [All questions →](docs#faq)

**What is it?**
: A ~5kb script that adds reactivity to HTML via `:attribute="expression"` directives. No build step, no new syntax — just HTML and JS you already know.

**When to use it?**
: Adding interactivity to server-rendered pages, static sites, prototypes, or anywhere a full framework is overkill. Works with any backend.

**How does it compare?**
: 3× lighter than Alpine, faster in [benchmarks](https://krausest.github.io/js-framework-benchmark/2024/table_chrome_130.0.6723.58.html). Uses [signals](https://github.com/tc39/proposal-signals) (emerging standard) instead of custom reactivity. Full [comparison](./alpine.md).

**Does it work with React/Next.js?**
: Yes. Sprae can augment [JSX](docs#jsx--react--nextjs) for server components without virtual DOM overhead.

**How to handle components?**
: [Manage duplication](https://tailwindcss.com/docs/styling-with-utility-classes#managing-duplication) with templates/includes, or use [web components](docs#web-components).

**Is it production-ready?**
: <span data-scope="{ years: 3, versions: 12 }" data-fx.once="fetch('https://api.github.com/repos/dy/sprae').then(function(r){ return r.ok ? r.json() : null }).then(function(d){ if(d) years = Math.floor((Date.now() - new Date(d.created_at)) / 31536000000) }); fetch('https://api.github.com/repos/dy/sprae/releases').then(function(r){ return r.ok ? r.json() : null }).then(function(d){ if(d) versions = new Set(d.map(function(r){ return r.tag_name.split('.')[0] })).size })"><span data-text="years">3</span>+ years, <span data-text="versions">12</span> major versions</span>, 1.5k+ commits. Full TypeScript support. [Roadmap](https://github.com/dy/sprae/issues).
