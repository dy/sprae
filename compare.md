---
title: "Alpine.js vs petite-vue vs sprae, measured"
description: "Size, speed, memory, CSP support and maintenance compared across the three reactive-sprinkles libraries. Every number reproducible, methodology included."
permalink: /compare/
---

# Comparison

Sprae, [Alpine](https://alpinejs.dev) and [petite-vue](https://github.com/vuejs/petite-vue) do the same job: add reactivity to HTML you already have, no build step. The differences are size, speed, CSP support and maintenance. Every number below is measured — methodology at the bottom, reproduce it yourself.

## At a glance

| | sprae | Alpine | petite-vue |
|---|---|---|---|
| CDN build, min+gzip | **11.9kb** | 19.9kb | 7.1kb |
| CPU speed, [geometric mean](#performance) | **2.81× faster** | baseline | not benchmarked |
| Runtime memory (1k rows) | **3.65MB** | 16.56MB | not benchmarked |
| First paint (1k rows) | **50.6ms** | 71.1ms | not benchmarked |
| Strict CSP / no-eval | [full JS expressions](/csp/) | [restricted subset](/alpine-csp/) | none |
| Last release | active | active | [Jan 2022](/petite-vue/) |
| Reactivity | pluggable signals ([TC39-track](https://github.com/tc39/proposal-signals)) | bundled @vue/reactivity | bundled @vue/reactivity |
| Keyed lists | automatic (by identity) | manual `:key` | manual `:key` |
| Debounce, throttle, key filters | built-in [modifiers](https://github.com/dy/sprae#modifiers) | plugin packages | none |
| Dependencies | 0 | 0 (Vue reactivity inlined) | 0 (Vue reactivity inlined) |
| Status | active, 0 open issues | active | frozen — last release Jan 2022 |
| License | MIT | MIT | MIT |

<small>Sizes measured 2026-09-08 (sprae 13.9.2, Alpine 3.17.2, petite-vue 0.4.1); CPU speed, memory and first paint come from the official benchmark's Chrome 152 run at sprae 13.9.1 — see [Methodology](#methodology).</small>

## Performance

Median times in ms (lower is better) from the official [js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/2026/chrome152.html)
published run, keyed suite, Chrome 152. Sprae v13.9.1 was measured in that run, on the same machine as
every framework compared here — so these are directly comparable rather than stitched from separate runs:

| benchmark | sprae | Alpine | ratio |
|---|---|---|---|
| create 1,000 rows | 24.0 | 59.6 | 2.48× |
| replace all rows | 26.3 | 71.5 | 2.72× |
| partial update (every 10th) | 10.1 | 15.2 | 1.50× |
| select row | 3.4 | 32.2 | 9.47× |
| swap rows | 12.5 | 25.4 | 2.03× |
| remove row | 10.4 | 16.6 | 1.60× |
| create 10,000 rows | 246.3 | 606.6 | 2.46× |
| append 1,000 rows | 27.3 | 67.2 | 2.46× |
| clear rows | 10.6 | 61.8 | 5.83× |
| **geometric mean** | | | **2.81×** |
| memory after create 1,000 rows | 3.65MB | 16.56MB | 4.54× |
| first paint | 50.6 | 71.1 | 1.41× |
| transferred size (benchmark app) | 10.8kb | 14.7kb | 1.36× |

### The rest of the field

Same run, same machine. CPU is the geometric mean over the nine benchmarks above, expressed as a multiple
of sprae:

| | CPU | memory after 1k | first paint |
|---|---|---|---|
| React 19.2.0 | 1.56× slower | 4.44MB | 221.4ms |
| Lit 3.2.0 | 1.13× slower | 2.80MB | 64.4ms |
| Vue 3.5.39 | 1.10× slower | 3.93MB | 93.9ms |
| Svelte 5.42.1 | 1.01× slower | 2.87MB | 58.4ms |
| **sprae 13.9.1** | — | **3.65MB** | **50.6ms** |
| plain DOM (vanillajs) | 1.16× faster | 1.86MB | 52.7ms |

Read that last row honestly: hand-written DOM is still faster on CPU, by about 16%. Lit and Svelte hold
less memory than sprae, and both ship a compiler to do it. First paint against plain DOM is a wash —
50.6ms against 52.7ms is inside single-run noise, so it means "no measurable cost", not a win.

Run it independently: [krausest/js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) includes both frameworks.

## When Alpine is the better choice

Honesty over conversion:

- **Laravel Livewire** — Alpine ships inside it; use what's already there.
- **Official plugins** — `x-transition` sugar, mask, collapse, sort, persist are packaged and documented. Sprae covers most of this with [modifiers and CSS](/alpine/#x-transition), but you assemble it yourself.
- **Community volume** — years of StackOverflow answers, recipes, and tutorials. Sprae trades ecosystem size for engine size.

## When petite-vue is the better choice

- You want exact Vue template syntax and the smallest possible script, and you accept development frozen since January 2022 ([npm](https://www.npmjs.com/package/petite-vue?activeTab=versions)).

## Migrating

- [Alpine → sprae](/alpine/) — directive-by-directive mapping.
- petite-vue → sprae — mostly rename: `v-scope`→`:scope`, `v-if`→`:if`, `v-for`→`:each`, `@click`→`:onclick`, `v-model`→`:value`.

## Methodology

Sizes measured 2026-09-08, unpkg default build of each package (sprae 13.9.2, Alpine 3.17.2, petite-vue 0.4.1):

```sh
curl -sL https://unpkg.com/sprae      | gzip -9 | wc -c   # 11932
curl -sL https://unpkg.com/alpinejs   | gzip -9 | wc -c   # 19865
curl -sL https://unpkg.com/petite-vue | gzip -9 | wc -c   #  7061
```

Both grew since the July run (sprae 10947 → 11932, Alpine 16694 → 19865); Alpine grew faster, so the gap widened.

sprae's ESM build (`sprae.js`) is smaller — 10.9kb gzip, 9.9kb brotli — if you import it directly.

CSP builds are compared separately on the [strict CSP page](/csp/): `@alpinejs/csp` has no `unpkg` field, so
`unpkg.com/@alpinejs/csp` resolves to its CommonJS `main` rather than a browser bundle — compare
`dist/cdn.min.js` on both sides or the numbers are not like-for-like.

Performance: the official [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) published run for [Chrome 152](https://krausest.github.io/js-framework-benchmark/2026/chrome152.html), keyed suite, medians of 15 samples. Sprae v13.9.1 is in that run, so every framework on this page was measured on one machine in one session — nothing is stitched together from separate runs. Memory is the harness's GC'd heap after create-1k; transferred size and first paint are measured by the harness itself.
