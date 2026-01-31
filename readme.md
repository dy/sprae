# [∴](https://dy.github.io/sprae) spræ [![tests](https://github.com/dy/sprae/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprae/actions/workflows/node.js.yml) ![size](https://img.shields.io/badge/size-~5kb-white) [![npm](https://img.shields.io/npm/v/sprae?color=white)](https://www.npmjs.com/package/sprae)

Ræctive sprinkles for HTML/JSX

## usage

```html
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

<script type="module" src="//unpkg.com/sprae"></script>
```

## [docs](docs.md)

<!-- [start](docs.md#start)  [store](docs.md#store)  [signals](docs.md#signals)  [evaluator](docs.md#evaluator)  [jsx](docs.md#jsx)  [build](docs.md#custom-build)  [hints](docs.md#hints) -->

[`:text`](docs.md#text) [`:class`](docs.md#class) [`:style`](docs.md#style) [`:value`](docs.md#value) [`:<attr>`](docs.md#attr-) [`:if :else`](docs.md#if-else) [`:each`](docs.md#each) [`:scope`](docs.md#scope) [`:fx`](docs.md#fx) [`:ref`](docs.md#ref) [`:hidden`](docs.md#hidden) [`:portal`](docs.md#portal) [`:on<event>`](docs.md#onevent)

[`.debounce`](docs.md#debounce-ms) [`.throttle`](docs.md#throttle-ms) [`.delay`](docs.md#tick) [`.once`](docs.md#once)<br>
[`.window`](docs.md#window-document-body-root-parent-away-self) [`.document`](docs.md#window-document-body-root-parent-away-self) [`.root`](docs.md#window-document-body-root-parent-away-self) [`.body`](docs.md#window-document-body-root-parent-away-self) [`.parent`](docs.md#window-document-body-root-parent-away-self) [`.self`](docs.md#window-document-body-root-parent-away-self) [`.away`](docs.md#window-document-body-root-parent-away-self)<br>
[`.passive`](docs.md#passive-captureevents-only) [`.capture`](docs.md#passive-captureevents-only) [`.prevent`](docs.md#prevent-stop-immediateevents-only) [`.stop`](docs.md#prevent-stop-immediateevents-only) [`.<key>`](docs.md#key-filters)


## vs alpine

|                  | [Alpine](https://github.com/alpinejs/alpine) | Sprae |
|------------------|--------|-------|
| _Size_           | ~16kb | ~5kb |
| _Performance_    | ~2× | 1.00× |
| _CSP_            | Limited | Full |
| _Reactivity_     | Custom | [Signals](docs.md#signals) |
| _Sandboxing_     | No | Yes |
| _TypeScript_     | Partial | Full |
| _JSX/SSR_        | No | [Yes](docs.md#jsx) |
| _Prefix_         | `x-`, `:`, `@` | [Customizable](docs.md#custom-build) |

<sub>Performance from [js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/current.html). CSP via [jessie](docs.md#evaluator) evaluator.</sub>

→ [Migration guide](alpine.md)


## used by

[watr](https://dy.github.io/watr/play), [wavearea](https://dy.github.io/wavearea)
<!-- , [maetr](), [settings-panel]() -->


<!--
[lucia](https://github.com/aidenybai/lucia), [nuejs](https://github.com/nuejs/nuejs), [hmpl](https://github.com/hmpl-language/hmpl), [unpoly](https://unpoly.com/up.link), [dagger](https://github.com/dagger8224/dagger.js), [petite-vue](https://github.com/vuejs/petite-vue)

### Drops

* ToDo MVC: [demo](https://dy.github.io/sprae/examples/todomvc), [code](https://github.com/dy/sprae/blob/main/examples/todomvc.html)
* JS Framework Benchmark: [demo](https://dy.github.io/sprae/examples/js-framework-benchmark), [code](https://github.com/dy/sprae/blob/main/examples/js-framework-benchmark.html)
* Wavearea: [demo](https://dy.github.io/wavearea?src=//cdn.freesound.org/previews/586/586281_2332564-lq.mp3), [code](https://github.com/dy/wavearea)
* Carousel: [demo](https://rwdevelopment.github.io/sprae_js_carousel/), [code](https://github.com/RWDevelopment/sprae_js_carousel)
* Tabs: [demo](https://rwdevelopment.github.io/sprae_js_tabs/), [code](https://github.com/RWDevelopment/sprae_js_tabs?tab=readme-ov-file)-->
<!-- * Prostogreen [demo](https://web-being.org/prostogreen/), [code](https://github.com/web-being/prostogreen/) -->

<p align='center'>
<a href="https://krishnized.github.io/license">ॐ</a>
</p>
