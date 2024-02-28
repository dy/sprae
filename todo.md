* [x] finish directives
* [x] better list diffing
* [x] ordered directives init (:each + :if vs :if + :each) -> find out if really needed and which is faster
  -> yes, needed and solve many init issues.
* [?] autoinit -> too much maintenance burden
* [x] node tests
* [x] better deps updating -> cumulative signal
* [x] combinations: :else :if
* [x] :each :if, :if :each
* [x] :each :each
* [x] :with must be able to write state value as well
* [x] docs: give example to each directive
* [x] initialize per-element: <x :each><y :if></y><x> - tree-dependent (:each comes first).
* [x] generalize common attributes :prop="xyz"
* [x] spread props
* [x] optimization: arrays with multiple elements can be slow on creation. Maybe signal-struct must ignore arrays.
  -> yep: arrays are rarely changed as `a[i]=newItem` and regularly they're mapped.
* [x] expand to any subscribables: both as state vars
* [x] :ref
* [x] :ref + :each
* [x] event chains :ona-onb
* [x] bulk events :ona:onb
* [x] multiprop setter :a:b="c"
* [x] make `this` in expression an element
  * ~~[x] replace :ref with :with="this as x"~~
* [x] :ref creates instance in current state, not creates a new state
  * [x] to avoid extending signal-struct, we must collect state data before, and call updates after for extended state
* [x] optimization: replace element-props with direct (better) setters
  * [x] Make sure `false` gets serialized, not removes attr
* [x] Sandbox expressions: no global, no "scope" object name, no "arguments"
* ~~[x] report usignal problem~~ author is not really interested
* [x] `this` doesn't refer to element/scope in event handlers
* [x] :text="" empty values shouldn't throw
* [x] implement :with
* [x] update :value without losing focus / position
* ~~[x] run tiredown if element got removed from condition or loop (free memory)~~ no need just make sure no refs to elements stored
* [x] `sprae(el, newState)` can update element's state directly (as batch!?) -> must be tested against repeats in directives
* [x] :if :ref, :if :with -> context setters must come first always
* [x] :style="{'--x':value}"
* [x] :onkeydown.ctrl-alt-D
* [x] examples
  * [x] todomvc
  * [x] waveplay
* [x] evt modifiers
  * [x] once, capture, passive
  * [x] ...rest
* [x] parallel chains
* [x] Sandbox
* [x] Autorun
* [x] There's some bug with prostogreen not triggering effect. (caused by special array.length case)
* [x] Getters must become evaluable
* [x] `<li :each="item in items" :with="{collapsed:true}"><button :onclick='e=>collapsed=false'></li>`
* [x] ~~`:with="{likes:[], like(){ /* likes should not be undefined here */ }}"`~~ nah, it's fine
* [x] Reduce memory leak - via jsbenchmark example
  * [x] make disposers
  * [x] make sure internals are disposed as well
* [x] frameworks benchmark -> contrib to krausest
* [x] fix swapping rows error
* [x] make use of actual swapdom
* [x] fix removing last row issue
* [x] optimization:
  * [x] faster create rows
  * [x] faster replace all rows
  * [x] fix remove row perf issue
* [x] Make signals-proxy state actually lazy-init (now it's not)
* [x] Fix multiple `.push` cycle problem
* [x] ~~Make regular proxy state not causing infinite recursion~~ we don't hold to own proxy now
* [x] All FIXMEs
* [x] ~~Avoid creating signals for static values~~ -> v9 avoids that
* [ ] Figure out `arr.push()` - do we need to ever have calls as signals?

### [ ] v9

* [x] subscript-based eval
  * [x] make `a in b` via subscript
* [x] no store
* [x] switching signals
* [x] get rid of `@` events
* [ ] plugins: extensible directives
* [x] comparison table: CSP, plugins, no-deps, size, performance, event/modifiers,
* [~] add :html directive as replacement for :render, with tests
* [x] rename :with to :scope
* [x] :fx=fx
* [x] make signals tests (nested effects)
* [x] try direct directives without primary/secondary
* [x] split directives
* [x] switchable compiler
* [x] clear exports (no parse, err) - make sense of `compile` function as exported
* [ ] template test (:text, :html, :if, :each)
* [ ] flatten API, API to docs: `./core` (custom build), `./sprae` (default entry)
  * [ ] make CSP a docs config, not entry
* [ ] customizable swapper
* [ ] fx teardown
* [ ] `sprae.*` instead of `.use`, extending docs: directive, compile, swap, signals
  * [ ] no-signals (signals are pluggable): better teardown flow; returns dispose fn, not state; pluggable ulive; signals from original source, not sprae
* [ ] 0-code sandbox (stub props)
* [ ] :each that keeps elements
* [ ] interpolatable strings
* [ ] Plugins
  * [ ] :aria
  * [ ] :data
  * [ ] :item
* [ ] fix examples
* [ ] all FIXMEs
* [ ] move proxy state into own project / part of signal struct (with tests from here)
* [ ] make cross-version testing: sprae, csp, signals variations
