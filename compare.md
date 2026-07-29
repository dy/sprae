---
title: Sprae vs Alpine vs petite-vue
description: Measured comparison of reactive sprinkles libraries — size, performance, CSP support, maintenance. Every number reproducible.
---

# Comparison

Sprae, [Alpine](https://alpinejs.dev) and [petite-vue](https://github.com/vuejs/petite-vue) do the same job: add reactivity to HTML you already have, no build step. The differences are size, speed, CSP support and maintenance. Every number below is measured — methodology at the bottom, reproduce it yourself.

## At a glance

| | sprae | Alpine | petite-vue |
|---|---|---|---|
| CDN build, min+gzip | **10.9kb** | 16.7kb | 7.1kb |
| CPU speed, [geometric mean](#performance) | **2.27× faster** | baseline | not benchmarked |
| Runtime memory (1k rows) | **5.1MB** | 16.6MB | not benchmarked |
| First paint (1k rows) | **76ms** | 107ms | not benchmarked |
| Strict CSP / no-eval | [full JS expressions](./csp) | [restricted subset](https://alpinejs.dev/advanced/csp) | none |
| Reactivity | pluggable signals ([TC39-track](https://github.com/tc39/proposal-signals)) | bundled @vue/reactivity | bundled @vue/reactivity |
| Keyed lists | automatic (by identity) | manual `:key` | manual `:key` |
| Debounce, throttle, key filters | built-in [modifiers](https://github.com/dy/sprae#modifiers) | plugin packages | none |
| Dependencies | 0 | 0 (Vue reactivity inlined) | 0 (Vue reactivity inlined) |
| Status | active, 0 open issues | active | frozen — last release Jan 2022 |
| License | MIT | MIT | MIT |

<small>Sizes current as of 2026-07-28 (sprae 13.8.4, Alpine 3.15.12, petite-vue 0.4.1); CPU speed, memory and first paint are from a full benchmark run at sprae 13.8.4 — see [Methodology](#methodology).</small>

## Performance

Median times in ms (lower is better), [js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/) keyed suite, full run 2026-07-28 at sprae v13.8.4 vs Alpine v3.14.7, identical machine and Chrome 147:

| benchmark | sprae | Alpine | ratio |
|---|---|---|---|
| create 1,000 rows | 29.7 | 67.7 | 2.28× |
| replace all rows | 32.2 | 83.4 | 2.59× |
| partial update (every 10th) | 19.8 | 22.4 | 1.13× |
| select row | 7.4 | 41.4 | 5.59× |
| swap rows | 20.8 | 38.1 | 1.83× |
| remove row | 19.0 | 22.0 | 1.16× |
| create 10,000 rows | 339.8 | 737.5 | 2.17× |
| append 1,000 rows | 35.1 | 78.5 | 2.24× |
| clear rows | 15.6 | 64.4 | 4.13× |
| **geometric mean** | | | **2.27×** |
| memory after create 1,000 rows | 5.1MB | 16.6MB | 3.27× |
| first paint | 75.5 | 106.5 | 1.41× |
| transferred size (benchmark app) | 10.0kb | 14.7kb | 1.47× |

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

Sizes measured 2026-07-28, unpkg default build of each package (sprae 13.8.4, Alpine 3.15.12, petite-vue 0.4.1):

```sh
curl -sL https://unpkg.com/sprae      | gzip -9 | wc -c   # 10947
curl -sL https://unpkg.com/alpinejs   | gzip -9 | wc -c   # 16694
curl -sL https://unpkg.com/petite-vue | gzip -9 | wc -c   #  7061
```

sprae's ESM build (`sprae.js`) is smaller — 9.9kb gzip, 9.1kb brotli — if you import it directly.

Performance: [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) official webdriver-ts harness, both frameworks on the same machine, Chrome 147, 15 samples per benchmark, medians reported — full run 2026-07-28 at sprae v13.8.4 vs Alpine v3.14.7 (the Alpine version pinned by the benchmark's own implementation). Memory is the harness's GC'd heap after create-1k; transferred size and first paint are measured by the harness itself.
