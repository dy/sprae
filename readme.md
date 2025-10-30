# ∴ spræ [![tests](https://github.com/dy/sprae/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/sprae/actions/workflows/node.js.yml) [![npm bundle size](https://img.shields.io/bundlephobia/minzip/sprae?color=white)](https://bundlephobia.com/package/sprae) [![npm](https://img.shields.io/npm/v/sprae?color=0969da)](https://www.npmjs.com/package/sprae)

<em>S</em>imple <em>pr</em>ogressive <em>æ</em>nhancement for DOM or JSX with reactive attributes.

[**website**](https://dy.github.io/sprae)  ⋮  [**docs**](https://dy.github.io/sprae/docs)  ⋮  [**examples**](https://dy.github.io/sprae/drops)

<!--
### Flavors

* [sprae.js](dist/sprae.js) – ESM.
* [sprae.umd.js](dist/sprae.umd.js) – CJS / UMD / standalone with autoinit.
* [sprae.micro.js](dist/sprae.micro.js) – <2.5kb [micro version](#micro).
-->
<!-- * sprae.async.js - sprae with async events -->
<!-- * sprae.alpine.js - alpine sprae, drop-in alpinejs replacement -->
<!-- * sprae.vue.js - vue sprae, drop-in petite-vue replacement -->
<!-- * sprae.preact.js - sprae with preact-signals -->


## Usage

`npm install sprae` or `<script src="https://unpkg.com/sprae"></script>`.

**Autoinit**:

```html
<div id="counter" :scope="{count: 1}">
  <p :text="`Clicked ${count} times`"></p>
  <button :onclick="count++">Click me</button>
</div>

<script src="./sprae.js" start="#counter"></script>
```

**Manual**:

```js
import sprae from 'sprae'
const state = sprae(document.getElementById('counter'), { count: 0 })
state.count++
```


## Directives

[`:text`](docs.md#text), [`:class`](docs.md#class), [`:style`](docs.md#style), [`:value`](docs.md#value), [`:<attr>`](docs.md#attr), [`:if`](docs.md#if)/[`:else`](docs.md#else), [`:each`](docs.md#each), [`:scope`](docs.md#scope), [`:fx`](docs.md#fx), [`:ref`](docs.md#ref), [`:on<event>`](docs.md#onevent)

_Timing_: [`.debounce`](docs.md#debounce), [`.throttle`](docs.md#throttle), [`.tick`](docs.md#tick), [`.raf`](docs.md#raf), [`.once`](docs.md#once).<br>
_Target_: [`.window`](docs.md#targets), [`.document`](docs.md#targets), [`.root`](docs.md#targets), [`.body`](docs.md#targets), [`.parent`](docs.md#targets), [`.self`](docs.md#targets), [`.outside`](docs.md#targets).<br>
_Events_: [`.passive`](docs.md#events), [`.capture`](docs.md#events), [`.prevent`](docs.md#prevent), [`.stop`](docs.md#stop), [`.immediate`](docs.md#stop), [`.<key>`](docs.md#key-filters).

<!--
## Micro

Micro sprae version is 2.5kb bundle with essentials:

* no multieffects `:a:b`
* no modifiers `:a.x.y`
* no sequences `:ona..onb`
* no `:each`, `:if`, `:value`
-->

<!--
## FAQ

1. Errors handling?
2. Typescript support?
3. Performance tips?
-->


## Why spræ?

<!--
Modern frontend is like processed food – heavy, unhealthy and make you bloat.<br/>
Frameworks come with tooling, setups, proprietary conventions, artificial abstractions and ecosystem lock-in.<br/>
Progressive enhancement became anachronism.

Native [template-parts](https://github.com/github/template-parts) and [DCE](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md) is healthy alternative, but stuck with HTML quirks [1](https://github.com/github/template-parts/issues/24), [2](https://github.com/github/template-parts/issues/25), [3](https://shopify.github.io/liquid/tags/template/#raw).

[Alpine](https://github.com/alpinejs/alpine) and [petite-vue](https://github.com/vuejs/petite-vue) offer progressive enhancement, but clutter syntax (`x-`, `@`, `$`, `{{}}` etc.) and limit integration [1](https://github.com/alpinejs/alpine/discussions/3223).
-->

Minimalist: single prefix, valid HTML, signals reactivity, open state, build-free. Lightweight UI in prototypes, static sites, micro-frontends, anywhere.

<!--
|                       | [AlpineJS](https://github.com/alpinejs/alpine)          | [Petite-Vue](https://github.com/vuejs/petite-vue)        | Sprae            |
|-----------------------|-------------------|-------------------|------------------|
| _Size_              | ~10KB             | ~6KB              | ~5KB             |
| _Memory_            | 5.05             | 3.16              | 2.78             |
| _Performance_       | 2.64             | 2.43              | 1.76             |
| _CSP_               | Limited                | No                | Yes              |
| _SSR_ | No | No | No |
| _Evaluation_        | [`new AsyncFunction`](https://github.com/alpinejs/alpine/blob/main/packages/alpinejs/src/evaluator.js#L81) | [`new Function`](https://github.com/vuejs/petite-vue/blob/main/src/eval.ts#L20) | [`new Function`]() / [justin](https://github.com/dy/subscript)           |
| _Reactivity_        | `Alpine.store`    | _@vue/reactivity_   | _signals_ |
| _Sandboxing_        | No                | No                | Yes              |
| _Directives_ | `:`, `x-`, `{}` | `:`, `v-`, `@`, `{}` | `:` |
| _Magic_               | `$data` | `$app`   | - |
| _Fragments_ | Yes | No | Yes |
| _Plugins_ | Yes | No | Yes |
| _Modifiers_ | Yes | No | Yes |

_Nested directives_ Yes
_Inline directives_ Yes
-->

<!--
### Drops

* ToDo MVC: [demo](https://dy.github.io/sprae/examples/todomvc), [code](https://github.com/dy/sprae/blob/main/examples/todomvc.html)
* JS Framework Benchmark: [demo](https://dy.github.io/sprae/examples/js-framework-benchmark), [code](https://github.com/dy/sprae/blob/main/examples/js-framework-benchmark.html)
* Wavearea: [demo](https://dy.github.io/wavearea?src=//cdn.freesound.org/previews/586/586281_2332564-lq.mp3), [code](https://github.com/dy/wavearea)
* Carousel: [demo](https://rwdevelopment.github.io/sprae_js_carousel/), [code](https://github.com/RWDevelopment/sprae_js_carousel)
* Tabs: [demo](https://rwdevelopment.github.io/sprae_js_tabs/), [code](https://github.com/RWDevelopment/sprae_js_tabs?tab=readme-ov-file)-->
<!-- * Prostogreen [demo](https://web-being.org/prostogreen/), [code](https://github.com/web-being/prostogreen/) -->

<!--
## See Also

* [nadi](https://github.com/dy/nadi) - 101 signals. -->


Inspired by [alpine](https://github.com/alpinejs/alpine), [petite-vue](https://github.com/vuejs/petite-vue) and others. <!--[lucia](https://github.com/aidenybai/lucia), [nuejs](https://github.com/nuejs/nuejs), [hmpl](https://github.com/hmpl-language/hmpl), [unpoly](https://unpoly.com/up.link), [dagger](https://github.com/dagger8224/dagger.js)-->


<p align="center"><a href="https://github.com/krsnzd/license/">ॐ</a></p>
