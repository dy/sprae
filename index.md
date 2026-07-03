<div class="no-toc">

# <span class="logo">∴</span> spræ

## Reactive sprinkles for HTML
### Makes the HTML you already have interactive: one ~8kb script, no build step, no lock-in. [~2× lighter & faster than Alpine](./compare).

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

**~8kb, 0 deps**
: One `<script>` tag or `npm i`.<br>Any backend, any template, +JSX.<br>No ecosystem lock-in.

**Open & pluggable**
: Controllable state. ESM-first.<br>[Signals](https://github.com/tc39/proposal-signals)-powered reactivity.<br>Sandboxed. [CSP-safe](./csp) eval.

</div>

## Usage


<div class="tabs" data-scope="{tab:'cdn'}">
<button data-class="{active: tab=='cdn'}" data-onclick="tab='cdn'">CDN</button>
<button data-class="{active: tab=='esm'}" data-onclick="tab='esm'">ESM</button>
<button data-class="{active: tab=='jsx'}" data-onclick="tab='jsx'">Next.js / JSX</button>
<button data-class="{active: tab=='md'}" data-onclick="tab='md'">Markdown / SSG</button>

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

<div data-if="tab=='jsx'">

Keep server components — sprae handles client interactivity, no `'use client'`:

```jsx
// layout.jsx
import Script from 'next/script'
export default function Layout({ children }) {
  return <>
    {children}
    <Script src="https://unpkg.com/sprae" data-prefix="x-" data-start />
  </>
}
```

```jsx
// page.jsx — server component, no 'use client' needed
export default function Page() {
  return <div x-scope="{count: 0}">
    <button x-onclick="count++">
      Clicked <span x-text="count">0</span> times
    </button>
  </div>
}
```
</div>

<div data-if="tab=='md'">

Markdown processors strip `:` attributes — use the `data-` prefix:

```html
<script src="https://unpkg.com/sprae" data-prefix="data-" data-start></script>
```

```md
<div data-scope="{ count: 0 }">
  <button data-onclick="count++">
    Clicked <span data-text="count">0</span> times
  </button>
</div>
```

Works with Jekyll, Hugo, Eleventy, Astro — and server templates: PHP, Django, Rails, Jinja. This site is built this way.
</div>
</div>

## Playground

Edit the HTML — it re-runs live. This is the whole build pipeline.

{::nomarkdown}
<script type="text/plain" id="playground-css">
@font-face { font-family: 'Atkinson Hyperlegible'; src: url(assets/AtkinsonHyperlegibleNextVF-Variable.woff2) format('woff2'); font-weight: 100 900 }
body { font-family: 'Atkinson Hyperlegible', sans-serif; color: oklch(0.40 0.2 262); background: transparent; margin: 0; padding: 1.5rem }
button { font: inherit; font-size: 0.875rem; font-weight: 700; color: oklch(1 0 0); background: oklch(0.40 0.2 262); border: 3px solid oklch(0.40 0.2 262); border-radius: 90rem; padding: 0.5rem 1rem; cursor: pointer }
button:hover { opacity: 0.9 }
input, select, textarea { font: inherit; color: inherit; border: 3px solid currentColor; border-radius: 90rem; padding: 0.4rem 0.75rem; background: oklch(1 0 0 / 60%) }
ul, ol { list-style: none; padding: 0.25rem 0 0 0.75rem; margin: 0.5rem 0 }
li { padding: 0.15rem 0 }
h1, h2, h3, p { margin: 0.5rem 0 }
</script>
<div class="playground" data-scope="{ src: document.querySelector('#playground-src').value }" data-oninput.debounce-300="e => src = e.target.value">
<textarea id="playground-src" spellcheck="false" rows="14" aria-label="Editable sprae example">&lt;div :scope="{ count: 0, fruits: ['🍎', '🍌', '🍒'] }"&gt;
  &lt;button :onclick="count++"&gt;
    Clicked &lt;span :text="count"&gt;0&lt;/span&gt; times
  &lt;/button&gt;
  &lt;ul&gt;
    &lt;li :each="f in fruits" :text="f"&gt;&lt;/li&gt;
  &lt;/ul&gt;
&lt;/div&gt;</textarea>
<iframe class="bg-graph-paper" title="Playground result" data-srcdoc="'<style>' + document.querySelector('#playground-css').textContent + '</style>' + src + '<scr' + 'ipt src=https://unpkg.com/sprae data-start></scr' + 'ipt>'"></iframe>
</div>
{:/nomarkdown}

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
: A ~8kb script that adds reactivity to HTML via `:attribute="expression"`. No build step, no new syntax — just HTML and JS you already know.

**When to use it?**
: Adding interactivity to server-rendered pages, static sites, prototypes, or anywhere a full framework is overkill. Works with any backend — Rails, Django, PHP, Jekyll, Next.js.

**How does it compare?**
: ~2× lighter and ~2× faster than Alpine — [measured](./compare). Actively maintained, unlike petite-vue. [Signals](https://github.com/tc39/proposal-signals)-powered (emerging standard). Migrating? [Alpine → sprae guide](./alpine).

**Strict CSP? Browser extension?**
: Yes — the [CSP build](./csp) runs full JS expressions with no `eval` / `new Function`, where Alpine's CSP build forbids even arrow functions. Works in Chrome MV3 extensions.

**Components?**
: Use [define-element](https://github.com/dy/define-element) for declarative web components, or any CE library.

**Is it production-ready?**
: <span data-scope="{ years: 3, issues: 0 }" data-fx.once="fetch('https://api.github.com/repos/dy/sprae').then(function(r){ return r.ok ? r.json() : null }).then(function(d){ if(d) { years = Math.floor((Date.now() - new Date(d.created_at)) / 31536000000); issues = d.open_issues_count } })"><span data-text="years">3</span>+ years · ~200 [releases](https://github.com/dy/sprae/releases) · <span data-text="issues">0</span> open issues</span> · 0 dependencies · full TypeScript types · [test suite](https://github.com/dy/sprae/actions).
