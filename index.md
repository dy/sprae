---
title: ∴ spræ
---

<nav>
<a href="docs">Docs</a>
<a href="drops">Drops</a>
</nav>

# ∴ spræ

Reactive sprinkles for HTML/JSX

<div class="example">
```html
<div :scope="{count: 0}">
  <p>Count: <span :text="count"></span></p>
  <button :onclick="count++">+</button>
  <button :onclick="count--">–</button>
</div>
```

<div class="demo" data-scope="{count: 0}">
<p>Count: <strong data-text="count">0</strong></p>
<button data-onclick="count++">+</button>
<button data-onclick="count--">–</button>
</div>
</div>

## why

- **~5kb** gzipped, zero dependencies
- **No build step** – just include and go
- **Signals** – standard reactive primitives
- **CSP-safe** – secure evaluator option
- **TypeScript** – full type definitions
- **JSX/SSR** – works with server components

## usage

```html
<script type="module" src="//unpkg.com/sprae"></script>

<!-- Tabs -->
<nav :scope="{tab: 'A'}">
  <button :class="{active: tab=='A'}" :onclick="tab='A'">A</button>
  <button :class="{active: tab=='B'}" :onclick="tab='B'">B</button>
  <section :if="tab=='A'">Content A</section>
  <section :if="tab=='B'">Content B</section>
</nav>

<!-- Filter -->
<input :scope="{q: ''}" :value="q" :oninput="q=e.target.value" placeholder="Search...">
<ul :each="item in items.filter(i => i.includes(q))">
  <li :text="item"></li>
</ul>
```

## reference

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

**Why not just use Alpine.js?**
Alpine is 3x larger, uses non-standard reactivity, and has quirky `$` magic. Sprae uses TC39 signals, weighs ~5kb, and has no magic variables.

**Can I use this in production?**
Yes. Sprae powers production apps. It's stable, tested, and designed for progressive enhancement—not experimental.

**What about bundle size in frameworks?**
Sprae is for HTML-first projects. If you're already in React/Vue, use their reactivity. Sprae shines when you want interactivity without a build step.

**How do I debug reactivity issues?**
State is plain objects with signals underneath. `console.log(state)` works. No devtools needed—inspect in browser console.

**What if I need complex state management?**
Pass the same state object to multiple `sprae()` calls. For cross-component state, use [signals](docs#signals) directly.

**Does it work with SSR/hydration?**
Yes. Server renders HTML, sprae hydrates on client. Works with Next.js, Astro, any SSR. See [server guide](docs#server-components).
