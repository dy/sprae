# [∴](https://dy.github.io/sprae) spræ [![tests](https://github.com/dy/sprae/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprae/actions/workflows/node.js.yml) ![size](https://img.shields.io/badge/size-~6kb-white) [![npm](https://img.shields.io/npm/v/sprae?color=white)](https://www.npmjs.com/package/sprae)

Microhydration for HTML/JSX tree.

## usage

```html
<!-- Day/Night switch -->
<div :scope="{ isDark: false }">
  <button :onclick="isDark = !isDark">
    <span :text="isDark ? '🌙' : '☀️'"></span>
  </button>
  <div :class="isDark ? 'dark' : 'light'">Welcome to Spræ!</div>
</div>

<style>
  .light { background: #fff; color: #000; }
  .dark { background: #333; color: #fff; }
</style>

<script type="module" src="//unpkg.com/sprae"></script>
```

## why

Wanted alpine but with less syntax and magic, and with open state.

## [docs](docs.md)

#### directives
[`:text`](docs.md#text) [`:class`](docs.md#class) [`:style`](docs.md#style) [`:value`](docs.md#value) [`:<attr>`](docs.md#attr-) [`:if :else`](docs.md#if-else) [`:each`](docs.md#each) [`:scope`](docs.md#scope) [`:fx`](docs.md#fx) [`:ref`](docs.md#ref) [`:hidden`](docs.md#hidden) [`:portal`](docs.md#portal) [`:on<event>`](docs.md#onevent)

#### modifiers
[`.debounce`](docs.md#debounce-ms) [`.throttle`](docs.md#throttle-ms) [`.delay`](docs.md#tick) [`.once`](docs.md#once)<br>
[`.window`](docs.md#window-document-body-root-parent-away-self) [`.document`](docs.md#window-document-body-root-parent-away-self) [`.root`](docs.md#window-document-body-root-parent-away-self) [`.body`](docs.md#window-document-body-root-parent-away-self) [`.parent`](docs.md#window-document-body-root-parent-away-self) [`.self`](docs.md#window-document-body-root-parent-away-self) [`.away`](docs.md#window-document-body-root-parent-away-self)<br>
[`.passive`](docs.md#passive-captureevents-only) [`.capture`](docs.md#passive-captureevents-only) [`.prevent`](docs.md#prevent-stop-immediateevents-only) [`.stop`](docs.md#prevent-stop-immediateevents-only) [`.<key>`](docs.md#key-filters)

#### core

[start](docs.md#start) [store](docs.md#store) [signals](docs.md#signals) [config](docs.md#configuration) [evaluator](docs.md#evaluator) [jsx](docs.md#jsx) [build](docs.md#custom-build) [hints](docs.md#hints)


<!--
## vs alpine

|                  | [alpine](alpine.md) | sprae |
|------------------|--------|-------|
| _size_           | ~16kb | ~6kb |
| _performance_    | ~2× slower | 1.00× |
| _CSP_            | limited | full |
| _reactivity_     | custom | [signals](docs.md#signals) |
| _sandboxing_     | no | yes |
| _typescript_     | partial | full |
| _JSX/SSR_        | no | [yes](docs.md#jsx) |
| _prefix_         | `x-`, `:`, `@` | `:` or [custom](docs.md#custom-build) |

<sup>[benchmark](https://krausest.github.io/js-framework-benchmark/current.html). CSP via [jessie](docs.md#evaluator).</sup>
-->

## used by

[settings-panel](https://dy.github.io/settings-panel), [watr](https://dy.github.io/watr/play), [wavearea](https://dy.github.io/wavearea)
<!-- , [maetr](), [settings-panel]() -->

## alternatives

<sup>[alpine](https://github.com/alpinejs/alpine), [petite-vue](https://github.com/vuejs/petite-vue), [lucia](https://github.com/aidenybai/lucia), [nuejs](https://github.com/nuejs/nuejs), [hmpl](https://github.com/hmpl-language/hmpl), [unpoly](https://unpoly.com/up.link), [dagger](https://github.com/dagger8224/dagger.js)</sup>

<br><br>
<!--
### Drops

* ToDo MVC: [demo](https://dy.github.io/sprae/examples/todomvc), [code](https://github.com/dy/sprae/blob/main/examples/todomvc.html)
* JS Framework Benchmark: [demo](https://dy.github.io/sprae/examples/js-framework-benchmark), [code](https://github.com/dy/sprae/blob/main/examples/js-framework-benchmark.html)
* Wavearea: [demo](https://dy.github.io/wavearea?src=//cdn.freesound.org/previews/586/586281_2332564-lq.mp3), [code](https://github.com/dy/wavearea)
* Carousel: [demo](https://rwdevelopment.github.io/sprae_js_carousel/), [code](https://github.com/RWDevelopment/sprae_js_carousel)
* Tabs: [demo](https://rwdevelopment.github.io/sprae_js_tabs/), [code](https://github.com/RWDevelopment/sprae_js_tabs?tab=readme-ov-file)
* Prostogreen [demo](https://web-being.org/prostogreen/), [code](https://github.com/web-being/prostogreen/) 
-->

<p align='center'>
<a href="https://krishnized.github.io/license">ॐ</a>
</p>
