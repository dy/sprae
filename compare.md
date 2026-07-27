---
title: Sprae vs Alpine vs petite-vue
description: Measured comparison of reactive sprinkles libraries — size, performance, CSP support, maintenance. Every number reproducible.
---

# Comparison

Sprae, [Alpine](https://alpinejs.dev) and [petite-vue](https://github.com/vuejs/petite-vue) do the same job: add reactivity to HTML you already have, no build step. The differences are size, speed, CSP support and maintenance. Every number below is measured — methodology at the bottom, reproduce it yourself.

## At a glance

| | sprae | Alpine | petite-vue |
|---|---|---|---|
| CDN build, min+gzip | **10.7kb** | 16.7kb | 7.1kb |
| CPU speed, [geometric mean](#performance) | **1.73× faster** | baseline | not benchmarked |
| First paint (1k rows) | **83ms** | 165ms | not benchmarked |
| Strict CSP / no-eval | [full JS expressions](./csp) | [restricted subset](https://alpinejs.dev/advanced/csp) | none |
| Reactivity | pluggable signals ([TC39-track](https://github.com/tc39/proposal-signals)) | bundled @vue/reactivity | bundled @vue/reactivity |
| Keyed lists | automatic (by identity) | manual `:key` | manual `:key` |
| Debounce, throttle, key filters | built-in [modifiers](https://github.com/dy/sprae#modifiers) | plugin packages | none |
| Dependencies | 0 | 0 (Vue reactivity inlined) | 0 (Vue reactivity inlined) |
| Status | active, 0 open issues | active | frozen — last release Jan 2022 |
| License | MIT | MIT | MIT |

<small>Sizes current as of 2026-07-03 (sprae 13.7.1, Alpine 3.15.12, petite-vue 0.4.1); CPU speed and first paint are from the last full benchmark run at sprae 13.3.8 — see [Methodology](#methodology).</small>

## Performance

Median times in ms (lower is better), [js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/) keyed suite, last full run at sprae v13.3.8 vs Alpine v3.14.7, identical machine and Chrome:

| benchmark | sprae | Alpine | ratio |
|---|---|---|---|
| create 1,000 rows | 54.6 | 88.2 | 1.62× |
| replace all rows | 56.4 | 109.5 | 1.94× |
| partial update (every 10th) | 21.4 | 27.8 | 1.30× |
| select row | 13.8 | 50.7 | 3.67× |
| swap rows | 35.5 | 35.2 | 0.99× |
| remove row | 19.3 | 26.2 | 1.36× |
| create 10,000 rows | 515.9 | 883.7 | 1.71× |
| append 1,000 rows | 59.0 | 97.9 | 1.66× |
| clear rows | 32.8 | 80.9 | 2.47× |
| **geometric mean** | | | **1.73×** |
| first paint | 82.6 | 164.7 | 1.99× |
| transferred size (benchmark app) | 7.9kb | 14.7kb | 1.86× |

Run it independently: [krausest/js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) includes both frameworks.

## When Alpine is the better choice

Honesty over conversion:

- **Laravel Livewire** — Alpine ships inside it; use what's already there.
- **Official plugins** — `x-transition` sugar, mask, collapse, sort, persist are packaged and documented. Sprae covers most of this with [modifiers and CSS](./alpine#x-transition), but you assemble it yourself.
- **Community volume** — years of StackOverflow answers, recipes, and tutorials. Sprae trades ecosystem size for engine size.

## When petite-vue is the better choice

- You want exact Vue template syntax and the smallest possible script, and you accept development frozen since January 2022 ([npm](https://www.npmjs.com/package/petite-vue?activeTab=versions)).

## Migrating

- [Alpine → sprae](./alpine) — directive-by-directive mapping.
- petite-vue → sprae — mostly rename: `v-scope`→`:scope`, `v-if`→`:if`, `v-for`→`:each`, `@click`→`:onclick`, `v-model`→`:value`.

## Methodology

Sizes measured 2026-07-03, unpkg default build of each package (sprae 13.7.1, Alpine 3.15.12, petite-vue 0.4.1):

```sh
curl -sL https://unpkg.com/sprae      | gzip -9 | wc -c   # 10708
curl -sL https://unpkg.com/alpinejs   | gzip -9 | wc -c   # 16694
curl -sL https://unpkg.com/petite-vue | gzip -9 | wc -c   #  7061
```

sprae's ESM build (`sprae.js`) is smaller — 9.7kb gzip, 8.9kb brotli — if you import it directly.

Performance: [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) official methodology, both frameworks run on the same machine, same Chrome, 15 samples per benchmark, medians reported — last full run at sprae v13.3.8 vs Alpine v3.14.7. Transferred size row is measured by the benchmark harness itself.
