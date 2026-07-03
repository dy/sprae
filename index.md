<div class="no-toc">

# <span class="logo">∴</span> spræ

## DOM microhydration
### Reactive `:attributes` for your HTML/JSX --- interactivity without a framework.

</div>

{::nomarkdown}
<script type="text/plain" id="playground-css">
@font-face { font-family: 'Atkinson Hyperlegible'; src: url(assets/AtkinsonHyperlegibleNextVF-Variable.woff2) format('woff2'); font-weight: 100 900 }
html { scrollbar-width: none }
body { font-family: 'Atkinson Hyperlegible', sans-serif; line-height: 1.5; color: oklch(0.40 0.2 262); background: transparent; margin: 0; padding: 1.5rem }
button { font: inherit; font-weight: 700; color: oklch(1 0 0); background: oklch(0.40 0.2 262); border: 3px solid oklch(0.40 0.2 262); border-radius: 90rem; padding: 0.5rem 1rem; text-box-trim: both; text-box-edge: cap alphabetic; cursor: pointer }
button:hover { opacity: 0.9 }
input, select, textarea { font: inherit; color: inherit; border: 3px solid currentColor; border-radius: 90rem; padding: 0.4rem 0.75rem; text-box-trim: both; text-box-edge: cap alphabetic; background: oklch(1 0 0 / 60%) }
::placeholder { color: oklch(0.40 0.2 262 / 50%); opacity: 1 }
@supports not (text-box-trim: both) {
  button { padding: 0.6rem 1rem 0.4rem }
  input, select, textarea { padding: 0.5rem 0.75rem 0.3rem }
}
ul, ol { list-style: none; padding: 0.25rem 0 0 0.75rem; margin: 0.5rem 0 }
li { padding: 0.15rem 0 }
h1, h2, h3, p { margin: 0.5rem 0 }
</script>
<script>
// shared HTML tokenizer: structure dim, directives light, values bright
window.hl = (s, line) => {
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(&lt;!--[^]*?--&gt;)|(&lt;\/?[\w-]+)|(\/?&gt;)|(:[\w.-]+)(?==)|("[^"]*")/g, (m, cm, tag, br, dir, val) =>
      cm ? '<i class=tp>' + cm + '</i>'
      : tag ? '<i class=tp>' + tag.match(/^&lt;\/?/)[0] + '</i><i class=tn>' + tag.replace(/^&lt;\/?/, '') + '</i>'
      : br ? '<i class=tp>' + br + '</i>'
      : dir ? '<i class=dr>' + dir + '</i>'
      : '<i class=vl>' + val + '</i>')
  // block per source line — active one highlighted, wrapped rows included
  return s.split('\n').map((ln, i) => '<i class="ln' + (i === line ? ' cl' : '') + '">' + ln + '</i>').join('')
}
</script>
<div class="playground" data-scope="{
  src: document.querySelector('#playground-src').value,
  out: document.querySelector('#playground-src').value,
  line: 0
}" data-oninput="e => src = e.target.value" data-fx.debounce-300="out = src">
<div class="editor">
<pre aria-hidden="true"><code data-html="hl(src, line)"></code></pre>
<textarea id="playground-src" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" aria-label="Editable sprae example" data-value="src" data-onkeyup:onclick:oninput:onfocus="e => line = e.target.value.slice(0, e.target.selectionStart).split('\n').length - 1">&lt;div :scope="{ q: '', items: ['apple', 'apricot', 'banana', 'cherry', 'date', 'elderberry'] }"&gt;
  &lt;input :value="q" :change="v =&gt; q = v" placeholder="Search fruits..." /&gt;
  &lt;ul&gt;
    &lt;li :each="item in items.filter(i =&gt; i.match(q))" :text="item"&gt;&lt;/li&gt;
  &lt;/ul&gt;
&lt;/div&gt;</textarea>
</div>
<iframe class="bg-graph-paper" title="Live result" data-srcdoc="'<style>' + document.querySelector('#playground-css').textContent + 'body{font-size:' + getComputedStyle(document.body).fontSize + '}</style>' + out + '<scr' + 'ipt src=https://unpkg.com/sprae data-start></scr' + 'ipt>'"></iframe>
</div>
{:/nomarkdown}

