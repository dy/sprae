<div class="no-toc">

# <span class="logo">∴</span> sprae

## DOM microhydration
### Reactive sprinkles for HTML/JSX

</div>

<div class="example">
```html
<div :scope="{ q: '', items: ['Apple', 'Apricot', 'Banana', 'Cherry', 'Date', 'Elderberry'] }">
  <input :value="q" :change="v => q = v" placeholder="Search fruits..." />
  <ul>
    <li :each="item in items.filter(i => i.includes(q))" :text="item"></li>
  </ul>
</div>
```

<div class="demo bg-graph-paper" data-scope="{ q: '', items: ['Apple', 'Apricot', 'Banana', 'Cherry', 'Date', 'Elderberry'], match(i) { return i.toLowerCase().includes(q.toLowerCase()) } }">
<input data-value="q" data-change="v => q = v" placeholder="Search fruits..." />
<ul>
<li data-each="item in items.filter(match)" data-text="item"></li>
</ul>
</div>
</div>

<div id="principles-content">

## Principles

**HTML-native**
: Keep existing HTML.<br>Standard JS expressions.<br>No build step, no config.

**Open & pluggable**
: Controllable state. ESM-first.<br>[Signals](https://github.com/tc39/proposal-signals)-powered reactivity.<br>Sandboxed. CSP-safe eval.

**5kb, 0 deps**
: One `<script>` tag or `npm i`.<br>Any backend, any template, +JSX.<br>No ecosystem lock-in.

</div>

## Usage


<div class="tabs" data-scope="{tab:'cdn'}">
<button data-class="{active: tab=='cdn'}" data-onclick="tab='cdn'">CDN</button>
<button data-class="{active: tab=='esm'}" data-onclick="tab='esm'">ESM</button>

<div data-if="tab=='cdn'">
Add one script tag. Sprae evaluates `:` attributes and makes reactivity.
```html
<script src="//unpkg.com/sprae" data-start></script>
```

Variants:
```html
<!-- CSP-safe (no eval) -->
<script src="//unpkg.com/sprae/dist/sprae-csp.umd.js" data-start></script>

<!-- Preact signals -->
<script src="//unpkg.com/sprae/dist/sprae-preact.umd.js" data-start></script>
```
</div>

<div data-if="tab=='esm'">

Install or download [sprae.js](https://unpkg.com/sprae/dist/sprae.js) and import:
```html
<script type="module">
  import sprae from './sprae.js'

  const state = sprae(document.getElementById('app'), { count: 0 })
  state.count++ // updates DOM
</script>
```

Variants: [sprae-csp.js](https://unpkg.com/sprae/dist/sprae-csp.js) (CSP-safe), [sprae-preact.js](https://unpkg.com/sprae/dist/sprae-preact.js) (preact signals).
</div>
</div>

## Reference [Docs →](https://github.com/dy/sprae#directives)

<div class="tabs" data-scope="{tab:'directives'}">
<button data-class="{active: tab=='directives'}" data-onclick="tab='directives'">Directives <span class="tab-count">18</span></button>
<button data-class="{active: tab=='modifiers'}" data-onclick="tab='modifiers'">Modifiers <span class="tab-count">14</span></button>
<div data-if="tab=='directives'">

| directive | description | example |
|-----------|-------------|---------|
| [`:text`](https://github.com/dy/sprae#text) | Set text content | `<span :text="name">` |
| [`:html`](https://github.com/dy/sprae#html) | Set innerHTML | `<div :html="content">` |
| [`:class`](https://github.com/dy/sprae#class) | Set classes | `<div :class="{active: true}">` |
| [`:style`](https://github.com/dy/sprae#style) | Set styles | `<div :style="{color:'#fff'}">` |
| [`:value`](https://github.com/dy/sprae#value) | Bind input (state→DOM) | `<input :value="text">` |
| [`:change`](https://github.com/dy/sprae#change) | Write input back (DOM→state) | `<input :change="v => text = v">` |
| [`:<prop>`](https://github.com/dy/sprae#attr-or--attrs-) | Set any attribute | `<a :href="url">` |
| [`:hidden`](https://github.com/dy/sprae#hidden) | Toggle visibility | `<div :hidden="!show">` |
| [`:if` `:else`](https://github.com/dy/sprae#if--else) | Conditional render | `<div :if="cond">` |
| [`:each`](https://github.com/dy/sprae#each) | List render | `<li :each="item in list">` |
| [`:scope`](https://github.com/dy/sprae#scope) | Create local state | `<div :scope="{x:1}">` |
| [`:ref`](https://github.com/dy/sprae#ref) | Element reference | `<input :ref="name">` |
| [`:mount`](https://github.com/dy/sprae#mount) | Connect/cleanup hook | `<canvas :mount="el => init(el)">` |
| [`:intersect`](https://github.com/dy/sprae#intersect) | Visibility observer | `<img :intersect.once="load()">` |
| [`:resize`](https://github.com/dy/sprae#resize) | Size observer | `<div :resize="({width}) => ...">` |
| [`:fx`](https://github.com/dy/sprae#fx) | Side effect | `<div :fx="log(x)">` |
| [`:on<event>`](https://github.com/dy/sprae#onevent) | Event listener | `<button :onclick="fn()">` |
| [`:portal`](https://github.com/dy/sprae#portal) | Move to container | `<div :portal="'#modals'">` |

</div>
<div data-if="tab=='modifiers'">

| modifier | description | example |
|----------|-------------|---------|
| [`.debounce`](https://github.com/dy/sprae#timing) | Delay until activity stops | `:oninput.debounce-300` |
| [`.throttle`](https://github.com/dy/sprae#timing) | Limit call frequency | `:onscroll.throttle-100` |
| [`.delay`](https://github.com/dy/sprae#timing) | Delay each call | `:onmouseenter.delay-500` |
| [`.once`](https://github.com/dy/sprae#timing) | Run only once | `:onclick.once` |
| [`.window`](https://github.com/dy/sprae#event-targets) | Listen on window | `:onkeydown.window` |
| [`.document`](https://github.com/dy/sprae#event-targets) | Listen on document | `:onclick.document` |
| [`.body` `.root` `.parent`](https://github.com/dy/sprae#event-targets) | Other targets | `:onclick.parent` |
| [`.self`](https://github.com/dy/sprae#event-targets) | Only direct target | `:onclick.self` |
| [`.away`](https://github.com/dy/sprae#event-targets) | Click outside element | `:onclick.away` |
| [`.prevent`](https://github.com/dy/sprae#event-control) | Prevent default | `:onclick.prevent` |
| [`.stop`](https://github.com/dy/sprae#event-control) | Stop propagation | `:onclick.stop` |
| [`.passive` `.capture`](https://github.com/dy/sprae#event-control) | Listener options | `:onscroll.passive` |
| [`.enter` `.esc` `.tab` `.space`](https://github.com/dy/sprae#key-filters) | Common keys | `:onkeydown.enter` |
| [`.ctrl` `.shift` `.alt` `.meta`](https://github.com/dy/sprae#key-filters) | Modifier keys | `:onkeydown.ctrl-s` |
| [`.arrow` `.digit` `.letter` `.delete`](https://github.com/dy/sprae#key-filters) | Key groups | `:onkeydown.digit` |

</div>
</div>


## FAQ [All questions →](https://github.com/dy/sprae#faq)

**What is it?**
: A ~5kb script that adds reactivity to HTML via `:attribute="expression"`. No build step, no new syntax — just HTML and JS you already know.

**When to use it?**
: Adding interactivity to server-rendered pages, static sites, prototypes, or anywhere a full framework is overkill. Works with any backend — Rails, Django, PHP, Jekyll, Next.js.

**How does it compare?**
: 3x lighter than Alpine, faster in [benchmarks](https://krausest.github.io/js-framework-benchmark/). [Signals](https://github.com/tc39/proposal-signals)-powered (emerging standard). Full [comparison](./alpine.md).

**Components?**
: Use [define-element](https://github.com/dy/define-element) for declarative web components, or any CE library.

**Is it production-ready?**
: <span data-scope="{ years: 3, versions: 12 }" data-fx.once="fetch('https://api.github.com/repos/dy/sprae').then(function(r){ return r.ok ? r.json() : null }).then(function(d){ if(d) years = Math.floor((Date.now() - new Date(d.created_at)) / 31536000000) }); fetch('https://api.github.com/repos/dy/sprae/releases').then(function(r){ return r.ok ? r.json() : null }).then(function(d){ if(d) versions = new Set(d.map(function(r){ return r.tag_name.split('.')[0] })).size })"><span data-text="years">3</span>+ years, <span data-text="versions">12</span> major versions</span>. Used by a few SaaS systems and landing pages. Full TypeScript support.
