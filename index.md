---
title: ∴ spræ
---

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

<div class="demo bg-graph-paper" data-scope="{count: 0}">
<p>Count: <strong data-text="count">0</strong></p>
<button data-onclick="count++">+</button>
<button data-onclick="count--">–</button>
</div>
</div>

## why

- **No complexity fatigue** – no build step, no framework, no mental overhead
- **No bundle bloat** – ~5kb vs 40kb+ for Alpine/Vue/React
- **Use what you know** – standard JS expressions, no magic
- **Future-proof** – built on [TC39 Signals](https://github.com/tc39/proposal-signals), not proprietary reactivity
- **Works everywhere** – HTML, JSX, SSR, any backend template

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

<p align='center' style="margin-top:6rem">
<a href="https://krishnized.github.io/license">ॐ</a>
</p>