<div id="principles-content">

## Principles

**HTML-native**
: Keep existing HTML.<br>Standard JS expressions.<br>No build step, no config.

**~8kb, 0 deps**
: One `<script>` tag or `npm i`.<br>Any backend, any template, +JSX.<br>No ecosystem lock-in.

**Open & pluggable**
: Direct state access.<br>Swappable signals, custom directives.<br>No eval — CSP-safe sandbox.

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

## Reference

<div class="tabs" data-scope="{tab:'directives'}">
<button data-class="{active: tab=='directives'}" data-onclick="tab='directives'">Directives <span class="tab-count">18</span></button>
<button data-class="{active: tab=='modifiers'}" data-onclick="tab='modifiers'">Modifiers <span class="tab-count">14</span></button>
<div data-if="tab=='directives'" class="ref-list">

{::nomarkdown}
<details><summary><code>:text</code><span>Set text content</span><code>&lt;span :text="name"&gt;</code></summary><pre>&lt;span :text="user.name"&gt;Guest&lt;/span&gt;
&lt;span :text="count + ' items'"&gt;&lt;/span&gt;
&lt;!-- function form --&gt;
&lt;span :text="text =&gt; text.toUpperCase()"&gt;hello&lt;/span&gt;</pre></details>
<details><summary><code>:html</code><span>Set innerHTML</span><code>&lt;div :html="content"&gt;</code></summary><pre>&lt;article :html="marked(content)"&gt;&lt;/article&gt;
&lt;!-- template element --&gt;
&lt;section :html="document.querySelector('#card')"&gt;&lt;/section&gt;
&lt;!-- function form --&gt;
&lt;div :html="html =&gt; DOMPurify.sanitize(html)"&gt;&lt;/div&gt;</pre></details>
<details><summary><code>:class</code><span>Set classes</span><code>&lt;div :class="{active: true}"&gt;</code></summary><pre>&lt;div :class="{ active: isActive, disabled }"&gt;&lt;/div&gt;
&lt;div :class="['btn', size, variant]"&gt;&lt;/div&gt;
&lt;div :class="isError &amp;&amp; 'error'"&gt;&lt;/div&gt;
&lt;!-- function form: extend existing --&gt;
&lt;div :class="cls =&gt; [...cls, 'extra']"&gt;&lt;/div&gt;</pre></details>
<details><summary><code>:style</code><span>Set styles</span><code>&lt;div :style="{color:'#fff'}"&gt;</code></summary><pre>&lt;div :style="{ color, opacity, '--size': size + 'px' }"&gt;&lt;/div&gt;
&lt;div :style="'color:' + color"&gt;&lt;/div&gt;
&lt;!-- function form --&gt;
&lt;div :style="style =&gt; ({ ...style, color })"&gt;&lt;/div&gt;</pre></details>
<details><summary><code>:value</code><span>Bind input (state→DOM)</span><code>&lt;input :value="text"&gt;</code></summary><pre>&lt;input :value="query" /&gt;
&lt;textarea :value="content"&gt;&lt;/textarea&gt;
&lt;input type="checkbox" :value="agreed" /&gt;
&lt;select :value="country"&gt;&lt;option :each="c in countries" :value="c.code" :text="c.name"&gt;&lt;/option&gt;&lt;/select&gt;</pre></details>
<details><summary><code>:change</code><span>Write input back (DOM→state)</span><code>&lt;input :change="v =&gt; text = v"&gt;</code></summary><pre>&lt;input :value="query" :change="v =&gt; query = v" /&gt;
&lt;!-- coerces type --&gt;
&lt;input type="number" :value="count" :change="v =&gt; count = v" /&gt;
&lt;!-- debounced write --&gt;
&lt;input :value="search" :change.debounce-300="v =&gt; search = v" /&gt;</pre></details>
<details><summary><code>:&lt;prop&gt;</code><span>Set any attribute</span><code>&lt;a :href="url"&gt;</code></summary><pre>&lt;button :disabled="loading" :aria-busy="loading"&gt;Save&lt;/button&gt;
&lt;!-- multiple attrs at once --&gt;
&lt;input :id:name="fieldName" /&gt;
&lt;!-- spread form --&gt;
&lt;input :="{ type: 'email', required, placeholder }" /&gt;</pre></details>
<details><summary><code>:hidden</code><span>Toggle visibility</span><code>&lt;div :hidden="!show"&gt;</code></summary><pre>&lt;!-- unlike :if, keeps the element in DOM --&gt;
&lt;p :hidden="!ready"&gt;Loading...&lt;/p&gt;</pre></details>
<details><summary><span class="nm"><code>:if</code> <code>:else</code></span><span>Conditional render</span><code>&lt;div :if="cond"&gt;</code></summary><pre>&lt;div :if="loading"&gt;Loading...&lt;/div&gt;
&lt;div :else :if="error" :text="error"&gt;&lt;/div&gt;
&lt;div :else&gt;Ready!&lt;/div&gt;
&lt;!-- fragment --&gt;
&lt;template :if="showDetails"&gt;&lt;dt&gt;Name&lt;/dt&gt;&lt;dd :text="name"&gt;&lt;/dd&gt;&lt;/template&gt;</pre></details>
<details><summary><code>:each</code><span>List render</span><code>&lt;li :each="item in list"&gt;</code></summary><pre>&lt;li :each="item, index in items" :text="index + '. ' + item.name"&gt;&lt;/li&gt;
&lt;li :each="value, key in object" :text="key + ': ' + value"&gt;&lt;/li&gt;
&lt;li :each="n in 5" :text="'Item ' + n"&gt;&lt;/li&gt;
&lt;!-- reactive filter --&gt;
&lt;li :each="item in items.filter(i =&gt; i.active)" :text="item.name"&gt;&lt;/li&gt;
&lt;!-- fragment --&gt;
&lt;template :each="item in items"&gt;&lt;dt :text="item.term"&gt;&lt;/dt&gt;&lt;dd :text="item.definition"&gt;&lt;/dd&gt;&lt;/template&gt;</pre></details>
<details><summary><code>:scope</code><span>Create local state</span><code>&lt;div :scope="{x:1}"&gt;</code></summary><pre>&lt;div :scope="{ count: 0, open: false }"&gt;...&lt;/div&gt;
&lt;!-- inline variables --&gt;
&lt;span :scope="x = 1, y = 2" :text="x + y"&gt;&lt;/span&gt;
&lt;div :scope="{ local: parentValue * 2 }"&gt;...&lt;/div&gt;
&lt;!-- function form --&gt;
&lt;div :scope="scope =&gt; ({ double: scope.value * 2 })"&gt;...&lt;/div&gt;</pre></details>
<details><summary><code>:ref</code><span>Element reference</span><code>&lt;input :ref="name"&gt;</code></summary><pre>&lt;canvas :ref="canvas" :fx="draw(canvas)"&gt;&lt;/canvas&gt;
&lt;!-- function form --&gt;
&lt;input :ref="el =&gt; el.focus()" /&gt;
&lt;!-- path reference --&gt;
&lt;input :ref="$refs.email" /&gt;</pre></details>
<details><summary><code>:mount</code><span>Connect/cleanup hook</span><code>&lt;canvas :mount="el =&gt; init(el)"&gt;</code></summary><pre>&lt;canvas :mount="el =&gt; initChart(el)"&gt;&lt;/canvas&gt;
&lt;!-- return cleanup, runs on disconnect --&gt;
&lt;div :mount="el =&gt; {
  const timer = setInterval(tick, 1000)
  return () =&gt; clearInterval(timer)
}"&gt;&lt;/div&gt;</pre></details>
<details><summary><code>:intersect</code><span>Visibility observer</span><code>&lt;img :intersect.once="load()"&gt;</code></summary><pre>&lt;img :intersect.once="loadImage()" :src="placeholder" /&gt;
&lt;!-- full control --&gt;
&lt;div :intersect="entry =&gt; visible = entry.isIntersecting"&gt;&lt;/div&gt;</pre></details>
<details><summary><code>:resize</code><span>Size observer</span><code>&lt;div :resize="({width}) =&gt; ..."&gt;</code></summary><pre>&lt;div :resize="({width}) =&gt; cols = Math.floor(width / 200)"&gt;&lt;/div&gt;</pre></details>
<details><summary><code>:fx</code><span>Side effect</span><code>&lt;div :fx="log(x)"&gt;</code></summary><pre>&lt;div :fx="console.log('count changed:', count)"&gt;&lt;/div&gt;
&lt;!-- return cleanup --&gt;
&lt;div :fx="() =&gt; {
  const id = setInterval(tick, 1000)
  return () =&gt; clearInterval(id)
}"&gt;&lt;/div&gt;</pre></details>
<details><summary><code>:on&lt;event&gt;</code><span>Event listener</span><code>&lt;button :onclick="fn()"&gt;</code></summary><pre>&lt;form :onsubmit.prevent="handleSubmit()"&gt;...&lt;/form&gt;
&lt;input :onkeydown.enter="send()" /&gt;
&lt;!-- multiple events --&gt;
&lt;input :oninput:onchange="e =&gt; validate(e)" /&gt;
&lt;!-- setup..cleanup sequence --&gt;
&lt;div :onfocus..onblur="e =&gt; (active = true, () =&gt; active = false)"&gt;&lt;/div&gt;</pre></details>
<details><summary><code>:portal</code><span>Move to container</span><code>&lt;div :portal="'#modals'"&gt;</code></summary><pre>&lt;div :portal="'#modals'"&gt;Modal content&lt;/div&gt;
&lt;!-- conditional target --&gt;
&lt;dialog :portal="open &amp;&amp; '#portal-target'"&gt;...&lt;/dialog&gt;</pre></details>
{:/nomarkdown}

</div>
<div data-if="tab=='modifiers'" class="ref-list">

{::nomarkdown}
<details><summary><code>.debounce</code><span>Delay until activity stops</span><code>:oninput.debounce-300</code></summary><pre>&lt;input :oninput.debounce-300="search()" /&gt;
&lt;!-- leading edge --&gt;
&lt;input :oninput.debounce-1s-immediate="save()" /&gt;
&lt;!-- formats: 100, 100ms, 1s, 1m, raf, idle, tick --&gt;
</pre></details>
<details><summary><code>.throttle</code><span>Limit call frequency</span><code>:onscroll.throttle-100</code></summary><pre>&lt;div :onscroll.throttle-100="update()"&gt;...&lt;/div&gt;
&lt;!-- once per frame --&gt;
&lt;div :onmousemove.throttle-raf="track()"&gt;...&lt;/div&gt;</pre></details>
<details><summary><code>.delay</code><span>Delay each call</span><code>:onmouseenter.delay-500</code></summary><pre>&lt;div :onmouseenter.delay-500="show = true"&gt;...&lt;/div&gt;</pre></details>
<details><summary><code>.once</code><span>Run only once</span><code>:onclick.once</code></summary><pre>&lt;button :onclick.once="init()"&gt;Initialize&lt;/button&gt;
&lt;!-- works on any directive --&gt;
&lt;div :fx.once="fetchData()"&gt;&lt;/div&gt;</pre></details>
<details><summary><code>.window</code><span>Listen on window</span><code>:onkeydown.window.escape</code></summary><pre>&lt;div :onkeydown.window.escape="close()"&gt;...&lt;/div&gt;
&lt;div :onresize.window="w = innerWidth"&gt;&lt;/div&gt;</pre></details>
<details><summary><code>.document</code><span>Listen on document</span><code>:onclick.document</code></summary><pre>&lt;div :onselectionchange.document="onSelect()"&gt;&lt;/div&gt;</pre></details>
&lt;!-- delegate to parent --&gt;
<details><summary><span class="nm"><code>.body</code> <code>.root</code> <code>.parent</code></span><span>Other targets</span><code>:onclick.parent</code></summary><pre>&lt;li :onclick.parent="select()"&gt;...&lt;/li&gt;</pre></details>
<details><summary><code>.self</code><span>Only direct target</span><code>:onclick.self</code></summary><pre>&lt;div :onclick.self="close()"&gt;ignores clicks on children&lt;/div&gt;</pre></details>
<details><summary><code>.away</code><span>Click outside element</span><code>:onclick.away</code></summary><pre>&lt;menu :onclick.away="open = false"&gt;click outside to close&lt;/menu&gt;</pre></details>
<details><summary><code>.prevent</code><span>Prevent default</span><code>:onclick.prevent</code></summary><pre>&lt;form :onsubmit.prevent="save()"&gt;...&lt;/form&gt;
&lt;a :onclick.prevent="navigate()" href="/fallback"&gt;Link&lt;/a&gt;</pre></details>
<details><summary><code>.stop</code><span>Stop propagation</span><code>:onclick.stop</code></summary><pre>&lt;button :onclick.stop="handleClick()"&gt;Don't bubble&lt;/button&gt;
&lt;button :onclick.stop-immediate="only()"&gt;...&lt;/button&gt;</pre></details>
<details><summary><span class="nm"><code>.passive</code> <code>.capture</code></span><span>Listener options</span><code>:onscroll.passive</code></summary><pre>&lt;div :onscroll.passive="onScroll()"&gt;...&lt;/div&gt;
&lt;div :onclick.capture="first()"&gt;...&lt;/div&gt;</pre></details>
<details><summary><span class="nm"><code>.enter</code> <code>.esc</code> <code>.tab</code> <code>.space</code></span><span>Common keys</span><code>:onkeydown.enter</code></summary><pre>&lt;input :onkeydown.enter="submit()" /&gt;
&lt;!-- also: .delete, .arrow, .digit, .letter, .char --&gt;
</pre></details>
<details><summary><span class="nm"><code>.ctrl</code> <code>.shift</code> <code>.alt</code> <code>.meta</code></span><span>Modifier keys, combos</span><code>:onkeydown.ctrl-s</code></summary><pre>&lt;input :onkeydown.ctrl-s.prevent="save()" /&gt;
&lt;input :onkeydown.shift-enter="newLine()" /&gt;
&lt;input :onkeydown.meta-x="cut()" /&gt;</pre></details>
<details><summary><span class="nm"><code>.arrow</code> <code>.digit</code> <code>.letter</code> <code>.delete</code></span><span>Key groups</span><code>:onkeydown.digit</code></summary><pre>&lt;input :onkeydown.arrow="e =&gt; navigate(e.key)" /&gt;
&lt;input :onkeydown.digit="e =&gt; enterPin(e.key)" /&gt;</pre></details>
{:/nomarkdown}

</div>
</div>

<script>
// highlight reference examples with the shared tokenizer
document.querySelectorAll('.ref-list pre').forEach(p => p.innerHTML = hl(p.textContent))
</script>


## FAQ

**How does it compare?**
: ~2× lighter and ~2× faster than Alpine — [measured](./compare). Actively maintained, unlike petite-vue. [Signals](https://github.com/tc39/proposal-signals)-powered (emerging standard). Migrating? [Alpine → sprae guide](./alpine).

**Strict CSP? Browser extension?**
: Yes — the [CSP build](./csp) runs full JS expressions with no `eval` / `new Function`, where Alpine's CSP build forbids even arrow functions. Works in Chrome MV3 extensions.

**Components?**
: Use [define-element](https://github.com/dy/define-element) for declarative web components, or any CE library.

**Is `new Function` unsafe?**
: No more than inline `onclick` handlers — expressions are sandboxed to state scope. For no-eval environments there's the [CSP build](./csp).

**Does it scale?**
: State is plain reactive objects — scales as far as your data model does. Use [store](https://github.com/dy/sprae#store) with computed getters and methods for complex apps.

**Browser support?**
: Any browser with [Proxy](https://caniuse.com/proxy) — all modern browsers, no IE.

**Is it production-ready?**
: <span data-scope="{ years: 3, releases: 20, issues: 0 }" data-fx.once="fetch('https://api.github.com/repos/dy/sprae').then(function(r){ return r.ok ? r.json() : null }).then(function(d){ if(d) { years = Math.floor((Date.now() - new Date(d.created_at)) / 31536000000); issues = d.open_issues_count } }); fetch('https://api.github.com/repos/dy/sprae/releases?per_page=1').then(function(r){ var m = (r.headers.get('link') || '').match(/page=(\d+)>; rel=.last./); if (m) releases = +m[1] })"><span data-text="years">3</span>+ years · <span data-text="releases">20</span>+ [releases](https://github.com/dy/sprae/releases) · <span data-text="issues">0</span> open issues</span> · 0 dependencies · full TypeScript types · [test suite](https://github.com/dy/sprae/actions).
